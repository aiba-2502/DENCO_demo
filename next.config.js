/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: { unoptimized: true },
  // 完全に動的レンダリングを強制
  experimental: {
    isrMemoryCacheSize: 0,
  },
  webpack: (config) => {
    config.cache = false;
    return config;
  }
};

module.exports = nextConfig;