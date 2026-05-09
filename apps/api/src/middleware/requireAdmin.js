/**
 * Express middleware — requires user to have admin or owner role.
 * Must be used AFTER authenticate middleware.
 */
export default function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  if (req.user.role !== "admin" && req.user.role !== "owner") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}
