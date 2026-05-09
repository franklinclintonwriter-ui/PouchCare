import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import licenseRoutes from "./routes/licenses.js";
import siteRoutes from "./routes/sites.js";
import adminRoutes from "./routes/admin.js";
import customerRoutes from "./routes/customer.js";
import { apiLimiter, authLimiter } from "./middleware/rateLimiter.js";

const app = express();
const PORT = process.env.PORT || 4000;

// --------------- Middleware ---------------
const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, cb) {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));

// Global rate limit
app.use(apiLimiter);

// --------------- Health check ---------------
app.get("/health", (_req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

// --------------- Routes ---------------
app.use("/auth", authLimiter, authRoutes);
app.use("/licenses", licenseRoutes);
app.use("/sites", siteRoutes);
app.use("/admin", adminRoutes);
app.use("/customer", customerRoutes);

// --------------- 404 catch-all ---------------
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// --------------- Global error handler ---------------
app.use((err, _req, res, _next) => {
  console.error("[API Error]", err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// --------------- Start ---------------
app.listen(PORT, () => {
  console.log(`PouchCare API running on http://localhost:${PORT}`);
});

export default app;
