'use client';

import Link from 'next/link';
import { MapPin, Clock, Calendar, ArrowLeft, Check, X } from 'lucide-react';
import { StoreFormValues } from "@/client/modules/stores/hooks/useStoreForm";
import { useStoreForm } from "@/client/modules/stores/hooks/useStoreForm";
import { BasicInfoSection } from './BasicInfoSection';
import { OperatingHoursSection } from './OperatingHoursSection';
import {PreviewSection} from "@/client/modules/stores/components/PreviewSection";


interface StoreFormProps {
    mode: 'create' | 'edit';
    storeId?: string;
    initialValues?: Partial<StoreFormValues>;
}



export default function StoreForm({ mode, storeId, initialValues }: StoreFormProps) {
    const {
        formData,
        operatingHours,
        loading,
        error,
        success,
        activeTab,
        handleSubmit,
        handleDelete,
        handleChange,
        handleOperatingHoursChange,
        handleLocationSelect,
        generateSlug,
        setActiveTab,
        DAYS_OF_WEEK,
        TIMEZONES,
    } = useStoreForm({ mode, storeId, initialValues });

    const tabs = [
        {id: 'basic', name: 'Basic Info', icon: MapPin},
        {id: 'hours', name: 'Operating Hours', icon: Clock},
        {id: 'preview', name: 'Preview', icon: Calendar},
    ] as const;

    return (
        <div className="min-h-screen">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                <div className="mb-8">
                    <Link
                        href="/stores"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 text-sm font-medium mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4"/>
                        Back to Stores
                    </Link>

                    <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-gray-800 shadow-lg">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 dark:from-white dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                            {mode === 'create' ? 'Create New Store' : 'Edit Store'}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            {mode === 'create' ? 'Set up your store location, hours, and availability' : 'Update your store details and hours'}
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-2">
                            <X className="w-5 h-5 text-red-500"/>
                            <p className="text-red-800 dark:text-red-300 font-medium">{error}</p>
                        </div>
                    </div>
                )}

                {success && (
                    <div className="mb-6 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-2">
                            <Check className="w-5 h-5 text-green-500"/>
                            <p className="text-green-800 dark:text-green-300 font-medium">{success}</p>
                        </div>
                    </div>
                )}

                <div className="mb-8">
                    <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl p-2 border border-white/20 dark:border-gray-800 shadow-lg">
                        <nav className="flex space-x-2">{tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all ${
                                        activeTab === tab.id
                                            ? 'bg-white text-indigo-600 shadow-md'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                                    }`}
                                >
                                    <Icon className="w-4 h-4"/>
                                    {tab.name}
                                </button>
                            );
                        })}
                        </nav>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-800 shadow-lg overflow-hidden">
                            {activeTab === 'basic' && (
                                <BasicInfoSection
                                    formData={formData}
                                    handleChange={handleChange}
                                    handleLocationSelect={handleLocationSelect}
                                    generateSlug={generateSlug}
                                    TIMEZONES={TIMEZONES}
                                />
                            )}

                            {activeTab === 'hours' && (
                                <OperatingHoursSection
                                    operatingHours={operatingHours}
                                    handleOperatingHoursChange={handleOperatingHoursChange}
                                    DAYS_OF_WEEK={DAYS_OF_WEEK}
                                />
                            )}

                            {activeTab === 'preview' && (
                                <PreviewSection
                                    formData={formData}
                                    operatingHours={operatingHours}
                                />
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-gray-800 shadow-lg sticky top-8">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h3>
                            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800 space-y-3">
                                <Link
                                    href={mode === 'create' ? '/stores' : `/stores/${storeId}`}
                                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center block"
                                >
                                    Cancel
                                </Link>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="w-full px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-medium hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {loading ? (mode === 'create' ? 'Creating...' : 'Saving...') : (mode === 'create' ? 'Create Store' : 'Save Changes')}
                                </button>
                                {mode === 'edit' && (
                                    <button
                                        onClick={handleDelete}
                                        disabled={loading}
                                        className="w-full px-4 py-3 border border-red-300 text-red-600 dark:border-red-700 rounded-xl text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        Delete Store
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}


