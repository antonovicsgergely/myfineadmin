import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * 🔒 Security headers — védekezés gyakori webes támadások ellen.
   */
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff", // Megakadályozza a MIME-type sniffing-et
          },
          {
            key: "X-Frame-Options",
            value: "DENY", // Megakadályozza az oldalunk iframe-be ágyazását (clickjacking)
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block", // Bekapcsolja a böngésző XSS szűrőjét
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()", // Nem szükséges szenzorok tiltása
          },
        ],
      },
    ];
  },

  /** A Next.js ne hirdesse ki magát a válasz fejlécekben */
  poweredByHeader: false,
};

export default nextConfig;
