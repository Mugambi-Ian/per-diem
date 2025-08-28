import { useEffect } from 'react';
import { ProductFormValues } from '../types';
import { useProductFormData } from './useProductFormData';
import { useProductAvailability } from './useProductAvailability';
import { useProductModifiers } from './useProductModifiers';
import { useProductFormSubmission } from './useProductFormSubmission';

interface UseProductFormProps {
    mode: 'create' | 'edit';
    storeId: string;
    productId?: string;
    initialValues?: Partial<ProductFormValues>;
}

export function useProductForm({ mode, storeId, productId, initialValues }: UseProductFormProps) {
    const { formData, setFormData } = useProductFormData({ initialValues });
    const { availability, updateAvailability, toggleDay, addAvailability, removeAvailability } = useProductAvailability({ initialAvailability: initialValues?.availability });
    const { modifiers, addModifier, updateModifier, removeModifier } = useProductModifiers({ initialModifiers: initialValues?.modifiers });
    const { loading, error, success, handleSubmit, handleDelete } = useProductFormSubmission({
        mode,
        storeId,
        productId,
        formData,
        availability,
        modifiers,
    });

    useEffect(() => {
        if (initialValues) {
            setFormData(prev => ({
                ...prev,
                name: initialValues.name ?? prev.name,
                price: initialValues.price ?? prev.price,
                description: initialValues.description ?? prev.description,
            }));
        }
    }, [initialValues, setFormData]);

    return {
        loading,
        error,
        success,
        formData,
        setFormData,
        availability,
        modifiers,
        handleSubmit,
        handleDelete,
        updateAvailability,
        toggleDay,
        addAvailability,
        removeAvailability,
        addModifier,
        updateModifier,
        removeModifier,
    };
}
