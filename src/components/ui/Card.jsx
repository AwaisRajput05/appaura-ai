// src/components/ui/Card.jsx
import React from 'react';

const Card = ({
  children,
  title,
  subtitle,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  footer,
  footerClassName = '',
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-md ${className}`}>
      {(title || subtitle) && (
        <div className={`p-6 border-b border-gray-200 ${headerClassName}`}>
          {title && <h3 className="text-lg font-bold text-gray-800">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
      )}
      <div className={`p-6 ${bodyClassName}`}>
        {children}
      </div>
      {footer && (
        <div className={`p-6 border-t border-gray-200 ${footerClassName}`}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;