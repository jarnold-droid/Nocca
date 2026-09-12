import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Prisma's generated client and the Neon serverless driver as real
  // dependencies in the deployed function bundle rather than being processed
  // by the bundler, per Prisma's guidance for driver-adapter deployments.
  serverExternalPackages: ["@prisma/client", "pg"],
};

export default nextConfig;
