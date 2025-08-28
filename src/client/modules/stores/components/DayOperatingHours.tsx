'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useDayOperatingHours } from '../hooks/useDayOperatingHours';

const DAYS_OF_WEEK = [
    { value: 0, label: 'Sunday', short: 'Sun' },
    { value: 1, label: 'Monday', short: 'Mon' },
    { value: 2, label: 'Tuesday', short: 'Tue' },
    { value: 3, label: 'Wednesday', short: 'Wed' },
    { value: 4, label: 'Thursday', short: 'Thu' },
    { value: 5, label: 'Friday', short: 'Fri' },
    { value: 6, label: 'Saturday', short: 'Sat' },
];

export interface OperatingHour {
    id: string;
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isOpen: boolean;
    closesNextDay: boolean;
    dstAware: boolean;
}

export interface DayOperatingHoursProps {
    dayOfWeek: number;
    hours: OperatingHour[];
    onHoursChange: (dayOfWeek: number, hours: OperatingHour[]) => void;
}

export const DayOperatingHours: React.FC<DayOperatingHoursProps> = ({
                                                                        dayOfWeek,
                                                                        hours,
                                                                        onHoursChange,
                                                                    }) => {
    const dayName = DAYS_OF_WEEK.find((d) => d.value === dayOfWeek)?.label;
    const { dayHours, isOpen, addTimeSlot, removeTimeSlot, updateTimeSlot, toggleDay } = useDayOperatingHours({ dayOfWeek, hours, onHoursChange });

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-20">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              {dayName}
            </span>
                    </div>
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={isOpen}
                            onChange={(e) => toggleDay(e.target.checked)}
                            className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
              Open
            </span>
                    </label>
                </div>

                {isOpen && (
                    <button
                        type="button"
                        onClick={addTimeSlot}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg transition-colors"
                    >
                        <Plus className="w-3 h-3" />
                        Add Hours
                    </button>
                )}
            </div>

            {isOpen && (
                <div className="space-y-3">
                    {dayHours.map((hour) => (
                        <div
                            key={hour.id}
                            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                            <input
                                type="time"
                                value={hour.openTime}
                                onChange={(e) =>
                                    updateTimeSlot(hour.id, 'openTime', e.target.value)
                                }
                                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <span className="text-gray-400 dark:text-gray-500">to</span>
                            <input
                                type="time"
                                value={hour.closeTime}
                                onChange={(e) =>
                                    updateTimeSlot(hour.id, 'closeTime', e.target.value)
                                }
                                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />

                            <label className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 ml-2">
                                <input
                                    type="checkbox"
                                    checked={hour.closesNextDay}
                                    onChange={(e) =>
                                        updateTimeSlot(hour.id, 'closesNextDay', e.target.checked)
                                    }
                                    className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                                />
                                Next day
                            </label>

                            {dayHours.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeTimeSlot(hour.id)}
                                    className="ml-auto p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DayOperatingHours;
