import React from 'react';
import Link from 'next/link';

interface ProductQuickActionsProps {
    storeId: string;
    mode: 'create' | 'edit';
    loading: boolean;
    handleSubmit: () => void;
    handleDelete: () => void;
}

export const ProductQuickActions: React.FC<ProductQuickActionsProps> = ({
    storeId,
    mode,
    loading,
    handleSubmit,
    handleDelete,
}) => {
    return (
        <div className="lg:col-span-1">
            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-gray-800 shadow-lg sticky top-8">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h3>
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800 space-y-3">
                    <Link
                        href={`/stores/${storeId}/products`}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center block"
                    >
                        Cancel
                    </Link>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-medium hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {loading ? (mode === 'create' ? 'Creating...' : 'Saving...') : (mode === 'create' ? 'Create Product' : 'Save Changes')}
                    </button>
                    {mode === 'edit' && (
                        <button
                            onClick={handleDelete}
                            disabled={loading}
                            className="w-full px-4 py-3 border border-red-300 text-red-600 dark:border-red-700 rounded-xl text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Delete Product
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
