import React from 'react';
import { Clock } from 'lucide-react';
import { DayOperatingHours } from '@/client/modules/stores/components';
import { OperatingHour } from '@/client/modules/stores/hooks/useStoreForm';

interface OperatingHoursSectionProps {
    operatingHours: OperatingHour[];
    handleOperatingHoursChange: (dayOfWeek: number, updatedHours: OperatingHour[]) => void;
    DAYS_OF_WEEK: { value: number; label: string; short: string }[];
}

export const OperatingHoursSection: React.FC<OperatingHoursSectionProps> = ({
    operatingHours,
    handleOperatingHoursChange,
    DAYS_OF_WEEK,
}) => {
    return (
        <div className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500"/>
                Operating Hours
            </h3>
            <div className="space-y-4">
                {DAYS_OF_WEEK.map((day) => (
                    <DayOperatingHours
                        key={day.value}
                        dayOfWeek={day.value}
                        hours={operatingHours}
                        onHoursChange={handleOperatingHoursChange}
                    />
                ))}
            </div>
        </div>
    );
};
