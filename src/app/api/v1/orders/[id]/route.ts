import { server_request } from "@/lib/utils/request";
import { 
    OrderIdGetHandler, 
    OrderIdPutHandler, 
    OrderIdDeleteHandler 
} from "@/lib/modules/orders/order.id.handler";

export const GET = server_request(OrderIdGetHandler);
export const PUT = server_request(OrderIdPutHandler);
export const DELETE = server_request(OrderIdDeleteHandler);
