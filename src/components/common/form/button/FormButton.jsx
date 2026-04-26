import { forwardRef, memo } from 'react';
import PropTypes from 'prop-types';
import { FiLoader } from 'react-icons/fi';

const FormButton = memo(
  forwardRef(
    (
      {
        type = 'button',
        variant = 'primary',
        size = 'md',
        disabled = false,
        isLoading = false,
        children,
        className = '',
        icon: Icon,
        iconPosition = 'left',
        ...props
      },
      ref
    ) => {
      const baseStyles =
        'inline-flex items-center justify-center font-semibold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50  cursor-pointer disabled:cursor-not-allowed ';

      const variantStyles = {
        primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 focus:ring-blue-500',
        secondary: 'bg-gray-500 text-white hover:bg-gray-600 focus:ring-gray-500',
        destructive: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
      };

      const sizeStyles = {
        sm: 'w-full px-4 py-1.5 text-sm',
        md: 'w-full px-10 py-3 text-base',
        lg: ' px-10 py-3 text-lg',
      };

      const combinedStyles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

      return (
        <div className='flex justify-center items-center'>
          <button
          ref={ref}
          type={type}
          className={combinedStyles}
          disabled={disabled || isLoading}
          aria-busy={isLoading}
          aria-disabled={disabled || isLoading}
          {...props}
        >
          {isLoading && (
            <FiLoader
              className={`animate-spin ${iconPosition === 'left' ? 'mr-2' : 'ml-2'} ${
                size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
              }`}
              aria-hidden="true"
            />
          )}
          {!isLoading && Icon && iconPosition === 'left' && (
            <Icon className={`mr-2 ${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'}`} aria-hidden="true" />
          )}
          {children}
          {!isLoading && Icon && iconPosition === 'right' && (
            <Icon className={`ml-2 ${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'}`} aria-hidden="true" />
          )}
        </button>
        </div>
      );
    }
  )
);

FormButton.displayName = 'Button';

FormButton.propTypes = {
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  variant: PropTypes.oneOf(['primary', 'secondary', 'destructive']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  disabled: PropTypes.bool,
  isLoading: PropTypes.bool,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  icon: PropTypes.elementType,
  iconPosition: PropTypes.oneOf(['left', 'right']),
};

export default FormButton;