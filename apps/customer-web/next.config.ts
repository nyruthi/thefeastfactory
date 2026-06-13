import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@aranyam/api-client', '@aranyam/shared-types', '@aranyam/validation'],
};

export default nextConfig;
