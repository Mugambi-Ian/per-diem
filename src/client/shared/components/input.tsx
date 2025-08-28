'use client';

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({
                                       label,
                                       error,
                                       helperText,
                                       leftIcon,
                                       rightIcon,
                                       className = '',
                                       id,
                                       ...props
                                     }) => {
  const baseClasses =
      'block w-full rounded-md transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 py-2 shadow-sm';

  const themeClasses =
      'bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus-visible:outline-blue-500 focus-visible:border-blue-500 ' +
      'dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 dark:focus-visible:outline-blue-500 dark:focus-visible:border-blue-500';

  const errorClasses = error
      ? 'border-red-300 focus-visible:outline-red-500 focus-visible:border-red-500 dark:border-red-500 dark:focus-visible:outline-red-500 dark:focus-visible:border-red-500'
      : '';

  const paddingClasses = leftIcon ? 'pl-10' : 'pl-3';
  const paddingRightClasses = rightIcon ? 'pr-10' : 'pr-3';

  const inputClasses = `${baseClasses} ${themeClasses} ${errorClasses} ${paddingClasses} ${paddingRightClasses} ${className}`;

  return (
      <div className="w-full">
        {label && (
            <label
                htmlFor={id}
                className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
            >
              {label}
            </label>
        )}

        <div className="relative">
          {leftIcon && (
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <div className="h-5 w-5 text-gray-500 dark:text-gray-400">
                  {leftIcon}
                </div>
              </div>
          )}

          <input id={id} className={inputClasses} {...props} />

          {rightIcon && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <div className="h-5 w-5 text-gray-500 dark:text-gray-400">
                  {rightIcon}
                </div>
              </div>
          )}
        </div>

        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

        {helperText && !error && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {helperText}
            </p>
        )}
      </div>
  );
};

export default Input;
