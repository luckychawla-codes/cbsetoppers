
/**
 * Simple obfuscation for client-side keys.
 * Note: For real security, these should be handled by a proxy server.
 */
export const decode = (encoded: string): string => {
    return atob(encoded);
};

export const encode = (plain: string): string => {
    return btoa(plain);
};
