import {server_response} from "@/lib/utils/response";
import {logger} from "@/lib/utils/logger";

/** Unified error handler */
export function request_error(err: any, handlerName?: string) {
    logger.error(err, "API Error: " + handlerName);
    if (err.status === 401) {

        return server_response({success: false, error: {message: "UNAUTHORIZED"}}, 401);
    }
    if (err?.consumedPoints) {
        return server_response({success: false, error: {message: "Please wait"}}, 429);
    }
    if (err?.name?.includes("ZodError")) {
        return server_response({success: false, error: JSON.parse(err.message)}, 400);
    }
    return server_response(
        {
            success: false,
            error: {code: "INTERNAL_request_error", message: "Something went wrong"},
        },
        500
    );
}
