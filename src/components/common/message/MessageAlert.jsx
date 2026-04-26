import React from 'react';

const variants = {
  error: {
    container: 'bg-white border-l-4 border-red-500 shadow-md',
    icon: 'text-red-500',
    border: 'border-red-500',
    iconSvg: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
        <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  },
  warning: {
    container: 'bg-white border-l-4 border-yellow-500 shadow-md',
    icon: 'text-yellow-500',
    border: 'border-yellow-500',
    iconSvg: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" />
      </svg>
    )
  },
  info: {
    container: 'bg-white border-l-4 border-blue-500 shadow-md',
    icon: 'text-blue-500',
    border: 'border-blue-500',
    iconSvg: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      </svg>
    )
  },
  success: {
    container: 'bg-white border-l-4 border-green-500 shadow-md',
    icon: 'text-green-500',
    border: 'border-green-500',
    iconSvg: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
};

export const MessageAlert = ({ 
  message, 
  variant = 'info', 
  onClose,
  action,
  actionLabel,
  className = ''
}) => {
  const styles = variants[variant] || variants.info;

  return (
    <div className={`${styles.container} p-4 rounded-r mb-4 flex items-start ${className}`}>
      <div className={`${styles.icon} flex-shrink-0`}>
        {styles.iconSvg}
      </div>
      <div className="ml-3 flex-1">
        <p className="text-sm text-gray-800">{message}</p>
        {action && actionLabel && (
          <button
          
            onClick={action}
            className={`mt-2 text-sm font-medium text-gray-600 cursor-pointer ${styles.icon} ${styles.border} border px-2 py-1 rounded`}
          >
            {actionLabel}
          </button>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-4 flex-shrink-0 text-gray-400 cursor-pointer hover:text-gray-600 focus:outline-none"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 18L18 6M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  );
};
