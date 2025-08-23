"use client";

import { useEffect, useRef } from "react";
import {SwaggerUIBundle} from "swagger-ui-dist"; // <-- main bundle
import "swagger-ui-dist/swagger-ui.css";

export function DocumentationView() {
    const uiRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (uiRef.current) {
            SwaggerUIBundle({
                requestInterceptor:(req) => {
                const csrfToken = document.cookie
                    .split("; ")
                    .find(row => row.startsWith("csrf_token="))
                    ?.split("=")[1];
                if (csrfToken) req.headers["x-csrf-token"] = csrfToken;
                return req;
            },
                domNode: uiRef.current,
                url: "/api/documentation/json",
            });
        }
    }, []);

    return <div ref={uiRef} style={{ height: "100vh" }} />;
}
