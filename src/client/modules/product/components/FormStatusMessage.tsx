import React from 'react';
import { X, Check } from 'lucide-react';

interface FormStatusMessageProps {
    type: 'error' | 'success';
    message: string |null;
}

export const FormStatusMessage: React.FC<FormStatusMessageProps> = ({ type, message }) => {
    if (!message) return null;

    const isError = type === 'error';
    const bgColor = isError ? 'bg-red-50 dark:bg-red-900/30' : 'bg-green-50 dark:bg-green-900/30';
    const borderColor = isError ? 'border-red-200 dark:border-red-800' : 'border-green-200 dark:border-green-800';
    const textColor = isError ? 'text-red-800 dark:text-red-300' : 'text-green-800 dark:text-green-300';
    const Icon = isError ? X : Check;

    return (
        <div className={`mb-6 ${bgColor} border ${borderColor} rounded-xl p-4 shadow-sm`}>
            <div className="flex items-center gap-2">
                <Icon className={`w-5 h-5 ${isError ? 'text-red-500' : 'text-green-500'}`} />
                <p className={`${textColor} font-medium`}>{message}</p>
            </div>
        </div>
    );
};
