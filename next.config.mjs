import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: '/favicon.ico', destination: '/favicon.svg' },
    ];
  },
};

export default withMDX(config);
