import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { isServer }) => {
    // Handle Node.js module imports that are used by googleapis
    // but not needed in the browser environment
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        child_process: false,
        fs: false,
        net: false,
        tls: false,
        http2: false,
        url: false,
      };
    }

    return config;
  },
};

export default nextConfig;
