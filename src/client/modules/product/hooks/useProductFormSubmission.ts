import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {ProductAvailability, ProductModifier} from "@/lib/modules/product/schema/product";

interface UseProductFormSubmissionProps {
    mode: 'create' | 'edit';
    storeId: string;
    productId?: string;
    formData: { name: string; price: string; description?: string; };
    availability: ProductAvailability[];
    modifiers: ProductModifier[];
}

export function useProductFormSubmission({
    mode,
    storeId,
    productId,
    formData,
    availability,
    modifiers,
}: UseProductFormSubmissionProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e?: FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const payload = {
                name: formData.name,
                price: parseFloat(String(formData.price)),
                description: formData.description || undefined,
                availability: availability.map(a => ({
                    dayOfWeek: a.dayOfWeek,
                    startTime: a.startTime,
                    endTime: a.endTime,
                    timezone: a.timezone,
                })),
                modifiers: modifiers.map(m => ({ id: m.id, name: m.name, priceDelta: Number(m.priceDelta) })),
            };

            const endpoint = mode === 'create'
                ? `/api/v1/stores/${storeId}/products`
                : `/api/v1/stores/${storeId}/products/${productId}`;
            const method = mode === 'create' ? 'POST' : 'PUT';

            const resp = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload),
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                setError(data?.error?.message || `Failed to ${mode === 'create' ? 'create' : 'update'} product`);
                return;
            }
            setSuccess(mode === 'create' ? 'Product created!' : 'Product updated!');
            setTimeout(() => router.push(`/stores/${storeId}/products`), 900);
        } catch (_err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (mode !== 'edit' || !productId) return;
        if (!confirm('Delete this product? This cannot be undone.')) return;
        setLoading(true);
        setError(null);
        try {
            const resp = await fetch(`/api/v1/stores/${storeId}/products/${productId}`, { method: 'DELETE', credentials: 'include' });
            if (resp.ok) {
                setSuccess('Product deleted');
                setTimeout(() => router.push(`/stores/${storeId}/products`), 700);
            } else {
                const data = await resp.json().catch(() => ({}));
                setError(data?.error?.message || 'Failed to delete product');
            }
        } catch (_e) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        error,
        success,
        handleSubmit,
        handleDelete,
    };
}
