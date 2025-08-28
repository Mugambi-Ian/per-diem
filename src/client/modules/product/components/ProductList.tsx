import {Product} from "@/lib/modules/product/schema/product";
import { ProductCard } from '@/client/modules/product/components/ProductCard';
import Card, { CardBody } from '@/client/shared/components/card';
import Button from '@/client/shared/components/button';
import { ViewMode } from '@/client/modules/product/hooks/useProductFilters';

type Props = {
  products: Product[];
  viewMode: ViewMode;
  storeId: string;
  searchTerm: string;
  onClearSearch: () => void;
};

export function ProductList({ products, viewMode, storeId, searchTerm, onClearSearch }: Props) {
  if (products.length === 0) {
    return (
      <Card>
        <CardBody>
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No products found
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {searchTerm
                ? 'Try adjusting your search terms or filters.'
                : 'No products are currently available.'
              }
            </p>
            {searchTerm && (
              <Button onClick={onClearSearch}>
                Clear Search
              </Button>
            )}
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className={viewMode === 'grid'
      ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
      : 'space-y-4'
    }>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          viewMode={viewMode}
          storeId={storeId}
        />
      ))}
    </div>
  );
}
