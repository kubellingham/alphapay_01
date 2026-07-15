import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production",
});

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Receipt photos are uploaded through a server action.
      bodySizeLimit: "10mb",
    },
  },
};

export default withSerwist(nextConfig);
