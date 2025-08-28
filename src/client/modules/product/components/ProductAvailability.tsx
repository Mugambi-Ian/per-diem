import React from 'react';
import { DAYS, TIMEZONES } from '../constants';
import {ProductAvailability as Availability} from "@/lib/modules/product/schema/product";

interface ProductAvailabilityProps {
    availability: Availability[];
    addAvailability: () => void;
    updateAvailability: (index: number, updates: Partial<Availability>) => void;
    removeAvailability: (index: number) => void;
    toggleDay: (index: number, day: number) => void;
}

export const ProductAvailability: React.FC<ProductAvailabilityProps> = ({
    availability,
    addAvailability,
    updateAvailability,
    removeAvailability,
    toggleDay,
}) => {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Availability</h3>
                <button onClick={addAvailability} className="px-3 py-1.5 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Add Window</button>
            </div>
            {availability.map((slot, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 space-y-3">
                    <div className="flex flex-wrap gap-2">
                        {DAYS.map(d => (
                            <button
                                key={d.value}
                                type="button"
                                onClick={()=>toggleDay(idx, d.value)}
                                className={`px-2.5 py-1 text-xs rounded-lg border ${slot.dayOfWeek.includes(d.value) ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}
                            >{d.label}</button>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input type="time" value={slot.startTime} onChange={(e)=>updateAvailability(idx,{startTime:e.target.value})} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800" />
                        <input type="time" value={slot.endTime} onChange={(e)=>updateAvailability(idx,{endTime:e.target.value})} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800" />
                        <select value={slot.timezone} onChange={(e)=>updateAvailability(idx,{timezone:e.target.value})} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800">
                            {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end">
                        <button type="button" onClick={()=>removeAvailability(idx)} className="text-sm text-red-600 hover:text-red-700">Remove</button>
                    </div>
                </div>
            ))}
        </div>
    );
};
