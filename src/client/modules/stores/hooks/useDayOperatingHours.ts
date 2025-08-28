'use client';

import { OperatingHour } from '../components/DayOperatingHours';

interface UseDayOperatingHoursProps {
    dayOfWeek: number;
    hours: OperatingHour[];
    onHoursChange: (dayOfWeek: number, hours: OperatingHour[]) => void;
}

export function useDayOperatingHours({ dayOfWeek, hours, onHoursChange }: UseDayOperatingHoursProps) {
    const addTimeSlot = () => {
        const newHour: OperatingHour = {
            id: `${dayOfWeek}-${Date.now()}`,
            dayOfWeek,
            openTime: '09:00',
            closeTime: '17:00',
            isOpen: true,
            closesNextDay: false,
            dstAware: true,
        };
        const updatedHours = [...hours, newHour];
        onHoursChange(dayOfWeek, updatedHours);
    };

    const removeTimeSlot = (hourId: string) => {
        const updatedHours = hours.filter((h) => h.id !== hourId);
        onHoursChange(dayOfWeek, updatedHours);
    };

    const updateTimeSlot = (
        hourId: string,
        field: keyof OperatingHour,
        value: any
    ) => {
        const updatedHours = hours.map((h) =>
            h.id === hourId ? { ...h, [field]: value } : h
        );
        onHoursChange(dayOfWeek, updatedHours);
    };

    const toggleDay = (isOpen: boolean) => {
        if (isOpen && dayHours.length === 0) {
            addTimeSlot();
        } else if (!isOpen) {
            const updatedHours = hours.filter((h) => h.dayOfWeek !== dayOfWeek);
            onHoursChange(dayOfWeek, updatedHours);
        }
    };

    const dayHours = hours.filter((h) => h.dayOfWeek === dayOfWeek);
    const isOpen = dayHours.length > 0 && dayHours.some((h) => h.isOpen);

    return {
        dayHours,
        isOpen,
        addTimeSlot,
        removeTimeSlot,
        updateTimeSlot,
        toggleDay,
    };
}