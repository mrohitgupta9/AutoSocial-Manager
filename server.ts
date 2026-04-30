import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { initDatabase } from "./server/db.ts";
import { startScheduler } from "./server/scheduler.ts";
import apiRouter from "./server/api.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize DB
  initDatabase();

  // Initialize Scheduler
  startScheduler();

  app.use(express.json());

  // API routes
  app.use("/api", apiRouter);

  // Serve generated images
  const generatedPath = path.join(process.cwd(), "data", "generated");
  if (!fs.existsSync(generatedPath)) {
    fs.mkdirSync(generatedPath, { recursive: true });
  }
  app.use("/generated", express.static(generatedPath));
  
  // Serve logos
  const logosPath = path.join(process.cwd(), "data", "logos");
  if (!fs.existsSync(logosPath)) {
    fs.mkdirSync(logosPath, { recursive: true });
  }
  app.use("/logos", express.static(logosPath));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
