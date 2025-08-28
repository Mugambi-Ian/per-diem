import { useState, useMemo } from 'react';
import {Product} from "@/lib/modules/product/schema/product";

export type SortBy = 'name' | 'price-low' | 'price-high' | 'newest';
export type AvailabilityFilter = 'all' | 'available' | 'unavailable';
export type ViewMode = 'grid' | 'list';

export function useProductFilters(products: Product[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('name');

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products];

    // Search filter
    if (searchTerm) {
        filtered = filtered.filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    // Availability filter
    if (availabilityFilter !== 'all') {
      filtered = filtered.filter(product =>
        availabilityFilter === 'available' ? product.isAvailableNow : !product.isAvailableNow
      );
    }

    // Sort
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        // Assuming products have a createdAt field
        break;
    }

    return filtered;
  }, [products, searchTerm, availabilityFilter, sortBy]);

  return {
    filteredProducts: filteredAndSortedProducts,
    searchTerm,
    setSearchTerm,
    availabilityFilter,
    setAvailabilityFilter,
    sortBy,
    setSortBy,
  };
}
