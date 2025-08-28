'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
                                     children,
                                     variant = 'default',
                                     className = '',
                                     onClick,
                                   }) => {
  const baseClasses = 'rounded-lg transition-all duration-200';

  const variantClasses = {
    default: 'bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700',
    elevated:
        'bg-white border border-gray-200 shadow-md hover:shadow-lg dark:bg-gray-800 dark:border-gray-700 dark:shadow-lg dark:hover:shadow-xl',
    outlined: 'bg-transparent border border-gray-300 dark:border-gray-600',
  };

  const interactiveClasses = onClick
      ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]'
      : '';

  const classes = `${baseClasses} ${variantClasses[variant]} ${interactiveClasses} ${className}`;

  return (
      <div className={classes} onClick={onClick}>
        {children}
      </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => {
  const classes = `px-6 py-4 border-b border-gray-200 dark:border-gray-700 ${className}`;
  return <div className={classes}>{children}</div>;
};

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const CardBody: React.FC<CardBodyProps> = ({ children, className = '' }) => {
  const classes = `px-6 py-4 ${className}`;
  return <div className={classes}>{children}</div>;
};

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => {
  const classes = `px-6 py-4 border-t border-gray-200 dark:border-gray-700 ${className}`;
  return <div className={classes}>{children}</div>;
};

export default Card;
