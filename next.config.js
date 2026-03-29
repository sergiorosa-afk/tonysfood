/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: [
      '@whiskeysockets/baileys',
      'sharp',
      'fluent-ffmpeg',
      '@ffmpeg-installer/ffmpeg',
      'jimp',
      'link-preview-js',
    ],
  },
}
module.exports = nextConfig
