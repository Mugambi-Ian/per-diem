import React from 'react';
import Link from 'next/link'; // You can replace with your routing lib

interface BreadcrumbItem {
    title: string;
    href: string;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
    return (
        <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap text-sm text-gray-500 dark:text-gray-400">
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;
                    return (
                        <li key={index} className="flex items-center">
                            {!isLast ? (
                                <>
                                    <Link
                                        href={item.href}
                                        className="hover:text-gray-700 dark:hover:text-white transition-colors"
                                    >
                                        {item.title}
                                    </Link>
                                    <span className="mx-2 text-gray-400 dark:text-gray-500">/</span>
                                </>
                            ) : (
                                <span className="text-orange-600 dark:text-orange-500 font-medium">
                  {item.title}
                </span>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};
