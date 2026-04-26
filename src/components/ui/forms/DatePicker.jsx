// src/components/ui/forms/DatePicker.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Popover } from '@headlessui/react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

// Helper functions to work with local dates ONLY
const formatLocalDate = (date, format) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  if (format === 'yyyy-MM-dd') {
    return `${year}-${month}-${day}`;
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  if (format === 'MMMM yyyy') {
    return `${monthNames[date.getMonth()]} ${year}`;
  }

  return `${year}-${month}-${day}`;
};

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

const isSameDay = (date1, date2) =>
  date1.getFullYear() === date2.getFullYear() &&
  date1.getMonth() === date2.getMonth() &&
  date1.getDate() === date2.getDate();

const isToday = (date) => isSameDay(date, new Date());

const DatePicker = ({
  label = "Date",
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  minDate,
  maxDate,
  placeholder = "Select date",
  className = "",
  inputClassName = "",
}) => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [inputValue, setInputValue] = useState('');

  // FIX 2: ref + state to compute fixed position for the panel
  const buttonRef = useRef(null);
  const [panelStyle, setPanelStyle] = useState({});

  const computePanelPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      // Flip upward if not enough space below
      const spaceBelow = window.innerHeight - rect.bottom;
      const panelHeight = 380; // approximate calendar height
      const top = spaceBelow >= panelHeight
        ? rect.bottom + 4
        : rect.top - panelHeight - 4;

      setPanelStyle({
        position: 'fixed',
        top: Math.max(8, top),
        left: Math.min(rect.left, window.innerWidth - 320 - 8),
        zIndex: 99999,
        width: 320,
      });
    }
  };

  // Initialize from value prop
  useEffect(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const day = parseInt(parts[2]);
        const date = new Date(year, month, day);
        if (!isNaN(date.getTime())) {
          setSelectedDate(date);
          setCurrentYear(year);
          setCurrentMonth(month);
          setInputValue(value);
        }
      }
    } else {
      setSelectedDate(null);
      setInputValue('');
    }
  }, [value]);

  const goToPrevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const handleDateSelect = (date, close) => {
    const formattedDate = formatLocalDate(date, 'yyyy-MM-dd');
    setSelectedDate(date);
    setInputValue(formattedDate);
    onChange(formattedDate);
    close();
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    if (val && val.length === 10) {
      const parts = val.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const day = parseInt(parts[2]);
        const date = new Date(year, month, day);
        if (!isNaN(date.getTime())) {
          setSelectedDate(date);
          onChange(val);
        }
      }
    }
  };

const isDateDisabled = (date) => {
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  
  if (minDate && dateStr < minDate) return true;
  if (maxDate && dateStr > maxDate) return true;
  return false;
};

  const getYearRange = () => {
    let startYear = minDate ? new Date(minDate).getFullYear() : currentYear - 10;
    let endYear = maxDate ? new Date(maxDate).getFullYear() : currentYear + 10;
    return { startYear, endYear };
  };

  const buildCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days = [];

    const prevMonthDays = getDaysInMonth(currentYear, currentMonth - 1);
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ date: new Date(currentYear, currentMonth - 1, prevMonthDays - i), isCurrentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(currentYear, currentMonth, i), isCurrentMonth: true });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(currentYear, currentMonth + 1, i), isCurrentMonth: false });
    }
    return days;
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const { startYear, endYear } = getYearRange();
  const years = [];
  for (let i = startYear; i <= endYear; i++) years.push(i);

  return (
    <div className={`relative ${className}`}>
      {/* FIX 1: Only render label element when label has actual text */}
      {label && (
        <label className="block text-sm font-semibold text-gray-800 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <Popover className="relative">
        {({ open, close }) => (
          <>
            {/* FIX 2: attach ref + compute position on click */}
            <div ref={buttonRef}>
              <Popover.Button
                as="div"
                disabled={disabled}
                onClick={computePanelPosition}
                className={`
                  block w-full pl-4 pr-10 py-3 border
                  ${error ? 'border-red-500' : 'border-gray-300'}
                  rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3C5690] focus:border-[#3C5690]
                  disabled:bg-gray-50 disabled:cursor-not-allowed ${inputClassName}
                  cursor-pointer relative bg-white
                `}
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  disabled={disabled}
                  className="w-full bg-transparent outline-none cursor-pointer text-sm"
                  placeholder={placeholder}
                  readOnly
                />
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 pointer-events-none">
                  <CalendarIcon className="w-5 h-5" />
                </span>
              </Popover.Button>
            </div>

            {/* FIX 2: fixed positioning — escapes any overflow:hidden/auto parent */}
            {open && (
              <Popover.Panel
                static
                style={panelStyle}
                className="bg-white rounded-lg shadow-2xl border border-gray-200 p-4"
              >
                {/* Calendar Header */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <button type="button" onClick={goToPrevMonth} className="p-1 hover:bg-gray-100 rounded flex-shrink-0">
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <select
                    value={currentMonth}
                    onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
                    className="px-2 py-1 border border-gray-300 rounded text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3C5690]"
                  >
                    {monthNames.map((month, index) => (
                      <option key={month} value={index}>{month}</option>
                    ))}
                  </select>

                  <select
                    value={currentYear}
                    onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                    className="px-2 py-1 border border-gray-300 rounded text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3C5690]"
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>

                  <button type="button" onClick={goToNextMonth} className="p-1 hover:bg-gray-100 rounded flex-shrink-0">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Week Days */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekDays.map((day) => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">{day}</div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {buildCalendarDays().map(({ date, isCurrentMonth }, idx) => {
                    const disabledDay = isDateDisabled(date);
                    const isSelected = selectedDate && isSameDay(date, selectedDate);
                    const isCurrentDay = isToday(date);

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => !disabledDay && handleDateSelect(date, close)}
                        disabled={disabledDay}
                        className={`
                          h-8 w-8 flex items-center justify-center rounded-full text-sm
                          ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
                          ${isCurrentDay && !isSelected && isCurrentMonth ? 'border border-blue-500' : ''}
                          ${isSelected ? 'bg-[#3C5690] text-white' : ''}
                          ${!isSelected && isCurrentMonth && !disabledDay ? 'hover:bg-gray-100' : ''}
                          ${disabledDay ? 'text-gray-300 cursor-not-allowed' : ''}
                        `}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>

                {/* Today Button */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => handleDateSelect(new Date(), close)}
                    className="text-sm text-[#3C5690] hover:text-[#30426B] font-medium"
                  >
                    Select Today
                  </button>
                </div>
              </Popover.Panel>
            )}
          </>
        )}
      </Popover>

      {error && <p className="mt-1 text-red-600 text-sm">{error.message || error}</p>}
    </div>
  );
};

export default DatePicker;