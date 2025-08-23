import {server_request} from "@/lib/utils/request";
import {StoreProductGETHandler, StoreProductPostHandler} from "@/lib/modules/product/products.handler";

export const POST = server_request(StoreProductPostHandler);
export const GET =server_request(StoreProductGETHandler,{unprotected:true})