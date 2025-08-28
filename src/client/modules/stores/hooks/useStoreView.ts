'use client';

import { useState } from 'react';

export function useStoreView(initialView: 'grid' | 'map' = 'grid') {
    const [currentView, setCurrentView] = useState<'grid' | 'map'>(initialView);
    return { currentView, setCurrentView };
}