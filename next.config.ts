import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/home.html",
        destination: "/",
        permanent: true,
      },
      {
        source: "/index.html",
        destination: "/",
        permanent: true,
      },
      {
        source: "/about.html",
        destination: "/about",
        permanent: true,
      },
      {
        source: "/disclaimer.html",
        destination: "/disclaimer",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
