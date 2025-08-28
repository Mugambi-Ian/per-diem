"use client";

import { useRef } from "react";
import { useSwaggerUI } from "./hooks/useSwaggerUI";

export function DocumentationView() {
    const uiRef = useRef<HTMLDivElement>(null);

    // @ts-expect-error null
    useSwaggerUI({ domNodeRef: uiRef });

    return <div ref={uiRef} style={{ height: "100vh" }} />;
}
