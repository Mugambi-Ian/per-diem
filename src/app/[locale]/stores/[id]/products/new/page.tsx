'use client';

import { useParams } from 'next/navigation';
import ProductForm from "@/client/modules/product/components/ProductForm";

export default function NewProductPage() {
    const params = useParams();
    const storeId = params.id as string;
    return <ProductForm mode="create" storeId={storeId} />;
}


