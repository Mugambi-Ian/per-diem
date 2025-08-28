'use client'
import Link from "next/link";
import {useState} from "react";
import {StoreDetailsTabs} from "@/client/modules/stores/components/StoreDetailsTabs";
import {StoreDetailOverviewTab} from "@/client/modules/stores/components/StoreDetailOverviewTab";
import {StoreDetailHeader} from "../components/StoreDetailHeader";
import {StoreDetailProductsTab} from "@/client/modules/stores/components/StoreDetailProductsTab";
import {StoreDetailLocationTab} from "@/client/modules/stores/components/StoreDetailLocationTab";
import {AvailabilityCalendar} from "@/client/modules/stores/components";
import {Product} from "@/lib/modules/product/schema/product";
import {Store} from "@/lib/modules/stores/schema/store";

interface StoreDetailClientPageProps {
    store: Store;
    products: Product[];
    isOwner: boolean;
}

export function StoreDetailView({store, products, isOwner}: StoreDetailClientPageProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'hours' | 'location'>('overview');


    return (
        <div className="min-h-screen ">
            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumb */}
                <nav className="mb-6" aria-label="Breadcrumb">
                    <ol className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                        <li>
                            <Link href="/" className="hover:text-gray-900 dark:hover:text-white">
                                Home
                            </Link>
                        </li>
                        <li>/</li>
                        <li>
                            <Link href="/stores" className="hover:text-gray-900 dark:hover:text-white">
                                Stores
                            </Link>
                        </li>
                        <li>/</li>
                        <li className="text-gray-900 dark:text-white">{store.name}</li>
                    </ol>
                </nav>

                <StoreDetailHeader store={store} products={products} isOwner={isOwner}/>

                <StoreDetailsTabs activeTab={activeTab} setActiveTab={setActiveTab}/>

                {/* Tab Content */}
                <div className="space-y-6">
                    {activeTab === 'overview' && (
                        <StoreDetailOverviewTab store={store} products={products}/>
                    )}

                    {/* Products Tab */}
                    {activeTab === 'products' && (
                        <StoreDetailProductsTab store={store} products={products}/>)}

                    {/* Hours Tab */}
                    {activeTab === 'hours' && (
                        <AvailabilityCalendar operatingHours={store.operatingHours??[]}/>
                    )}

                    {/* Location Tab */}
                    {activeTab === 'location' && (
                        <StoreDetailLocationTab store={store}/>
                    )}
                </div>
            </main>
        </div>
    );
}
