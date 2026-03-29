/** @type {import('next').NextConfig} */
const nextConfig = {
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
