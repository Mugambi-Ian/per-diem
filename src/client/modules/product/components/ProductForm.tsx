'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ProductModifiers } from './ProductModifiers';
import { FormStatusMessage } from './FormStatusMessage';
import { ProductQuickActions } from './ProductQuickActions';
import { useProductForm } from '../hooks/useProductForm';
import { ProductAvailability } from './ProductAvailability';
import { ProductFormValues } from '../types';

interface ProductFormProps {
    mode: 'create' | 'edit';
    storeId: string;
    productId?: string;
    initialValues?: Partial<ProductFormValues>;
}


export default function ProductForm({ mode, storeId, productId, initialValues }: ProductFormProps) {
    const {
        loading,
        error,
        success,
        formData,
        setFormData,
        availability,
        modifiers,
        handleSubmit,
        handleDelete,
        updateAvailability,
        toggleDay,
        addAvailability,
        removeAvailability,
        addModifier,
        updateModifier,
        removeModifier,
    } = useProductForm({ mode, storeId, productId, initialValues });

    return (
        <div className="min-h-screen">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <Link href={`/stores/${storeId}/products`} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 text-sm font-medium mb-4 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Products
                    </Link>
                    <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-gray-800 shadow-lg">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 dark:from-white dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                            {mode === 'create' ? 'Create Product' : 'Edit Product'}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            Define basic info, availability windows, and optional modifiers
                        </p>
                    </div>
                </div>

                <FormStatusMessage type="error" message={error} />

                <FormStatusMessage type="success" message={success} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-800 shadow-lg overflow-hidden">
                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e)=>setFormData({...formData, name: e.target.value})}
                                            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                            placeholder="Product name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Price (USD) *</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            required
                                            value={formData.price}
                                            onChange={(e)=>setFormData({...formData, price: e.target.value})}
                                            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                            placeholder="9.99"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e)=>setFormData({...formData, description: e.target.value})}
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        placeholder="Describe the product..."
                                        rows={4}
                                    />
                                </div>

                                <ProductAvailability
                                    availability={availability}
                                    addAvailability={addAvailability}
                                    updateAvailability={updateAvailability}
                                    removeAvailability={removeAvailability}
                                    toggleDay={toggleDay}
                                />

                                <ProductModifiers
                                    modifiers={modifiers}
                                    addModifier={addModifier}
                                    updateModifier={updateModifier}
                                    removeModifier={removeModifier}
                                />
                            </div>
                        </div>
                    </div>

                    <ProductQuickActions
                        storeId={storeId}
                        mode={mode}
                        loading={loading}
                        handleSubmit={handleSubmit}
                        handleDelete={handleDelete}
                    />
                </div>
            </div>
        </div>
    );
}


