/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // TMDB posters/backdrops + the local logo. Using next/image is optional in
    // this port (we mostly use plain <img> to mirror the original markup), but
    // these remote patterns keep the door open for next/image.
    remotePatterns: [
      { protocol: 'https', hostname: 'image.tmdb.org' },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'referrer-policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
