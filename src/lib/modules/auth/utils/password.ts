// lib/security/password.ts
import * as argon2 from "argon2";

export async function server_hash_password(password: string) {
    return argon2.hash(password, { 
        type: argon2.argon2id,
        memoryCost: 2 ** 16, // 64 MiB
        timeCost: 3, // 3 iterations
        parallelism: 1
    });
}

export async function server_verify_password(hash: string, password: string) {
    try {
        return await argon2.verify(hash, password);
    } catch {
        return false;
    }
}

export function validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 12) {
        errors.push("Password must be at least 12 characters long");
    }
    
    if (!/[A-Z]/.test(password)) {
        errors.push("Password must contain at least one uppercase letter");
    }
    
    if (!/[a-z]/.test(password)) {
        errors.push("Password must contain at least one lowercase letter");
    }
    
    if (!/[0-9]/.test(password)) {
        errors.push("Password must contain at least one number");
    }
    
    if (!/[^A-Za-z0-9]/.test(password)) {
        errors.push("Password must contain at least one special character");
    }
    
    // Check for common patterns
    const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
    const lowerPassword = password.toLowerCase();
    if (commonPasswords.some(common => lowerPassword.includes(common))) {
        errors.push("Password is too common or contains common patterns");
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}
