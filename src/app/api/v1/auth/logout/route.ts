import {server_request} from "@/lib/utils/request";
import {PostAuthLogout} from "@/lib/modules/auth/logout.handler";
import {rate_limit_auth} from "@/lib/modules/auth/utils/rate";

export const POST = server_request(PostAuthLogout,{rateLimiter:rate_limit_auth})