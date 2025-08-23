
import { server_request } from "@/lib/utils/request";
import {StoresGetHandler, StoresPostHandler} from "@/lib/modules/stores/stores.handler";

export const GET = server_request(StoresGetHandler, { unprotected: true });
export const POST = server_request(StoresPostHandler);
