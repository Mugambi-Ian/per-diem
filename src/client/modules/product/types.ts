import {ProductAvailability, ProductModifier} from "@/lib/modules/product/schema/product";

export interface ProductFormValues {
    name: string;
    price: string;
    description?: string;
    modifiers: ProductModifier[];
    availability: ProductAvailability[];
}
