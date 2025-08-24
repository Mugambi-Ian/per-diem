import { prisma } from "@/lib/db/prisma";
import { ApiResponse } from "@/lib/utils/response";
import { userResponseSchema } from "@/lib/modules/user/schema/user";
import { IANAZone } from "luxon";

export class UserService {
    static async updateTimezone(userId: string, timezone: string): Promise<ApiResponse<{ user?: any }>> {
        try {
            // Validate timezone
            if (!IANAZone.isValidZone(timezone)) {
                return {
                    success: false,
                    error: { code: "INVALID_TIMEZONE", message: "Invalid timezone format" },
                    status: 400,
                };
            }

            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: { timezone }
            });

            // Transform the user data to match the schema
            const transformedUser = {
                id: updatedUser.id,
                email: updatedUser.email,
                fullName: updatedUser.fullName,
                timezone: updatedUser.timezone,
                createdAt: updatedUser.createdAt.toISOString(),
                updatedAt: updatedUser.updatedAt.toISOString(),
                avocado: updatedUser.avocado
            };

            return {
                success: true,
                data: { user: userResponseSchema.parse(transformedUser) },
                status: 200,
            };
        } catch (error: any) {
            return {
                success: false,
                error: { code: "TIMEZONE_UPDATE_FAILED", message: error.message },
                status: 500,
            };
        }
    }

    static async getProfile(userId: string): Promise<ApiResponse<{ user?: any }>> {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId }
            });

            if (!user) {
                return {
                    success: false,
                    error: { code: "USER_NOT_FOUND", message: "User not found" },
                    status: 404,
                };
            }

            // Transform the user data to match the schema
            const transformedUser = {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                timezone: user.timezone,
                createdAt: user.createdAt.toISOString(),
                updatedAt: user.updatedAt.toISOString(),
                avocado: user.avocado
            };

            return {
                success: true,
                data: { user: userResponseSchema.parse(transformedUser) },
                status: 200,
            };
        } catch (error: any) {
            return {
                success: false,
                error: { code: "PROFILE_FETCH_FAILED", message: error.message },
                status: 500,
            };
        }
    }

    static async updateProfile(userId: string, updateData: any): Promise<ApiResponse<{ user?: any }>> {
        try {
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: updateData
            });

            // Transform the user data to match the schema
            const transformedUser = {
                id: updatedUser.id,
                email: updatedUser.email,
                fullName: updatedUser.fullName,
                timezone: updatedUser.timezone,
                createdAt: updatedUser.createdAt.toISOString(),
                updatedAt: updatedUser.updatedAt.toISOString(),
                avocado: updatedUser.avocado
            };

            return {
                success: true,
                data: { user: userResponseSchema.parse(transformedUser) },
                status: 200,
            };
        } catch (error: any) {
            return {
                success: false,
                error: { code: "PROFILE_UPDATE_FAILED", message: error.message },
                status: 500,
            };
        }
    }
}
