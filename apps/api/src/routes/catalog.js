import { Router } from "express";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const catalogPath = path.join(__dirname, "../data/catalog-templates.json");

const router = Router();

/** Public marketing template catalog (same shape as frontend `data/templates.js`). */
router.get("/templates", (_req, res) => {
  try {
    const raw = readFileSync(catalogPath, "utf8");
    const data = JSON.parse(raw);
    res.json(data);
  } catch {
    res.status(500).json({ error: "Catalog unavailable" });
  }
});

export default router;
