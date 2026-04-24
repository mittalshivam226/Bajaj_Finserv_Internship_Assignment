/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    // If this deployment is marked as backend-only, disable the frontend UI
    if (process.env.BACKEND_ONLY === "true") {
      return [
        {
          source: "/",
          destination: "/api/bfhl",
          permanent: false,
        },
      ];
    }
    return [];
  },
  async rewrites() {
    return [
      {
        source: "/bfhl",
        destination: "/api/bfhl",
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
        ],
      },
      {
        source: "/bfhl",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
        ],
      },
    ];
  },
};

export default nextConfig;
