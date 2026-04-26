import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Download } from 'lucide-react';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const CONSTANTS = {
  EMPTY_DASH: '-',
  EXPORT_CSV: 'csv',
  EXPORT_PDF: 'pdf',
  CSV_TYPE: 'text/csv;charset=utf-8;',
  PACKING_FIELDS: {
    TOTAL_PACK:    'total_pack',
    PACK_STRIP:    'pack_strip',
    STRIP_TABLET:  'strip_tablet',
    TOTAL_STRIP:   'total_strip',
    PACK_SIZE:     'pack_size',
    PRODUCT_SIZE:  'product_size',
    PRODUCT_MODEL: 'product_model',
    TOTAL_PACKS:   'total_packs',
    UNIT_TYPE:     'unit_type',
  },
  UNIT_TYPES: { BOTTLE: 'Bottle', LIQUID: 'Liquid' },
  HEADER_NAMES: {
    PACKING:         'packing',
    PACKING_DISPLAY: 'packing_display',
    ACTIONS:         'actions',
    UNIT_TYPE:       'unit_type',
    UNIT_TYPE_CAMEL: 'unitType',
    DRUG_NAME:       'drug_name',
    PRODUCT_NAME:    'product_name',
  },
  ERROR_MESSAGES: {
    NO_DATA:          'No data available to export',
    UNEXPECTED_ERROR: 'An unexpected error occurred',
    FAILED_EXPORT:    'Failed to export file',
  },
  CSV: { QUOTE: '"', ESCAPED_QUOTE: '""', SEPARATOR: ',', NEWLINE: '\n' },
  FORMATTING: {
    DATE_SEPARATOR:        'T',
    REPORT_NAME_SEPARATOR: '-',
    SPACE_REPLACER:        '-',
    MULTIPLE_SPACES_REGEX:  /\s+/g,
  },
  EXCLUDED_COLUMN_NAMES: [
    'actions','action','_action','options','operation','edit','delete','view',
  ],
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const normaliseHeader = (header) => {
  if (header && typeof header === 'object' && header.title && header.key) return header;
  const key   = String(header);
  const title = key
    .split(/[_\s]|(?=[A-Z])/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
  return { title, key };
};

const isExcluded = (title) =>
  CONSTANTS.EXCLUDED_COLUMN_NAMES.some(
    ex => title.toLowerCase() === ex || title.toLowerCase().includes(ex)
  );

const formatPackingForExport = (packing, unitType = '') => {
  const { EMPTY_DASH, PACKING_FIELDS, UNIT_TYPES } = CONSTANTS;
  if (!packing || Object.keys(packing).length === 0) return EMPTY_DASH;
  if (typeof packing === 'string') return packing;
  if (typeof packing === 'object') {
    const {
      [PACKING_FIELDS.TOTAL_PACK]:   total_pack   = 0,
      [PACKING_FIELDS.PACK_STRIP]:   pack_strip   = 0,
      [PACKING_FIELDS.STRIP_TABLET]: strip_tablet = 0,
      [PACKING_FIELDS.TOTAL_STRIP]:  total_strip  = 0,
    } = packing;
    if (
      PACKING_FIELDS.TOTAL_PACK   in packing || PACKING_FIELDS.PACK_STRIP   in packing ||
      PACKING_FIELDS.STRIP_TABLET in packing || PACKING_FIELDS.TOTAL_STRIP  in packing
    ) {
      if (total_pack > 0 && pack_strip > 0 && strip_tablet > 0)
        return `${pack_strip}x${strip_tablet} Tabs (${total_pack} Packs)`;
      if (total_strip > 0 && strip_tablet > 0)  return `${total_strip}x${strip_tablet} Tabs`;
      if (total_strip > 0) return `${total_strip} Strip${total_strip > 1 ? 's' : ''}`;
      if (pack_strip  > 0 && unitType?.includes(UNIT_TYPES.BOTTLE)) return `${pack_strip} Tablets in Bottle`;
      if (total_pack  > 0 && unitType?.includes(UNIT_TYPES.LIQUID)) return `${total_pack} Bottle${total_pack > 1 ? 's' : ''}`;
      const parts = [];
      if (total_pack   > 0) parts.push(`${total_pack} packs`);
      if (pack_strip   > 0) parts.push(`${pack_strip} strips`);
      if (strip_tablet > 0) parts.push(`${strip_tablet} tablets`);
      if (total_strip  > 0) parts.push(`${total_strip} total strips`);
      if (parts.length) return parts.join(', ');
    }
    const {
      [PACKING_FIELDS.PACK_SIZE]:     pack_size,
      [PACKING_FIELDS.PRODUCT_SIZE]:  product_size,
      [PACKING_FIELDS.PRODUCT_MODEL]: product_model,
      [PACKING_FIELDS.TOTAL_PACKS]:   total_packs = 0,
      [PACKING_FIELDS.UNIT_TYPE]:     unit_type,
    } = packing;
    if (
      PACKING_FIELDS.PACK_SIZE    in packing || PACKING_FIELDS.PRODUCT_SIZE  in packing ||
      PACKING_FIELDS.PRODUCT_MODEL in packing || PACKING_FIELDS.TOTAL_PACKS in packing
    ) {
      const parts = [];
      if (total_packs   > 0) parts.push(`${total_packs} pack${total_packs > 1 ? 's' : ''}`);
      if (pack_size)          parts.push(pack_size);
      if (product_size)       parts.push(parts.length ? `x ${product_size}`  : product_size);
      else if (product_model) parts.push(parts.length ? `x ${product_model}` : product_model);
      if (unit_type)          parts.push(`(${unit_type})`);
      return parts.join(' ') || EMPTY_DASH;
    }
    const nonEmpty = [];
    Object.entries(packing).forEach(([k, v]) => {
      if (v && v !== 0 && v !== '' && k !== PACKING_FIELDS.UNIT_TYPE) {
        const label = k.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        nonEmpty.push(`${label}: ${v}`);
      }
    });
    if (nonEmpty.length) return nonEmpty.join(', ');
  }
  return CONSTANTS.EMPTY_DASH;
};

const getCellValue = (row, key) => {
  const { HEADER_NAMES } = CONSTANTS;
  const unitType = row[HEADER_NAMES.UNIT_TYPE] || row[HEADER_NAMES.UNIT_TYPE_CAMEL] || '';
  if (key === HEADER_NAMES.PACKING && row[key])
    return formatPackingForExport(row[key], unitType);
  if (key === HEADER_NAMES.PACKING_DISPLAY)
    return row[key] || formatPackingForExport(row[HEADER_NAMES.PACKING], unitType);
  const val = row[key];
  if (val === null || val === undefined) return '';
  return String(val);
};

/**
 * sanitizePDF
 *
 * jsPDF's built-in Helvetica only covers Latin-1 (U+0000 – U+00FF).
 * Characters outside that range render as garbage ("  =  etc.).
 *
 * Root causes in your data:
 *   U+20A8  ₨  → appears as "   (rupee sign — not in Latin-1)
 *   U+00D7  ×  → appears as =   (multiply — technically IS Latin-1
 *                                but some PDF viewers mangle it)
 *   U+2013  –  → en-dash
 *   U+2014  —  → em-dash
 *   Smart quotes, ellipsis, etc.
 *
 * We swap every known offender for a plain ASCII equivalent, then
 * strip anything still above U+00FF as a safety net.
 */
const sanitizePDF = (raw) => {
  let s = String(raw == null ? '' : raw);

  // ── Currency ──────────────────────────────────────────────────────────────
  s = s.replace(/\u20A8/g, 'Rs.');   // ₨  Pakistani / Indian rupee sign
  s = s.replace(/\u20B9/g, 'Rs.');   // ₹  Indian rupee sign
  s = s.replace(/\u20AC/g, 'EUR ');  // €
  s = s.replace(/\u00A3/g, 'GBP ');  // £
  s = s.replace(/\u00A5/g, 'JPY ');  // ¥

  // ── Math / typographic ────────────────────────────────────────────────────
  s = s.replace(/\u00D7/g, 'x');     // ×  multiply sign
  s = s.replace(/\u00F7/g, '/');     // ÷  division sign
  s = s.replace(/\u2013/g, '-');     // –  en-dash
  s = s.replace(/\u2014/g, '-');     // —  em-dash
  s = s.replace(/\u2026/g, '...');   // …  ellipsis

  // ── Quotes ────────────────────────────────────────────────────────────────
  s = s.replace(/\u2018/g, "'");     // '  left single quotation mark
  s = s.replace(/\u2019/g, "'");     // '  right single quotation mark
  s = s.replace(/\u201C/g, '"');     // "  left double quotation mark
  s = s.replace(/\u201D/g, '"');     // "  right double quotation mark

  // ── Safety net: drop anything still outside Latin-1 ──────────────────────
  s = s.replace(/[\u0100-\uFFFF]/g, '');

  return s.trim();
};

// ─── COMPONENT ────────────────────────────────────────────────────────────────
const ExportReports = forwardRef(({ data, reportType = 'Report', headers, setError }, ref) => {
  const [exportingFormat, setExportingFormat] = useState(null);
  const [isDropdownOpen,  setIsDropdownOpen]  = useState(false);
  const dropdownRef = useRef(null);

  useImperativeHandle(ref, () => ({
    triggerExport: (format = 'pdf') => handleExport(format),
  }));

  useEffect(() => {
    const onOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setIsDropdownOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const getExportColumns = () => {
    if (headers && headers.length > 0)
      return headers.map(normaliseHeader).filter(h => !isExcluded(h.title));
    if (data && data.length > 0)
      return Object.keys(data[0]).filter(k => !isExcluded(k)).map(normaliseHeader);
    return [];
  };

  const handleExport = async (format) => {
    try {
      if (!data || (Array.isArray(data) && data.length === 0))
        throw new Error(CONSTANTS.ERROR_MESSAGES.NO_DATA);

      setExportingFormat(format);
      const columns = getExportColumns();
      if (!columns.length) throw new Error(CONSTANTS.ERROR_MESSAGES.NO_DATA);

      const dateStr        = new Date().toISOString().split(CONSTANTS.FORMATTING.DATE_SEPARATOR)[0];
      const safeReportType = reportType
        .toLowerCase()
        .replace(CONSTANTS.FORMATTING.MULTIPLE_SPACES_REGEX, CONSTANTS.FORMATTING.SPACE_REPLACER);
      const fileName = `${safeReportType}${CONSTANTS.FORMATTING.REPORT_NAME_SEPARATOR}${dateStr}`;

      // ── CSV ────────────────────────────────────────────────────────────────
      if (format === CONSTANTS.EXPORT_CSV) {
        const { QUOTE, ESCAPED_QUOTE, SEPARATOR, NEWLINE } = CONSTANTS.CSV;
        const esc = (val) => {
          const s = val == null ? '' : String(val);
          return `${QUOTE}${s.replace(new RegExp(QUOTE, 'g'), ESCAPED_QUOTE)}${QUOTE}`;
        };
        const rows = [
          columns.map(c => esc(c.title)).join(SEPARATOR),
          ...data.map(row => columns.map(c => esc(getCellValue(row, c.key))).join(SEPARATOR)),
        ].join(NEWLINE);
        triggerDownload(new Blob([rows], { type: CONSTANTS.CSV_TYPE }), `${fileName}.csv`);
      }

      // ── PDF (fully client-side, no backend) ───────────────────────────────
      else if (format === CONSTANTS.EXPORT_PDF) {
        const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
          import('jspdf'),
          import('jspdf-autotable'),
        ]);

        const doc  = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a3' });
        const pageW = doc.internal.pageSize.getWidth();

        // Header block
        doc.setFontSize(13);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(20);
        doc.text(sanitizePDF(reportType), pageW / 2, 28, { align: 'center' });

        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(110);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 44);
        doc.setTextColor(20);

        // Fixed column widths — text wraps DOWN not sideways
        const usableW      = pageW - 40;
        const WIDE_KEYS    = ['items', 'description', 'notes', 'address', 'detail', 'sold'];
        const NARROW_KEYS  = ['no', 'gst', 'type', 'return', '%', 'used'];
        const weights      = columns.map(c => {
          const t = c.title.toLowerCase();
          if (WIDE_KEYS.some(k => t.includes(k)))   return 3;
          if (NARROW_KEYS.some(k => t.includes(k))) return 0.6;
          return 1;
        });
        const totalW    = weights.reduce((a, b) => a + b, 0);
        const colWidths = weights.map(w => (w / totalW) * usableW);

        // Sanitize every cell value so no garbage characters appear
        const tableHead    = [columns.map(c => sanitizePDF(c.title))];
        const tableBody    = data.map(row =>
          columns.map(c => sanitizePDF(getCellValue(row, c.key)))
        );

        const columnStyles = columns.reduce((acc, _c, i) => {
          acc[i] = { cellWidth: colWidths[i], overflow: 'linebreak', halign: 'left', valign: 'middle' };
          return acc;
        }, {});

        autoTable(doc, {
          head:       tableHead,
          body:       tableBody,
          startY:     52,
          tableWidth: usableW,
          margin:     { top: 52, bottom: 30, left: 20, right: 20 },
          theme:      'grid',           // border around every cell

          styles: {
            fontSize:    7.5,
            cellPadding: 5,
            overflow:    'linebreak',   // wrap text vertically
            valign:      'middle',
            lineColor:   [190, 190, 190],
            lineWidth:   0.3,
            textColor:   [20, 20, 20],
            fillColor:   [255, 255, 255],
          },

          headStyles: {
            fillColor:  [50, 50, 50],   // dark grey
            textColor:  [255, 255, 255],
            fontStyle:  'bold',
            fontSize:   7.5,
            halign:     'center',
            valign:     'middle',
            lineColor:  [20, 20, 20],
            lineWidth:  0.4,
          },

          alternateRowStyles: {
            fillColor: [246, 246, 246], // very light grey stripe
          },

          columnStyles,

          didDrawPage: ({ pageNumber }) => {
            const total = doc.internal.getNumberOfPages();
            const pH    = doc.internal.pageSize.getHeight();
            doc.setFontSize(7);
            doc.setTextColor(140);
            doc.text(`Page ${pageNumber} of ${total}`, pageW / 2, pH - 10, { align: 'center' });
          },
        });

        doc.save(`${fileName}.pdf`);
      }
    } catch (err) {
      setError(err.message || CONSTANTS.ERROR_MESSAGES.FAILED_EXPORT);
    } finally {
      setExportingFormat(null);
    }
  };

  const triggerDownload = (blob, name) => {
    const url  = window.URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.setAttribute('download', name);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const isExporting = exportingFormat !== null;

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(o => !o)}
        disabled={isExporting}
        className={`
          bg-blue-600 hover:bg-blue-700 text-white
          px-2 sm:px-4 py-1.5 sm:py-2 rounded-md
          flex items-center gap-1 sm:gap-2 shadow-lg transition-all duration-200 text-sm sm:text-base
          ${isExporting ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl'}
          ${isDropdownOpen ? 'ring-2 ring-blue-300' : ''}
        `}
      >
        {isExporting ? (
          <>
            <svg className="animate-spin h-3 w-3 sm:h-4 sm:w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="hidden sm:inline">Exporting {exportingFormat.toUpperCase()}…</span>
            <span className="sm:hidden">{exportingFormat.toUpperCase()}</span>
          </>
        ) : (
          <>
            <Download className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden lg:inline">Export</span>
            <span className="lg:hidden">Exp</span>
            <svg
              className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {isDropdownOpen && !isExporting && (
        <div className="absolute right-0 mt-2 w-40 md:w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
          <button
            onClick={() => { setIsDropdownOpen(false); handleExport(CONSTANTS.EXPORT_PDF); }}
            className="w-full text-left px-3 md:px-4 py-2 text-xs md:text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center gap-2 transition-colors duration-150"
          >
            <svg className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span className="md:hidden">PDF</span>
            <span className="hidden md:inline">Export as PDF</span>
          </button>

          <button
            onClick={() => { setIsDropdownOpen(false); handleExport(CONSTANTS.EXPORT_CSV); }}
            className="w-full text-left px-3 md:px-4 py-2 text-xs md:text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center gap-2 transition-colors duration-150"
          >
            <svg className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="md:hidden">CSV</span>
            <span className="hidden md:inline">Export as CSV</span>
          </button>
        </div>
      )}
    </div>
  );
});

ExportReports.displayName = 'ExportReports';
export default ExportReports;