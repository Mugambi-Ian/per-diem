import Link from 'next/link';
import {Store} from "@/lib/modules/stores/schema/store";

type Props = {
  store: Store;
};

export function StoreProductBreadcrumb({ store }: Props) {
  return (
    <nav className="mb-6">
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
        <li>
          <Link href={`/stores/${store.id}`} className="hover:text-gray-900 dark:hover:text-white">
            {store.name}
          </Link>
        </li>
        <li>/</li>
        <li className="text-gray-900 dark:text-white">Products</li>
      </ol>
    </nav>
  );
}
