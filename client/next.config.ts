import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a phone on the same Wi-Fi open the dev server at this address.
  allowedDevOrigins: ["192.168.1.9"],
};

export default nextConfig;
