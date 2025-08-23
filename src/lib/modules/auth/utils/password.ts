// lib/security/password.ts
import * as argon2 from "argon2";

export async function server_hash_password(password: string) {
    return argon2.hash(password, { type: argon2.argon2id });
}

export async function server_verify_password(hash: string, password: string) {
    try {
        return await argon2.verify(hash, password);
    } catch {
        return false;
    }
}
