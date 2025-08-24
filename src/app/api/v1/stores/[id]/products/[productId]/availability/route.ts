import { server_request } from "@/lib/utils/request";
import { ProductAvailabilityGetHandler } from "@/lib/modules/product/product.availability.handler";

export const GET = server_request(ProductAvailabilityGetHandler, { unprotected: true });
