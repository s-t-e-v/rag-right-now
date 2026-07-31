import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// TODO: proxy /api to the Hono worker in dev (server.proxy)
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
