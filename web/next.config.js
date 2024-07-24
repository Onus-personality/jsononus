const createNextIntlPlugin = require('next-intl/plugin');
const { withContentlayer } = require('next-contentlayer');

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    },
    serverComponentsExternalPackages: ['@sparticuz/chromium']
  },
  typescript: {
    ignoreBuildErrors: true
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('_http_common');
    }
    // Add this line to handle binary files
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader'
    });
    return config;
  },
  // Add this to handle the Chromium binary
  output: 'standalone'
};

module.exports = withContentlayer(withNextIntl(nextConfig));
