import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: "standalone",
    typescript: { ignoreBuildErrors: true },
    experimental: {
        serverActions: {
            bodySizeLimit: "5mb"
        },
        cpus: 1,
        workerThreads: false,
    }
};

export default nextConfig;
