/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    API_ENDPOINT: process.env.API_ENDPOINT,
    CLOUDFRONT_ENDPOINT: process.env.CLOUDFRONT_ENDPOINT,
    CLOUDFRONT_DOMAIN: process.env.CLOUDFRONT_DOMAIN,

  },
  images: {
    domains: [process.env.CLOUDFRONT_DOMAIN],
  },
}

module.exports = nextConfig
