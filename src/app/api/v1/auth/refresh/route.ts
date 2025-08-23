import {server_request} from "@/lib/utils/request";
import {PostAuthRefresh} from "@/lib/modules/auth/refresh.handler";
import {rate_limit_auth} from "@/lib/modules/auth/utils/rate";

export const POST = server_request(PostAuthRefresh,{rateLimiter: rate_limit_auth, unprotected: true})