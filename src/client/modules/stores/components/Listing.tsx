'use client';

import ViewToggle from "@/client/modules/stores/components/ViewToggle";
import {Suspense} from "react";
import StoreGrid from "@/client/modules/stores/components/StoreGrid";
import StoreMap from "@/client/modules/stores/components/StoreMap";
import Spinner from "@/client/shared/components/spinner";
import {useStoreView} from "@/client/modules/stores/hooks/useStoreView";

export function StoreLanding(props:{stores:any[]}){
    const { currentView, setCurrentView } = useStoreView('grid');

    return <>
        {/* View Toggle */}
        <ViewToggle
            currentView={currentView}
            onViewChange={setCurrentView}
        />

        {/* Stores Content */}
        <Suspense fallback={<Spinner size="xl" text="Loading stores..."/>}>
            {currentView === 'grid' ? (
                <StoreGrid stores={props.stores}/>
            ) : (
                <StoreMap stores={props.stores}/>
            )}
        </Suspense></>
}