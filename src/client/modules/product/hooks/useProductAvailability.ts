import { useState, useMemo } from 'react';
import {ProductAvailability} from "@/lib/modules/product/schema/product";

interface UseProductAvailabilityProps {
    initialAvailability?: ProductAvailability[];
}

export function useProductAvailability({ initialAvailability }: UseProductAvailabilityProps) {
    // @ts-expect-error type
    const defaultAvailability: ProductAvailability[] = useMemo(() => ([{
        id: '0',
        dayOfWeek: [1, 2, 3, 4, 5],
        startTime: '09:00',
        endTime: '17:00',
        timezone: 'UTC',
    }]), []);

    const [availability, setAvailability] = useState<ProductAvailability[]>(initialAvailability ?? defaultAvailability);

    const updateAvailability = (index: number, patch: Partial<ProductAvailability>) => {
        setAvailability(prev => prev.map((a, i) => i === index ? { ...a, ...patch } : a));
    };

    const toggleDay = (index: number, day: number) => {
        setAvailability(prev => prev.map((a, i) => {
            if (i !== index) return a;
            const selected = new Set(a.dayOfWeek);
            if (selected.has(day)) selected.delete(day); else selected.add(day);
            return { ...a, dayOfWeek: Array.from(selected).sort((x, y) => x - y) };
        }));
    };

    const addAvailability = () => {
        // @ts-expect-error type
        setAvailability(prev => ([...prev, { id: `${prev.length}`, dayOfWeek: [1, 2, 3, 4, 5], startTime: '09:00', endTime: '17:00', timezone: 'UTC' }]));
    };

    const removeAvailability = (index: number) => {
        setAvailability(prev => prev.filter((_, i) => i !== index));
    };

    return {
        availability,
        updateAvailability,
        toggleDay,
        addAvailability,
        removeAvailability,
    };
}
