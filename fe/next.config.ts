import type { NextConfig } from "next";
const backend = process.env.ALDY_API_URL || "http://127.0.0.1:3300";
const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/tentang", destination: "/about", permanent: true },
      { source: "/pengalaman", destination: "/experiences", permanent: true },
      {
        source: "/pengalaman/:slug",
        destination: "/experiences/:slug",
        permanent: true,
      },
      { source: "/kontak", destination: "/contact", permanent: true },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/aldy/:path*",
        destination: `${backend.replace(/\/$/, "")}/:path*`,
      },
    ];
  },
};
export default nextConfig;
