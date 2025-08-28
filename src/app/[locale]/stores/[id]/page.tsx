import Link from 'next/link';
import Button from "@/client/shared/components/button";
import { StoreService } from '@/lib/modules/stores/service/store.service';
import { ProductService } from '@/lib/modules/product/service/product.service';
import { cookies } from 'next/headers';
import { server_verify_access_token } from '@/lib/modules/auth/utils/jwt';
import { AuthService } from '@/lib/modules/auth/service/auth.service';
import {Store} from "@/lib/modules/stores/schema/store";
import {StoreDetailView} from "@/client/modules/stores/pages/StoreDetailView";
import {generic_duplicate} from "@/shared/utils/object";
import {Product} from "@/lib/modules/product/schema/product"; // Assuming these types are shared

interface StoreDetailPageProps {
  params: { id: string };
}

export default async function StoreDetailPage({ params }: StoreDetailPageProps) {
  const storeId = params.id;

  let store: Store | null = null;
  let products: Product[] = [];
  let error: string | null = null;
  let isOwner = false;

    const storeResponse = await StoreService.get(storeId);
    if (storeResponse) {
      store = storeResponse.data;

      const productsResponse = await ProductService.list(1,6,storeId);
      products = productsResponse.data.payload;

      const token = (await cookies()).get("access_token")?.value;
      if (token) {
        const jwt = await server_verify_access_token(token);
        const user = await AuthService.userByID(jwt.sub ?? '');
        if (user && store?.user?.id) {
          isOwner = user.id === store.user.id;
        }
      }
    } else {
      error = 'Store not found';
    }


  if (error || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">🏪</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Store Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              {error || 'The store you are looking for does not exist.'}
            </p>
            <Link href="/public">
              <Button variant="primary">
                ← Back to Home
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <StoreDetailView store={generic_duplicate(store)} products={generic_duplicate(products)} isOwner={isOwner} />
  );
}
