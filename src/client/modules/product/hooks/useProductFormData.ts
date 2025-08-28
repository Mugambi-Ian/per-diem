import { useState } from 'react';
import { ProductFormValues } from '../types';

interface UseProductFormDataProps {
    initialValues?: Partial<ProductFormValues>;
}

export function useProductFormData({ initialValues }: UseProductFormDataProps) {
    const [formData, setFormData] = useState({
        name: initialValues?.name ?? '',
        price: initialValues?.price ?? '',
        description: initialValues?.description ?? '',
    });

    return {
        formData,
        setFormData,
    };
}
