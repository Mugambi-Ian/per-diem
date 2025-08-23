import {SignJWT, jwtVerify, importJWK, JWTPayload} from "jose";
const accessExpiresMinutes = Number(process.env.JWT_ACCESS_EXPIRES_MINUTES || 15);
const secretBase64 = process.env.JWT_SECRET_BASE64;
if (!secretBase64) throw new Error("JWT_SECRET_BASE64 not set");

const secret = Buffer.from(secretBase64, "base64"); // symmetric

export async function server_sign_access_token(payload: JWTPayload) {
    const alg = "HS256";
    const key = await importJWK({ kty: "oct", k: secret.toString("base64") }, alg);
    const now = Math.floor(Date.now() / 1000);
    const exp = now + accessExpiresMinutes * 60;

    return await new SignJWT(payload)
        .setProtectedHeader({ alg })
        .setIssuedAt(now)
        .setExpirationTime(exp)
        .sign(key as unknown as CryptoKey);
}

export async function server_verify_access_token(token: string) {
    const alg = "HS256";
    const key = await importJWK({ kty: "oct", k: secret.toString("base64") }, alg);
    const res = await jwtVerify(token, key as unknown as CryptoKey, {
        algorithms: ["HS256"],
    });
    return res.payload;
}
