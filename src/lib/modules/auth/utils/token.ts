import crypto from "crypto";
import * as argon2 from "argon2";
import {RefreshTokenService} from "@/lib/modules/auth/service/refresh.service";


export function server_generate_refresh_token() {
    return crypto.randomBytes(48).toString("hex");
}

export async function server_hash_refresh_token(token: string) {
    // use argon2 for token hashing
    return argon2.hash(token);
}

export async function server_verify_refresh_token_plain(id: string, plain: string) {
    const t = await RefreshTokenService.findValidRefreshTokenById(id);
    if (!t) return null;
    const ok = await argon2.verify(t.tokenHash, plain).catch(() => false);
    return ok ? t : null;
}
