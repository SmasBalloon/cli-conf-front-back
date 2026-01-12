import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Configuration de redirection des appels API selon l'environnement
  async rewrites() {
    // En production, pas de proxy nécessaire car on utilise des URLs absolues
    if (process.env.NODE_ENV === "production") {
      return [];
    }

    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3000/api/:path*",
      },
    ];
  },

  // Configuration CORS pour les API routes
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },

  // Configuration pour éviter les erreurs d'hydratation
  reactStrictMode: true,
};

export default nextConfig;