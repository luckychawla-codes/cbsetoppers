/**
 * Multi-layer obfuscation for client-side keys.
 */
export const decode = (s: string): string => {
    try {
        // First layer: standard base64
        let b = atob(s);
        // Second layer: reverse
        let r = b.split('').reverse().join('');
        return r;
    } catch { return ""; }
};

export const encode = (s: string): string => {
    // Inverse order: reverse then b64
    let r = s.split('').reverse().join('');
    return btoa(r);
};
