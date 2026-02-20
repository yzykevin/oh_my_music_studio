const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
};

module.exports = process.env.NODE_ENV === 'production' 
  ? { ...nextConfig, output: 'export' }
  : nextConfig;
