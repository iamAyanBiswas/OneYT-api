import crypto from "crypto";

const secretKey = process.env.KEY!
const time = 15

export function createToken({ id, quality, title, type }: TokenInternalPayload, ipAddress: string) {
    const payload = {
        id,
        quality,
        title,
        type,
        ipAddress,
        exp: Date.now() + time * 60 * 1000 // 15 min expiration
    };

    const json = Buffer.from(JSON.stringify(payload));

    const iv = crypto.randomBytes(12); // recommended size for GCM
    const key = crypto.createHash("sha256").update(secretKey).digest(); // derive 32-byte key

    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([cipher.update(json), cipher.final()]);
    const tag = cipher.getAuthTag();

    // combine iv + encrypted + tag
    const token = Buffer.concat([iv, encrypted, tag]).toString("base64url");
    return token;
}

export function verifyToken(token: string, ipAddress: string,) {
    const data = Buffer.from(token, "base64url");

    const iv = data.subarray(0, 12);
    const tag = data.subarray(data.length - 16);
    const ciphertext = data.subarray(12, data.length - 16);

    const key = crypto.createHash("sha256").update(secretKey).digest();

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);

    let decrypted;
    try {
        decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    } catch (e) {
        throw new Error("Invalid or tampered token");
    }

    const payload = JSON.parse(decrypted.toString());

    // check expiration
    if (Date.now() > payload.exp) {
        throw new Error("Token expired");
    }

    // check IP binding
    if (payload.ipAddress !== ipAddress) {
        throw new Error("Token not for this IP");
    }

    return { id: payload.id, title: payload.title, type: payload.type, quality: payload.type === 'audio' ? Number(payload.quality) : payload.quality } as TokenInternalPayload
}

