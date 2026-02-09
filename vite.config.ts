/// <reference types="node" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

const API_URL = "https://localhost:7297"; // ← your API launch URL

export default defineConfig({
    server: {
        port: 5173,
        proxy: {
            "/api": { target: API_URL, changeOrigin: true, secure: false },
            "/motive-proxy": {
                target: "https://api.gomotive.com",
                changeOrigin: true,
                secure: true,
                rewrite: (path) => path.replace(/^\/motive-proxy/, "")
            },
        },
    },
    plugins: [react()],
    resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
