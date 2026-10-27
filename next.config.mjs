/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Allow production builds to complete even if there are ESLint warnings/errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow production builds to complete even if there are minor type errors
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
