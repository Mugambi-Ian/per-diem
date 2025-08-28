'use client';

import { useState, useEffect, FormEvent } from 'react';
import {Store} from "@/lib/modules/stores/schema/store";

export function useAllStores() {
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'distance'>('name');
    const [filterOpen, setFilterOpen] = useState<boolean | null>(null);

    const loadStores = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.append('q', searchTerm);
            if (sortBy) params.append('sort', sortBy);
            if (filterOpen !== null) params.append('open', filterOpen.toString());

            const response = await fetch(`/api/v1/stores?${params.toString()}`, {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                const storesData = data.data.payload || data.data.stores || [];
                setStores(storesData);
            } else {
                setError('Failed to load stores');
            }
        } catch (error) {
            setError('Failed to load stores');
            console.error('Failed to load stores:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStores();
    }, [sortBy, searchTerm, filterOpen, loadStores]); // Depend on all filters and sort options

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        loadStores();
    };

    const filteredStores = stores.filter(store => {
        if (filterOpen !== null && store.isCurrentlyOpen !== filterOpen) {
            return false;
        }
        return true;
    });

    return {
        stores: filteredStores, // Return filtered stores
        loading,
        error,
        searchTerm,
        setSearchTerm,
        sortBy,
        setSortBy,
        filterOpen,
        setFilterOpen,
        handleSearch,
        loadStores, // Expose loadStores if needed for external triggers
    };
}