import Link from "next/link";
import Button from "@/client/shared/components/button";
import {Store} from "@/lib/modules/stores/schema/store";
import {Product} from "@/lib/modules/product/schema/product";

interface StoreProductsTabProps {
    store: Store;
    products: Product[];
}

export function StoreDetailProductsTab({store, products}: StoreProductsTabProps) {
    return (
        <div
            className="rounded-lg bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-900/5 dark:ring-gray-100/5">
            <div className="px-4 py-6 sm:px-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Products ({products.length})
                    </h2>
                    <Link href={`/stores/${store.id}/products`}>
                        <Button variant="primary">
                            View All Products
                        </Button>
                    </Link>
                </div>
                {products.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="text-gray-400 dark:text-gray-500 text-4xl mb-4">📦</div>
                        <p className="text-gray-600 dark:text-gray-300">
                            No products available at the moment.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {products.slice(0, 6).map((product) => (
                            <div key={product.id}
                                 className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-medium text-gray-900 dark:text-white">
                                        {product.name}
                                    </h3>
                                    <span
                                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                            product.isAvailableNow
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                        }`}>
                            {product.isAvailableNow ? 'Available' : product.availabilityStatus}
                          </span>
                                </div>
                                {product.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                        {product.description}
                                    </p>
                                )}
                                <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900 dark:text-white">
                          {product.price.toFixed(2)}
                          </span>

                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
