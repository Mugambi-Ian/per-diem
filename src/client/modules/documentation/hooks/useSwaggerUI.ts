'use client';

import { useEffect } from 'react';
import { SwaggerUIBundle } from 'swagger-ui-dist';
import 'swagger-ui-dist/swagger-ui.css';

interface UseSwaggerUIProps {
    domNodeRef: React.RefObject<HTMLDivElement>;
}

export function useSwaggerUI({ domNodeRef }: UseSwaggerUIProps) {
    useEffect(() => {
        if (domNodeRef.current) {
            SwaggerUIBundle({
                requestInterceptor: (req) => {
                    const csrfToken = document.cookie
                        .split('; ')
                        .find(row => row.startsWith('csrf_token='))
                        ?.split('=')[1];
                    if (csrfToken) req.headers['x-csrf-token'] = csrfToken;
                    return req;
                },
                domNode: domNodeRef.current,
                url: '/api/documentation/json',
            });
        }
    }, [domNodeRef]);
}