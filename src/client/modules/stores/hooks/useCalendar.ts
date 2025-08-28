'use client';

import { useState, useMemo } from 'react';

const DAYS_OF_WEEK = [
    { value: 0, label: 'Sunday', short: 'Sun' },
    { value: 1, label: 'Monday', short: 'Mon' },
    { value: 2, label: 'Tuesday', short: 'Tue' },
    { value: 3, label: 'Wednesday', short: 'Wed' },
    { value: 4, label: 'Thursday', short: 'Thu' },
    { value: 5, label: 'Friday', short: 'Fri' },
    { value: 6, label: 'Saturday', short: 'Sat' },
];

export function useCalendar() {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const getMonthDays = useMemo(() => {
        return () => {
            const year = currentMonth.getFullYear();
            const month = currentMonth.getMonth();

            const firstDayOfMonth = new Date(year, month, 1);
            const lastDayOfMonth = new Date(year, month + 1, 0);

            const daysInMonth = lastDayOfMonth.getDate();
            const startDay = firstDayOfMonth.getDay();

            const dates: (Date | null)[] = [];

            // Pad empty days at start
            for (let i = 0; i < startDay; i++) {
                dates.push(null);
            }

            // Actual days of the month
            for (let d = 1; d <= daysInMonth; d++) {
                dates.push(new Date(year, month, d));
            }

            return dates;
        };
    }, [currentMonth]);

    const handleMonthChange = (offset: number) => {
        const newDate = new Date(currentMonth);
        newDate.setMonth(newDate.getMonth() + offset);
        setCurrentMonth(newDate);
    };

    const monthDays = getMonthDays();
    const monthLabel = currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

    return {
        currentMonth,
        monthDays,
        monthLabel,
        handleMonthChange,
        DAYS_OF_WEEK, // Exporting this constant as it's used in the component's JSX
    };
}