import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  "/riftcodex-api",
  createProxyMiddleware({
    target: "https://api.riftcodex.com",
    changeOrigin: true,
    pathRewrite: { "^/riftcodex-api": "" },
  })
);

app.use(express.static(join(__dirname, "dist")));

app.get("/{*splat}", (_req, res) => {
  res.sendFile(join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
