import {server_request} from "@/lib/utils/request";
import {PostAuthRegister} from "@/lib/modules/auth/register.handler";
import {rate_limit_auth} from "@/lib/modules/auth/utils/rate";

export const POST = server_request(PostAuthRegister,{rateLimiter: rate_limit_auth, unprotected: true})