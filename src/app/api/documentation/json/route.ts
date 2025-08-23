import { NextResponse } from "next/server";
import { swaggerSpec } from "@/config/swagger";

export async function GET() {
    return NextResponse.json(swaggerSpec);
}
