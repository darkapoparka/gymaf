import type { NextConfig } from "next";
const config: NextConfig = {
  devIndicators: false,
  logging: { incomingRequests: { ignore: [/\/auth\/callback(?:\?|$)/] } },
};
export default config;
