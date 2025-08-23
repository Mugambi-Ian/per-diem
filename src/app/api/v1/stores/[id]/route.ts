import {server_request} from "@/lib/utils/request";
import {StoreIdDeleteHandler, StoreIdGetHandler, StoreIdPutHandler} from "@/lib/modules/stores/store.id.handler";


export const GET = server_request(StoreIdGetHandler, {unprotected: true});
export const PUT = server_request(StoreIdPutHandler);
export const DELETE = server_request(StoreIdDeleteHandler);
