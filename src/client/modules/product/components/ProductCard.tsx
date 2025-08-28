// Product Card Component
import Card, {CardBody} from "@/client/shared/components/card";
import Link from "next/link";
import Button from "@/client/shared/components/button";
import {Product} from "@/lib/modules/product/schema/product";

interface ProductCardProps {
    product: Product;
    viewMode: 'grid' | 'list';
    storeId: string;
}

export function ProductCard({product, viewMode, storeId}: ProductCardProps) {
    if (viewMode === 'list') {
        return (
            <Card className="hover:shadow-md transition-shadow">
                <CardBody>
                    <div className="flex items-center space-x-4">
                        {/* Product Image/Icon */}
                        <div
                            className="flex-shrink-0 w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                            { (
                                <span className="text-2xl">📦</span>
                            )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                                        {product.name}
                                    </h3>
                                    {product.description && (
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                                            {product.description}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col items-end space-y-2">
                  <span className={`text-sm px-2 py-1 rounded ${
                      product.isAvailableNow
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    {product.isAvailableNow ? 'Available' : product.availabilityStatus}
                  </span>
                                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                   {product.price.toFixed(2)}
                  </span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex-shrink-0 flex items-center gap-2">
                            <Link href={`/stores/${storeId}/products/${product.id}/edit`}>
                                <Button variant="outline">Edit</Button>
                            </Link>
                            <Button
                                variant="primary"
                                disabled={!product.isAvailableNow}
                                className="whitespace-nowrap"
                            >
                                {product.isAvailableNow ? 'Add to Cart' : 'Out of Stock'}
                            </Button>
                        </div>
                    </div>
                </CardBody>
            </Card>
        );
    }

    // Grid view
    return (
        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
            <CardBody className="p-4">
                {/* Product Image/Icon */}
                <div
                    className="w-full h-48 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-4">
                    {(
                        <span className="text-4xl">📦</span>
                    )}
                </div>

                {/* Product Info */}
                <div className="space-y-2">
                    <div className="flex items-start justify-between">
                        <h3 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">
                            {product.name}
                        </h3>
                        <span className={`text-sm px-2 py-1 rounded ${
                            product.isAvailableNow
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                    {product.isAvailableNow ? 'Available' : product.availabilityStatus}
                  </span>
                    </div>

                    {product.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                            {product.description}
                        </p>
                    )}

                    <div className="flex items-center justify-between">
            <span className="font-bold text-gray-900 dark:text-white">
        {product.price.toFixed(2)}
            </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <Link href={`/stores/${storeId}/products/${product.id}/edit`}>
                            <Button variant="outline" size="sm" className="w-full">Edit</Button>
                        </Link>
                        <Button
                            variant="primary"
                            size="sm"
                            disabled={!product.isAvailableNow}
                            className="w-full"
                        >
                            {product.isAvailableNow ? 'Add' : 'Out'}
                        </Button>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
}