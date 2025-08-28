import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
const withNextIntl = createNextIntlPlugin();

const nextConfig = {
    images: {
        remotePatterns: [
            new URL(process.env.NEXT_PUBLIC_APP_URI + 'uploads/**'),
        ],
    },
};

module.exports = withNextIntl(nextConfig);
