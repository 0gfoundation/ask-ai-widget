import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  root: "examples",
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    open: true,
    // The demo is browsed over Tailscale as well as on localhost, by hostname
    // and by raw tailnet IP, so bind every interface and allow those hosts
    // through Vite's Host header check.
    host: true,
    allowedHosts: [".ts.net", "localhost"],
  },
});
