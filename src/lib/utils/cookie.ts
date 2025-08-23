/**
 * Appends a value to the 'Set-Cookie' header or creates a new one if not present.
 * @param headers - Headers object (can be Request/Response headers or simple Record<string, string | string[]>)
 * @param cookieValue - The cookie string to append (e.g., "token=abc; Path=/; HttpOnly")
 */
export function cookie_append(
    headers:Record<string, string>={},
    cookieValue: string
) {

    if (headers instanceof Headers) {
        const existing = headers.get('Set-Cookie');
        if (existing) {
            // Multiple cookies can be separated by comma in HTTP headers
            headers.set('Set-Cookie', `${existing}, ${cookieValue}`);
        } else {
            headers.set('Set-Cookie', cookieValue);
        }
    } else {
        const existing = headers['Set-Cookie'];
        if (existing) {
                headers['Set-Cookie'] = `${existing}, ${cookieValue}`
        } else {
            headers['Set-Cookie'] = cookieValue;
        }
    }
    return headers;
}
