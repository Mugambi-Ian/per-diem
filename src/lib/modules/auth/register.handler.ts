import {NextRequest} from "next/server";
import {schema_register} from "@/lib/modules/auth/schema/register";
import {ApiResponse} from "@/lib/utils/response";
import {AuthService} from "@/lib/modules/auth/service/auth.service";


export async function PostAuthRegister(req: NextRequest): Promise<ApiResponse<{user:{ id: string, email: string }}>> {
    const body = await req.json();
    const data = schema_register.parse(body);

    const user = await AuthService.register(data);


    return {
        success: true,
        data: {user},
        status: 201,
    };
}
