// src/components/ui/packingui.js
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Card from "./Card";

// Unit type labels configuration
export const unitTypeLabels = {
  "Tablet / Capsule (Strip Based)": {
    pack_strip: "Strips in a Pack",
    strip_tablet: "Tablets in a Strip",
  },
  "Tablet / Capsule (Bottle Based) Full Pack": {
    pack_strip: "Tablets in a Bottle",
  },
  "Liquid (Syrup / Drops)": {
    total_pack: "Number of Bottles",
  },
  "Injection / IV (Box Based)": {
    pack_strip: "Injections in a Box",
  },
  "Cream / Ointment / Gel": {
    total_pack: "Number of Tubes or Containers",
  },
  "Devices / Inhalers / Sprays": {
    total_pack: "Number of Units",
  },
  "Tablet / Capsule (Loose Strips)": {
    strip_tablet: "Number of Tablets in a Strip",
  },
  "Strip or Bottle based (Loose Tablets)": {
    total_strip: "Number of Loose Tablets/Capsules",
  },
  "Tablet / Capsule (Bottle Based)": {
    pack_strip: "Tablets in a Bottle",
  },
  "Injection / IV (Unit Based)": {
    total_pack: "Number of Units",
  },
  "Units (Box Based)": {
    total_pack: "Number of Units in a Box",
  },
  "Refrigerated Based unit": {
    total_pack: "Number of Units",
  },
  "Patches Suppositories and other medical items": {
    total_pack: "Number of Units",
  },
  "Respiratory Therapeutic Devices": {
    total_pack: "Number of Units",}
};

// Format packing for display
export const formatPacking = (packing) => {
  if (!packing) return "—";

  const { total_pack, pack_strip, strip_tablet, total_strip } = packing;

  if (total_pack > 0 && pack_strip > 0 && strip_tablet > 0) {
    return `${pack_strip}x${strip_tablet} Tabs (${total_pack} Packs)`;
  }
  if (total_strip > 0) {
    return `${total_strip} Strip${total_strip > 1 ? 's' : ''}`;
  }
  return "—";
};

// Format general packing
export const formatGeneralPacking = (packing) => {
  if (!packing) return "—";

  let parts = [];

  if (packing.pack_size) parts.push(`${packing.pack_size}`);

  if (packing.product_size) {
    if (parts.length > 0) {
      parts.push(`x ${packing.product_size}`);
    } else {
      parts.push(`${packing.product_size}`);
    }
  }

  if (packing.unit_type) {
    if (parts.length > 0) {
      parts.push(`(${packing.unit_type})`);
    } else {
      parts.push(packing.unit_type);
    }
  }

  return parts.join(' ') || "—";
};

// Check if packing is general type
export const isGeneralPacking = (packing) => 
  packing && ('pack_size' in packing || 'total_packs' in packing || 'product_size' in packing || 'unit_type' in packing);

// Humanize key for display
export const humanizeKey = (key) => {
  return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

// Get packaging preview text
export const getPackagingPreview = (packing, unitType) => {
  if (!packing || Object.values(packing).every(val => val === 0 || val == null)) return "N/A";

  if (isGeneralPacking(packing)) {
    let preview = formatGeneralPacking(packing);
    if (preview === "—") return "N/A";
    if (preview.length > 10) {
      return preview.slice(0,7) + '...';
    }
    return preview;
  } else {
    const labels = unitTypeLabels[unitType] || {};
    let preview = '';

    if (packing.total_pack > 0 && labels.total_pack) {
      preview += `${packing.total_pack} ${labels.total_pack.slice(0, 3)}...`;
    } else if (packing.pack_strip > 0 && labels.pack_strip) {
      preview += `${packing.pack_strip} ${labels.pack_strip.slice(0, 3)}...`;
    } else if (packing.strip_tablet > 0 && labels.strip_tablet) {
      preview += `${packing.strip_tablet} ${labels.strip_tablet.slice(0, 3)}...`;
    } else if (packing.total_strip > 0 && labels.total_strip) {
      preview += `${packing.total_strip} ${labels.total_strip.slice(0, 3)}...`;
    }

    return preview || "Vie...";
  }
};

// Get packaging table content
export const getPackagingTable = (packing, unitType) => {
  let detailsContent;

  if (!packing || Object.values(packing).every(val => val === 0 || val == null)) {
    detailsContent = <p className="text-gray-500">No packaging details available.</p>;
  } else if (isGeneralPacking(packing)) {
    const entries = Object.entries(packing)
      .filter(([key, val]) => val != null && val !== '' && key !== 'total_packs' && val !== 0);

    if (entries.length === 0) {
      detailsContent = <p className="text-gray-500">No detailed packaging info.</p>;
    } else {
      detailsContent = (
        <table className="w-full text-sm text-left text-gray-700">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 font-bold">Field</th>
              <th className="px-4 py-2 font-bold">Value</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([key, value]) => (
              <tr key={key} className="border-b">
                <td className="px-4 py-2">{humanizeKey(key)}</td>
                <td className="px-4 py-2 font-medium">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
  } else {
    const labels = unitTypeLabels[unitType] || {};
    const allowedKeys = Object.keys(labels);
    const entries = Object.entries(packing)
      .filter(([key, val]) => val > 0 && allowedKeys.includes(key));

    if (entries.length === 0) {
      detailsContent = <p className="text-gray-500">No detailed packaging info.</p>;
    } else {
      detailsContent = (
        <table className="w-full text-sm text-left text-gray-700">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 font-bold">Field</th>
              <th className="px-4 py-2 font-bold">Value</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([key, value]) => (
              <tr key={key} className="border-b">
                <td className="px-4 py-2">{labels[key]}</td>
                <td className="px-4 py-2 font-medium">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
  }

  return (
    <>
    
      {detailsContent}
    </>
  );
};

// Generic Hover Tooltip component
export const HoverTooltip = ({ text, title = "Details", maxLength = 30 }) => {
  if (!text || text.trim() === "") return <span className="text-gray-400">—</span>;

  const words = text.trim().split(/\s+/);
  const preview = words.slice(0, 3).join(" ") + (words.length > 3 ? "..." : "");

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <span
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="text-blue-600 hover:underline cursor-help text-sm"
      >
        {preview}
      </span>

      {isOpen &&
        createPortal(
          <div className="fixed inset-0 flex items-center justify-center z-[999999] pointer-events-none">
            <Card 
              className="max-w-2xl max-h-[80vh] overflow-y-auto pointer-events-auto"
              title={title}
              titleClassName="text-center border-b pb-3"
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
                {text}
              </p>
            </Card>
          </div>,
          document.body
        )}
    </div>
  );
};

// Packing Hover Tooltip component
export const HoverTooltipPacking = ({ children, preview, title = "Details" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hover, setHover] = useState(false);
  
  useEffect(() => {
    let openTimer, closeTimer;
    if (hover) {
      closeTimer = clearTimeout(closeTimer);
      openTimer = setTimeout(() => setIsOpen(true), 150);
    } else {
      openTimer = clearTimeout(openTimer);
      closeTimer = setTimeout(() => setIsOpen(false), 300);
    }
    return () => {
      clearTimeout(openTimer);
      clearTimeout(closeTimer);
    };
  }, [hover]);
  
  return (
    <div className="relative inline-block">
      <span
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className="text-blue-600 hover:underline cursor-help text-sm"
      >
        {preview}
      </span>
      {isOpen &&
        createPortal(
          <div className="fixed inset-0 flex items-center justify-center z-[999999] pointer-events-none">
            <Card 
              className="max-w-2xl max-h-[80vh] overflow-y-auto pointer-events-auto"
              title={title}
              titleClassName="text-center border-b pb-3"
            >
              {children}
            </Card>
          </div>,
          document.body
        )}
    </div>
  );
};

// Packing Display component (combines everything)
export const PackingDisplay = ({ packing, unitType }) => {
  return (
    <HoverTooltipPacking 
      preview={getPackagingPreview(packing, unitType)} 
      title="Packaging Details"
    >
      {getPackagingTable(packing, unitType)}
    </HoverTooltipPacking>
  );
};

// Default export with all utilities
export default {
  unitTypeLabels,
  formatPacking,
  formatGeneralPacking,
  isGeneralPacking,
  humanizeKey,
  getPackagingPreview,
  getPackagingTable,
  HoverTooltip,
  HoverTooltipPacking,
  PackingDisplay,
};