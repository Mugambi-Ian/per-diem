import {server_response} from "@/lib/utils/response";

/** Unified error handler */
export function server_error(err: any, handlerName?: string) {
    console.error("API Error:", handlerName, err);
    if(err.status === 401){

        return server_response({ success: false, error: { message: "UNAUTHORIZED" } }, 401);
    }
    if (err?.consumedPoints) {
        return server_response({ success: false, error: { message: "Please wait" } }, 429);
    }
    if (err?.name?.includes("ZodError")) {
        return server_response({ success: false, error: JSON.parse(err.message) }, 400);
    }
    return server_response(
        {
            success: false,
            error: { code: "INTERNAL_SERVER_ERROR", message: "Something went wrong" },
        },
        500
    );
}
