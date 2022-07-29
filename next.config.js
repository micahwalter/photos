/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    API_ENDPOINT: process.env.API_ENDPOINT,
    CLOUDFRONT_ENDPOINT: process.env.CLOUDFRONT_ENDPOINT,
  }
}

module.exports = nextConfig
