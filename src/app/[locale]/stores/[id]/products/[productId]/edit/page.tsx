// app/stores/[id]/products/[productId]/edit/page.tsx

import ProductForm from "@/client/modules/product/components/ProductForm";
import {ProductService} from "@/lib/modules/product/service/product.service";
import {ProductAvailability, ProductModifier} from "@/lib/modules/product/schema/product";

async function getProduct(storeId: string, productId: string) {
    const result = await ProductService.get(storeId, productId);
    const p = result.data;
    return {
        name: p.name,
        price: String(p.price ?? ""),
        description: p.description ?? "",
        modifiers: (p.modifiers || []).map((m:ProductModifier) => ({
            id: m.id,
            name: m.name,
            priceDelta: m.priceDelta,
        })),
        availability: (p.availability || []).map((a:ProductAvailability) => ({
            id: a.id,
            dayOfWeek: a.dayOfWeek,
            startTime: a.startTime,
            endTime: a.endTime,
            timezone: a.timezone,
        })),
    };
}

export default async function EditProductPage({
                                                  params,
                                              }: {
    params: { id: string; productId: string };
}) {
    const initialValues = await getProduct(params.id, params.productId);

    return (
        <ProductForm
            mode="edit"
            storeId={params.id}
            productId={params.productId}
            initialValues={initialValues}
        />
    );

}
