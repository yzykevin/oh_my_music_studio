const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['@react-pdf/renderer'],
};

module.exports = process.env.NODE_ENV === 'production'
  ? { ...nextConfig, output: 'standalone' }
  : nextConfig;
