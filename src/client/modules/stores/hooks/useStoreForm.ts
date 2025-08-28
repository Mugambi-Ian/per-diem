'use client';

import { useState, useEffect, useMemo, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';

export interface OperatingHour {
    id: string;
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isOpen: boolean;
    closesNextDay: boolean;
    dstAware: boolean;
}

export interface StoreFormValues {
    name: string;
    slug: string;
    address: string;
    timezone: string;
    lat: string;
    lng: string;
    operatingHours: OperatingHour[];
}

interface UseStoreFormProps {
    mode: 'create' | 'edit';
    storeId?: string;
    initialValues?: Partial<StoreFormValues>;
}

const DAYS_OF_WEEK = [
    {value: 0, label: 'Sunday', short: 'Sun'},
    {value: 1, label: 'Monday', short: 'Mon'},
    {value: 2, label: 'Tuesday', short: 'Tue'},
    {value: 3, label: 'Wednesday', short: 'Wed'},
    {value: 4, label: 'Thursday', short: 'Thu'},
    {value: 5, label: 'Friday', short: 'Fri'},
    {value: 6, label: 'Saturday', short: 'Sat'},
];

const TIMEZONES = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Australia/Sydney',
    'Africa/Nairobi',
];

export function useStoreForm({ mode, storeId, initialValues }: UseStoreFormProps) {
    const router = useRouter();
    const [formData, setFormData] = useState<StoreFormValues>({
        operatingHours: initialValues?.operatingHours??[],
        name: initialValues?.name ?? '',
        slug: initialValues?.slug ?? '',
        address: initialValues?.address ?? '',
        timezone: initialValues?.timezone ?? 'America/New_York',
        lat: initialValues?.lat ?? '',
        lng: initialValues?.lng ?? ''
    });

    const defaultOperatingHours: OperatingHour[] = useMemo(() => (
        DAYS_OF_WEEK.map(day => ({
            id: `${day.value}-default`,
            dayOfWeek: day.value,
            openTime: '09:00',
            closeTime: '17:00',
            isOpen: true,
            closesNextDay: false,
            dstAware: true,
        }))
    ), []);

    const [operatingHours, setOperatingHours] = useState<OperatingHour[]>(initialValues?.operatingHours ?? defaultOperatingHours);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'basic' | 'hours' | 'preview'>('basic');

    useEffect(() => {
        if (initialValues) {
            setFormData(prev => ({
                ...prev,
                name: initialValues.name ?? prev.name,
                slug: initialValues.slug ?? prev.slug,
                address: initialValues.address ?? prev.address,
                timezone: initialValues.timezone ?? prev.timezone,
                lat: initialValues.lat ?? prev.lat,
                lng: initialValues.lng ?? prev.lng,
            }));
            if (initialValues.operatingHours) {
                setOperatingHours(initialValues.operatingHours);
            }
        }
    }, [initialValues]);

    const handleSubmit = async (e?: FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const payload = {
                ...formData,
                lat: parseFloat(formData.lat),
                lng: parseFloat(formData.lng),
                operatingHours: operatingHours.filter(h => h.isOpen),
            };

            const endpoint = mode === 'create' ? '/api/v1/stores' : `/api/v1/stores/${storeId}`;
            const method = mode === 'create' ? 'POST' : 'PUT';

            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(mode === 'create' ? 'Store created successfully! Redirecting...' : 'Store updated successfully! Redirecting...');
                setTimeout(() => {
                    if (mode === 'create') {
                        router.push('/stores');
                    } else {
                        router.push(`/stores/${storeId}`);
                    }
                }, 1200);
            } else {
                setError(data.error?.message || `Failed to ${mode === 'create' ? 'create' : 'update'} store. Please try again.`);
            }
        } catch (err) {
            setError('Network error. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (mode !== 'edit' || !storeId) return;
        if (!confirm('Are you sure you want to delete this store? This action cannot be undone.')) return;
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/v1/stores/${storeId}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            const data = await response.json();
            if (response.ok) {
                setSuccess('Store deleted. Redirecting...');
                setTimeout(() => router.push('/stores'), 800);
            } else {
                setError(data.error?.message || 'Failed to delete store.');
            }
        } catch (err) {
            setError('Network error. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleOperatingHoursChange = (dayOfWeek: number, updatedHours: OperatingHour[]) => {
        setOperatingHours(updatedHours);
    };

    const handleLocationSelect = (lat: number, lng: number) => {
        setFormData({
            ...formData,
            lat: lat.toString(),
            lng: lng.toString(),
        });
    };

    const generateSlug = () => {
        const slug = formData.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        setFormData({...formData, slug});
    };

    return {
        formData,
        setFormData,
        operatingHours,
        setOperatingHours,
        loading,
        error,
        success,
        activeTab,
        setActiveTab,
        handleSubmit,
        handleDelete,
        handleChange,
        handleOperatingHoursChange,
        handleLocationSelect,
        generateSlug,
        DAYS_OF_WEEK,
        TIMEZONES,
    };
}