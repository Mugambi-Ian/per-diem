import {server_request} from "@/lib/utils/request";

export const GET = server_request(async (req,jwt)=>{
    return {
        data:jwt,
        status:200,
        success:true
    }
})
