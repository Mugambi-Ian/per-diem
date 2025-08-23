import {server_request} from "@/lib/utils/request";
import {PostAuthLogin} from "@/lib/modules/auth/login.handler";
import {rate_limit_auth} from "@/lib/modules/auth/utils/rate";

export const POST = server_request(PostAuthLogin, {rateLimiter: rate_limit_auth, unprotected: true,})
