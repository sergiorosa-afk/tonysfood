/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    '@whiskeysockets/baileys',
    'sharp',
    'fluent-ffmpeg',
    '@ffmpeg-installer/ffmpeg',
    'jimp',
    'link-preview-js',
  ],
}
module.exports = nextConfig
