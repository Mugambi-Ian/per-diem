import React from 'react';
import { AvailabilityCalendar } from '@/client/modules/stores/components';
import { OperatingHour, StoreFormValues } from '@/client/modules/stores/hooks/useStoreForm';

interface PreviewSectionProps {
    formData: StoreFormValues;
    operatingHours: OperatingHour[];
}

export const PreviewSection: React.FC<PreviewSectionProps> = ({
    formData,
    operatingHours,
}) => {
    return (
        <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                Store Preview
            </h3>

            <div className="space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Store Information
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-500 dark:text-gray-400">Name:</span>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                                {formData.name || 'Not set'}
                            </p>
                        </div>
                        <div>
                            <span className="text-gray-500 dark:text-gray-400">Slug:</span>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                                {formData.slug || 'Not set'}
                            </p>
                        </div>
                        <div className="col-span-2">
                            <span className="text-gray-500 dark:text-gray-400">Address:</span>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                                {formData.address || 'Not set'}
                            </p>
                        </div>
                        <div>
                            <span className="text-gray-500 dark:text-gray-400">Timezone:</span>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                                {formData.timezone}
                            </p>
                        </div>
                        <div>
                            <span className="text-gray-500 dark:text-gray-400">Coordinates:</span>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                                {formData.lat && formData.lng ? `${formData.lat}, ${formData.lng}` : 'Not set'}
                            </p>
                        </div>
                    </div>
                </div>

                <AvailabilityCalendar operatingHours={operatingHours} />
            </div>
        </div>
    );
};
