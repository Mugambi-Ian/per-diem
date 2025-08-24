// src/lib/utils/logger.ts
import pino from "pino";
import fs from "fs";
import path from "path";

const logDir = process.env.LOG_DIR || "./logs";
const logName = process.env.LOG_NAME || "per-diem";

const logPath = path.join(logDir, `${logName}.log`);

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Create logger
export const logger = pino(
    { level: process.env.NODE_ENV === "development" ? "debug" : "info" },
    pino.destination({ dest: logPath, sync: false })
);
