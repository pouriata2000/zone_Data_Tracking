/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    poweredByHeader: false,
    compress: true,
    
    // Optimize for Vercel deployment
    experimental: {
      serverComponentsExternalPackages: []
    },
    
    // Environment variables
    env: {
      TIME_OFFSET_SECONDS: process.env.TIME_OFFSET_SECONDS || '40'
    }
  }
  
  module.exports = nextConfig