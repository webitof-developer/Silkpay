import type { CapacitorConfig } from "@capacitor/cli";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://silkpay.vercel.app";

const config: CapacitorConfig = {
  appId: "com.webitof.silkpay",
  appName: "SilkPay",
  webDir: "public",
  server: {
    url: appUrl,
    cleartext: appUrl.startsWith("http://"),
  },
};

export default config;
