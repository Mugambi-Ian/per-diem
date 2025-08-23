import {NextRequest,} from "next/server";
import {server_verify_access_token} from "@/lib/modules/auth/utils/jwt";


/** Handle authentication */
export async function request_auth(req: NextRequest, unprotected?: boolean) {
    if (unprotected) return undefined;
    try {
        const token = req.cookies.get("access_token")?.value;
        if (!token) throw {status: 401}
        return await server_verify_access_token(token);
    } catch (e) {
        console.log("request_auth: ", e)
        throw {status: 401}
    }
}
