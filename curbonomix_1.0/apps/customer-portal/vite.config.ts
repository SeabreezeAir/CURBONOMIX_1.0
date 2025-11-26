import { defineConfig } from "vite"; import react from "@vitejs/plugin-react";
const api = process.env.VITE_API || "http://127.0.0.1:3000";
export default defineConfig({ plugins:[react()], server:{ proxy:{ "/api":{ target: api, changeOrigin:true, rewrite:p=>p.replace(/^\/api/,"") } } } });