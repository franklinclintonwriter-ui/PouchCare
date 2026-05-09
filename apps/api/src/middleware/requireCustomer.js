/**
 * Requires an authenticated user with the customer role.
 * Use after `authenticate`.
 */
export default function requireCustomer(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  if (req.user.role !== "customer") {
    return res.status(403).json({ error: "Customer access required" });
  }
  next();
}
