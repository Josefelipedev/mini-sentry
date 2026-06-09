import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@mini-sentry/shared'],
  output: 'standalone',
};

export default nextConfig;
