'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
}

const Spinner: React.FC<LoadingSpinnerProps> = ({
                                                         size = 'md',
                                                         text,
                                                         className = '',
                                                       }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  return (
      <div className={`flex flex-col items-center justify-center ${className}`}>
        <div
            className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-500 ${sizeClasses[size]}`}
        />
        {text && (
            <p className={`mt-2 text-sm text-gray-600 dark:text-gray-300`}>
              {text}
            </p>
        )}
      </div>
  );
};

export default Spinner;
