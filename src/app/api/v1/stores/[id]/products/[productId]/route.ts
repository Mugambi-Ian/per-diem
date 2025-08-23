import {server_request} from "@/lib/utils/request";
import {
    StoreProductIdDeleteHandler,
    StoreProductIdGetHandler,
    StoreProductIdPutHandler
} from "@/lib/modules/product/product.id.handler";


export const GET = server_request(StoreProductIdGetHandler, {unprotected: true});
export const PUT = server_request(StoreProductIdPutHandler);
export const DELETE = server_request(StoreProductIdDeleteHandler);
