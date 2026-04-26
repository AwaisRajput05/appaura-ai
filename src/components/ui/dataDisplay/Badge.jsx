// Badge.jsx
import React from 'react';
import classNames from 'classnames';

const Badge = ({ 
  children, 
  variant = 'gray', 
  size = 'md', 
  className = '',
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-full';
  
  const variantClasses = {
    gray: 'bg-gray-100 text-gray-800 border border-gray-300',
    blue: 'bg-blue-100 text-blue-800 border border-blue-300',
    green: 'bg-green-100 text-green-800 border border-green-300',
    yellow: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
    red: 'bg-red-100 text-red-800 border border-red-300',
    purple: 'bg-purple-100 text-purple-800 border border-purple-300',
    pink: 'bg-pink-100 text-pink-800 border border-pink-300',
    indigo: 'bg-indigo-100 text-indigo-800 border border-indigo-300'
  };

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2.5 py-1 text-sm',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const classes = classNames(
    baseClasses,
    variantClasses[variant] || variantClasses.gray,
    sizeClasses[size] || sizeClasses.md,
    className
  );

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
};

export default Badge;