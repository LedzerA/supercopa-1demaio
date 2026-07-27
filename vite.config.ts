import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" para o app funcionar em qualquer caminho (GitHub Pages,
// subpasta, file://). Nunca use URLs absolutas para assets.
export default defineConfig({
  plugins: [react()],
  base: "./",
});
