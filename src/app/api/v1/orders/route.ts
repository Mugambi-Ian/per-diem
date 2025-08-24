import { server_request } from "@/lib/utils/request";
import { OrdersGetHandler, OrdersPostHandler } from "@/lib/modules/orders/orders.handler";

export const GET = server_request(OrdersGetHandler);
export const POST = server_request(OrdersPostHandler);
