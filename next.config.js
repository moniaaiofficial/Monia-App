const withPWA = require('next-pwa');

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Allow all hosts for Replit's proxied preview environment
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
};

module.exports = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})(nextConfig);
