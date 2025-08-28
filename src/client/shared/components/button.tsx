'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
                                         variant = 'primary',
                                         size = 'md',
                                         loading = false,
                                         disabled,
                                         children,
                                         className = '',
                                         ...props
                                       }) => {
  const baseClasses =
      'inline-flex items-center justify-center font-semibold rounded-md transition-colors ' +
      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ' +
      'disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variantClasses = {
    primary:
        'bg-blue-600 text-white shadow-sm hover:bg-blue-500 focus-visible:outline-blue-600',
    secondary:
        'bg-gray-600 text-white shadow-sm hover:bg-gray-500 focus-visible:outline-gray-600',
    outline:
        'border border-gray-300 text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline-gray-600 ' +
        'dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:focus-visible:outline-gray-600',
    ghost:
        'text-gray-700 hover:bg-gray-100 focus-visible:outline-gray-600 ' +
        'dark:text-gray-300 dark:hover:bg-gray-700 dark:focus-visible:outline-gray-600',
    danger:
        'bg-red-600 text-white shadow-sm hover:bg-red-500 focus-visible:outline-red-600',
  };

  const classes = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;

  return (
      <button className={classes} disabled={disabled || loading} {...props}>
        {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
        )}
        {children}
      </button>
  );
};

export default Button;
