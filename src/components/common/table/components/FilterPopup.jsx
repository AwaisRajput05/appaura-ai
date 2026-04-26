import React, { memo, useState, useEffect, useRef } from 'react';
import { X, CheckCircle, RotateCcw, Save, Plus } from 'lucide-react';
import DatePicker from './../../../ui/forms/DatePicker';
import InputSelect from './../../../ui/forms/InputSelect';

/**
 * TagInput component for handling an array of string values (tags).
 */
const TagInput = memo(({ name, label, tags, onTagsChange }) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  const currentTags = Array.isArray(tags) ? tags : [];

  const handleAddTag = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const tag = inputValue.trim();
    if (tag && !currentTags.includes(tag)) {
      onTagsChange(tag);
      setInputValue('');
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAddTag(e);
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    onTagsChange(tagToRemove);
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="w-full text-md font-bold text-gray-700">{label}</label>
      <div className="flex items-center w-full">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type keyword and press Enter or +"
          maxLength={50}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-l text-sm focus:outline-none focus:ring-2 focus:ring-[#3C5690]"
        />
        <button
          type="button"
          onClick={handleAddTag}
          className="p-2 bg-gradient-to-r from-[#30426B] via-[#3C5690] to-[#5A75C7] text-white rounded-r hover:from-[#2a3a5e] hover:via-[#334c82] hover:to-[#5068b3] focus:outline-none focus:ring-4 focus:ring-[#5A75C7]/40 h-10 flex items-center justify-center transition-all duration-200 shadow-md"
          aria-label={`Add ${label} keyword`}
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 pt-1 min-h-[30px]">
        {currentTags.length > 0 ? (
          currentTags.map((tag) => (
            <span
              key={tag}
              className="flex items-center bg-gradient-to-r from-[#30426B]/10 to-[#5A75C7]/10 text-[#30426B] text-xs font-semibold px-3 py-1.5 rounded-full border border-[#3C5690]/30 shadow-sm transition-all duration-200"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="ml-2 text-[#30426B] hover:text-red-600 focus:outline-none transition-colors"
                aria-label={`Remove tag: ${tag}`}
              >
                <X size={14} />
              </button>
            </span>
          ))
        ) : (
          <p className="text-sm italic text-gray-500">No keywords added.</p>
        )}
      </div>
    </div>
  );
});

/**
 * FilterPopup component - Desktop absolute, Mobile modal
 */
export default memo(function FilterPopup({
  isOpen,
  onClose,
  filters,
  onChange,
  onApply,
  onClear,
  onSave,
  fields = [],
  title = '',
  useLiveFilter = false,
  onCheckboxToggle = () => {},
}) {
  if (!isOpen) return null;

  const popupRef = useRef(null);
  const firstFieldRef = useRef(null);
  const applyBtnRef = useRef(null);
  const clearBtnRef = useRef(null);
  const saveBtnRef = useRef(null);
  const closeBtnRef = useRef(null);
  const liveCheckboxRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => firstFieldRef.current?.focus(), 100);
      // Prevent body scroll on mobile when modal is open
      if (isMobile) {
        document.body.style.overflow = 'hidden';
      }
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isMobile]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e) => {
      const tag = e.target.tagName.toLowerCase();

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        applyBtnRef.current?.click();
        return;
      }

      if (e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveBtnRef.current?.click();
        return;
      }

      if (e.ctrlKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        clearBtnRef.current?.click();
        return;
      }

      if (e.key === 'Tab') {
        setTimeout(() => {
          const focusable = popupRef.current?.querySelectorAll(
            'input, select, button, [tabindex]:not([tabindex="-1"])'
          );
          if (!focusable) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }, 0);
      }

      if (tag === 'select' && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
      }
    };

    const popupEl = popupRef.current;
    if (popupEl) {
      popupEl.addEventListener('keydown', handleKey);
      return () => popupEl.removeEventListener('keydown', handleKey);
    }
  }, [isOpen, onClose, onApply, onClear, onSave]);

  // Custom onChange handler for DatePicker
  const handleDateChange = (name, date) => {
    const event = {
      target: {
        name: name,
        value: date,
        type: 'date'
      }
    };
    onChange(event);
  };

  // Custom onChange handler for InputSelect
  const handleCustomChange = (e) => {
    onChange(e);
  };

  const renderField = ({
    type,
    name,
    label,
    options,
    fromName,
    toName,
    min,
    max,
    step,
  }) => {
    const assignFirstRef = (el) => {
      if (!firstFieldRef.current && el) firstFieldRef.current = el;
    };

    switch (type) {
      case 'tags':
        const handleTagListChange = (tagValue) => {
          const currentTags = Array.isArray(filters[name]) ? filters[name] : [];
          let newTags;
          if (currentTags.includes(tagValue)) {
            newTags = currentTags.filter((tag) => tag !== tagValue);
          } else {
            newTags = [...currentTags, tagValue];
          }
          onChange({
            target: {
              name,
              value: newTags,
              isTagArray: true,
            },
          });
        };
        return (
          <div key={name} className="w-full">
            <TagInput
              name={name}
              label={label}
              tags={filters[name] || []}
              onTagsChange={handleTagListChange}
            />
          </div>
        );

      case 'text':
        return (
          <div key={name} className={`${isMobile ? 'flex flex-col gap-1' : 'flex items-center gap-2'}`}>
            <label htmlFor={`filter-${name}`} className={`${isMobile ? 'w-full' : 'w-32'} text-md font-bold text-gray-700`}>
              {label}
            </label>
            <input
              ref={assignFirstRef}
              id={`filter-${name}`}
              type="text"
              name={name}
              value={filters[name] || ''}
              onChange={onChange}
              maxLength={30}
              className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#3C5690] w-full"
            />
          </div>
        );

      case 'select':
        return (
          <div key={name} className={`${isMobile ? 'flex flex-col gap-1' : 'flex items-center gap-2'}`}>
            <label htmlFor={`filter-${name}`} className={`${isMobile ? 'w-full' : 'w-32'} text-md font-bold text-gray-700`}>
              {label}
            </label>
            <div className="flex-1 w-full">
              <InputSelect
                ref={assignFirstRef}
                name={name}
                label=""
                value={filters[name] || ''}
                onChange={handleCustomChange}
                inputClassName="text-sm py-2"
                className="mb-0"
              >
                <option value="">Select</option>
                {options.map((opt, index) => (
                  <option key={`${name}-${index}`} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </InputSelect>
            </div>
          </div>
        );

      case 'date':
        return (
          <div key={name} className={`${isMobile ? 'flex flex-col gap-1' : 'flex items-center gap-2'}`}>
            <label htmlFor={`filter-${name}`} className={`${isMobile ? 'w-full' : 'w-32'} text-md font-bold text-gray-700`}>
              {label}
            </label>
            <div className="flex-1 w-full">
              <DatePicker
                ref={assignFirstRef}
                label=""
                value={filters[name] || ''}
                onChange={(date) => handleDateChange(name, date)}
                className="w-full"
                inputClassName="text-sm py-2"
                placeholder="Select date"
              />
            </div>
          </div>
        );

      case 'range':
      case 'number':
        return (
          <div key={name} className={`${isMobile ? 'flex flex-col gap-1' : 'flex items-center gap-2'}`}>
            <label htmlFor={`filter-${name}`} className={`${isMobile ? 'w-full' : 'w-32'} text-md font-bold text-gray-700`}>
              {label}
            </label>
            <input
              ref={assignFirstRef}
              id={`filter-${name}`}
              type="number"
              name={name}
              value={filters[name] || ''}
              min={min}
              max={max}
              step={step}
              onChange={onChange}
              onInput={e => {
                if (e.target.value.length > 2) {
                  e.target.value = e.target.value.slice(0, 3);
                }
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#3C5690] w-full"
            />
          </div>
        );

      case 'dateRange':
        return (
          <div key={label} className="flex flex-col gap-2">
            <label className="text-md font-bold text-gray-700">{label}</label>
            <div className={`${isMobile ? 'flex flex-col gap-2' : 'flex items-center gap-2'} w-full`}>
              <div className="flex-1 w-full">
                <DatePicker
                  ref={assignFirstRef}
                  label=""
                  value={filters[fromName] || ''}
                  onChange={(date) => handleDateChange(fromName, date)}
                  className="w-full"
                  inputClassName="text-sm py-2"
                  placeholder="From date"
                />
              </div>
              <span className="text-gray-500 text-sm text-center">to</span>
              <div className="flex-1 w-full">
                <DatePicker
                  label=""
                  value={filters[toName] || ''}
                  onChange={(date) => handleDateChange(toName, date)}
                  className="w-full"
                  inputClassName="text-sm py-2"
                  placeholder="To date"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Desktop version (absolute positioned)
  if (!isMobile) {
    return (
      <div
        ref={popupRef}
        className="absolute top-18 left-34 z-50 rounded-lg border-2 border-[#3C5690] shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-popup-title"
      >
        <div className="absolute top-16 -left-2 w-4 h-4 bg-white border-t-4 border-l-4 border-[#3C5690] transform -rotate-45 z-40" />
        <div className="relative bg-white border border-gray-200 shadow-2xl rounded-lg w-[620px] p-5 z-50">
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="absolute -top-3 -right-3 bg-gradient-to-r from-[#30426B] via-[#3C5690] to-[#5A75C7] text-white rounded-full p-2 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#5A75C7]/50 transition-all shadow-lg"
            aria-label="Close filter popup"
          >
            <X size={18} />
          </button>

          <div className="flex flex-col space-y-4">
            {fields.map(renderField)}
          </div>

          {title === 'Analytic Report' && (
            <div className="text-xs text-gray-600 mt-4 px-1 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span>
                  <strong>Note:</strong> Analytic report fetches the last 30 days
                  of data with a threshold of 200. Change <strong>date</strong> or{' '}
                  <strong>threshold</strong> and enable the checkbox to fetch new
                  data.
                </span>
                <input
                  ref={liveCheckboxRef}
                  id="live-filter-toggle"
                  type="checkbox"
                  checked={useLiveFilter}
                  onChange={onCheckboxToggle}
                  className="ml-1 focus:ring-2 focus:ring-[#3C5690]"
                  aria-label="Enable live filter"
                />
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mt-6">
            <button
              ref={saveBtnRef}
              onClick={onSave}
              className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium bg-gradient-to-r from-[#30426B] to-[#3C5690] text-white rounded-lg hover:from-[#2a3a5e] hover:to-[#334c82] focus:outline-none focus:ring-4 focus:ring-[#5A75C7]/50 transition-all shadow-md"
              aria-label="Save filter"
            >
              <Save size={16} /> Save Filter
            </button>
            <div className="flex gap-3">
              <button
                ref={applyBtnRef}
                onClick={onApply}
                className="flex items-center gap-1.5 px-6 py-2.5 text-sm font-bold bg-gradient-to-r from-[#30426B] via-[#3C5690] to-[#5A75C7] text-white rounded-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#5A75C7]/50 transition-all transform hover:scale-105"
                aria-label="Apply filters"
              >
                <CheckCircle size={16} /> Apply
              </button>
              <button
                ref={clearBtnRef}
                onClick={onClear}
                className="flex items-center gap-1.5 px-6 py-2.5 text-sm font-medium border-2 border-[#3C5690] text-[#30426B] rounded-lg hover:bg-[#3C5690]/10 focus:outline-none focus:ring-4 focus:ring-[#5A75C7]/30 transition-all"
                aria-label="Clear filters"
              >
                <RotateCcw size={16} /> Clear
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mobile version (full screen modal)
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={popupRef}
        className="bg-white rounded-t-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with drag indicator and close button */}
        <div className="sticky top-0 bg-white border-b border-gray-200 z-10 rounded-t-2xl">
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto my-3" />
          <div className="flex justify-between items-center px-4 pb-3">
            <h3 className="text-lg font-bold text-gray-800">Filters</h3>
            <button
              onClick={onClose}
              className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex flex-col space-y-4">
            {fields.map(renderField)}
          </div>

          {title === 'Analytic Report' && (
            <div className="text-xs text-gray-600 mt-4 px-1 flex flex-col gap-2 bg-blue-50 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-xs">
                  <strong>Note:</strong> Analytic report fetches the last 30 days
                  of data with a threshold of 200. Change <strong>date</strong> or{' '}
                  <strong>threshold</strong> and enable the checkbox to fetch new
                  data.
                </span>
                <input
                  ref={liveCheckboxRef}
                  id="live-filter-toggle-mobile"
                  type="checkbox"
                  checked={useLiveFilter}
                  onChange={onCheckboxToggle}
                  className="mt-1 flex-shrink-0 focus:ring-2 focus:ring-[#3C5690]"
                  aria-label="Enable live filter"
                />
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col gap-3 mt-6 pb-4">
            <button
              ref={applyBtnRef}
              onClick={onApply}
              className="flex items-center justify-center gap-2 py-3 text-sm font-bold bg-gradient-to-r from-[#30426B] via-[#3C5690] to-[#5A75C7] text-white rounded-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#5A75C7]/50 transition-all"
            >
              <CheckCircle size={18} /> Apply Filters
            </button>
            
            <div className="flex gap-3">
              <button
                ref={saveBtnRef}
                onClick={onSave}
                className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium bg-gradient-to-r from-[#30426B] to-[#3C5690] text-white rounded-lg hover:from-[#2a3a5e] hover:to-[#334c82] focus:outline-none focus:ring-4 focus:ring-[#5A75C7]/50 transition-all"
              >
                <Save size={16} /> Save
              </button>
              <button
                ref={clearBtnRef}
                onClick={onClear}
                className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-2 border-[#3C5690] text-[#30426B] rounded-lg hover:bg-[#3C5690]/10 focus:outline-none focus:ring-4 focus:ring-[#5A75C7]/30 transition-all"
              >
                <RotateCcw size={16} /> Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add animation keyframes */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
});