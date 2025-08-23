import pino from "pino";
import fs from "fs";
import path from "path";


const logPath = process.env.LOG_DIR
    ? path.join(process.env.LOG_DIR, process.env.LOG_NAME+".log")
    : undefined;

export const logger = pino(
    logPath ? fs.createWriteStream(logPath, { flags: "a" }) : undefined
);
