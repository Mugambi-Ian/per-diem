import { server_request } from "@/lib/utils/request";
import { StoreAvailabilityGetHandler } from "@/lib/modules/stores/store.availability.handler";

export const GET = server_request(StoreAvailabilityGetHandler, { unprotected: true });
