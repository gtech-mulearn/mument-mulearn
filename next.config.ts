import type { NextConfig } from "next";

const withPWA = require("@ducanh2912/next-pwa").default({
    dest: "public",
    disable: process.env.NODE_ENV === "development",
    register: true,
    scope: "/",
    sw: "sw.js",
    workboxOptions: {
        importScripts: ["/push-sw.js"],
    },
});

const nextConfig: NextConfig = {
    compress: true, // Enable gzip compression (ref: https://nextjs.org/docs/app/api-reference/config/next-config-js/compress)
    productionBrowserSourceMaps: false, // Reduce bundle size in production (ref: https://nextjs.org/docs/app/api-reference/config/next-config-js/productionBrowserSourceMaps)
    poweredByHeader: false, // Remove X-Powered-By header (ref: https://nextjs.org/docs/app/api-reference/config/next-config-js/poweredByHeader)
    // Optimization for images to reduce egress costs (ref: https://nextjs.org/docs/app/api-reference/config/next-config-js/images)
    images: {
        formats: ['image/avif', 'image/webp'],
    },
};

export default withPWA(nextConfig);

