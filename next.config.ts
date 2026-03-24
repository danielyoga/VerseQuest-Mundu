import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Lets webpack HMR / dev internals load when you open the app from another device
   * on your LAN (e.g. http://192.168.247.77:3000). Add more IPs here if your machine
   * gets a different address. Restart `npm run dev` after changing this.
   */
};

export default nextConfig;
