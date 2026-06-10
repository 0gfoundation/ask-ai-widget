import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  root: "examples",
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    open: true,
  },
});
