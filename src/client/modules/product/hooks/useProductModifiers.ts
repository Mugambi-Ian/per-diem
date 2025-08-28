import { useState } from 'react';
import {ProductModifier} from "@/lib/modules/product/schema/product";

interface UseProductModifiersProps {
    initialModifiers?: ProductModifier[];
}

export function useProductModifiers({ initialModifiers }: UseProductModifiersProps) {
    const [modifiers, setModifiers] = useState<ProductModifier[]>(initialModifiers ?? []);

    // @ts-expect-error type
    const addModifier = () => setModifiers(prev => ([...prev, { name: '', priceDelta: 0 }]));
    const updateModifier = (index: number, patch: Partial<ProductModifier>) => setModifiers(prev => prev.map((m, i) => i === index ? { ...m, ...patch } : m));
    const removeModifier = (index: number) => setModifiers(prev => prev.filter((_, i) => i !== index));

    return {
        modifiers,
        addModifier,
        updateModifier,
        removeModifier,
    };
}
