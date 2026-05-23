import { Router } from "express";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

const dataPath = join(__dirname, "../data/blog-posts.json");
let blogData;

try {
  blogData = JSON.parse(readFileSync(dataPath, "utf-8"));
} catch (err) {
  console.error("[blog] Failed to load blog-posts.json:", err.message);
  blogData = { categories: [], authors: {}, posts: [] };
}

router.get("/posts", (_req, res) => {
  res.json({
    categories: blogData.categories,
    authors: blogData.authors,
    posts: blogData.posts,
  });
});

export default router;
