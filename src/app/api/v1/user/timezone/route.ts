import { server_request } from "@/lib/utils/request";
import { UserTimezonePutHandler } from "@/lib/modules/user/user.timezone.handler";

export const PUT = server_request(UserTimezonePutHandler);
