'use client';

import React from 'react';
import { Calendar, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from "clsx";
import { useCalendar } from '../hooks/useCalendar';
import {OperatingHour} from "@/lib/modules/stores/schema/store";

export interface AvailabilityCalendarProps {
    operatingHours: OperatingHour[];
}

export const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({ operatingHours }) => {
    const { monthDays, monthLabel, handleMonthChange, DAYS_OF_WEEK } = useCalendar();

    return (
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" aria-hidden />
                    Monthly Availability
                </h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <button
                        onClick={() => handleMonthChange(-1)}
                        className="p-1 hover:bg-accent rounded-full"
                        aria-label="Previous month"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-medium">{monthLabel}</span>
                    <button
                        onClick={() => handleMonthChange(1)}
                        className="p-1 hover:bg-accent rounded-full"
                        aria-label="Next month"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-2 mb-2">
                {DAYS_OF_WEEK.map((day) => (
                    <div key={day.value} className="text-center text-xs font-medium text-muted-foreground">
                        {day.short}
                    </div>
                ))}
            </div>

            {/* Month Grid */}
            <div className="grid grid-cols-7 gap-2">
                {monthDays.map((date, index) => {
                    if (!date) {
                        return <div key={index} className="p-3" />; // empty slot
                    }

                    const dayHours = operatingHours.filter(
                        (h) => h.dayOfWeek === date.getDay() && h.isOpen
                    );
                    const isOpen = dayHours.length > 0;
                    const isToday = date.toDateString() === new Date().toDateString();

                    return (
                        <div
                            key={index}
                            className={clsx(
                                "p-3 rounded-lg text-center border transition-all hover:shadow-sm",
                                isOpen
                                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                                    : "bg-muted border-border",
                                isToday && "ring-2 ring-primary"
                            )}
                        >
                            <div className="text-sm font-bold text-foreground mb-1">
                                {date.getDate()}
                            </div>
                            {isOpen ? (
                                <div className="space-y-1">
                                    <Check className="w-3 h-3 text-green-600 mx-auto" />
                                    {dayHours.map((hour) => (
                                        <div key={hour.id} className="text-xs text-green-700 dark:text-green-400">
                                            {hour.openTime} - {hour.closeTime}
                                            {hour.closesNextDay && (
                                                <span className="block text-red-500 text-[10px]">+1</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center">
                                    <X className="w-3 h-3 text-muted-foreground" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AvailabilityCalendar;
