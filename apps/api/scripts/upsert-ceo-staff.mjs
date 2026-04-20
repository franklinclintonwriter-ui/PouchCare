/**
 * One-off: upsert a staff CEO user. Usage (from apps/api):
 *   DATABASE_URL="postgresql://..." node scripts/upsert-ceo-staff.mjs
 * Env: STAFF_CEO_EMAIL, STAFF_CEO_PASSWORD (required), STAFF_CEO_NAME (optional)
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const email = (process.env.STAFF_CEO_EMAIL || "").trim().toLowerCase();
const password = process.env.STAFF_CEO_PASSWORD || "";
const name = (process.env.STAFF_CEO_NAME || "Abdullah Babu").trim();

if (!process.env.DATABASE_URL) {
  console.error("Set DATABASE_URL");
  process.exit(1);
}
if (!email) {
  console.error("Set STAFF_CEO_EMAIL");
  process.exit(1);
}
if (password.length < 6) {
  console.error("Set STAFF_CEO_PASSWORD (min 6 characters)");
  process.exit(1);
}

const prisma = new PrismaClient();
const passwordHash = bcrypt.hashSync(password, 12);
const data = {
  name,
  email,
  passwordHash,
  systemRole: "CEO",
  status: "Active",
  branch: "Company — Global",
  jobRole: "Chief Executive Officer",
  primarySkill: "Strategy & Growth",
  skillLevel: "Expert",
  yearsExperience: 10,
  employmentType: "Full-Time",
  joinDate: new Date("2016-01-01"),
  phone: "+880-1700-000000",
};

const row = await prisma.staffMember.upsert({
  where: { email },
  create: { ...data },
  update: {
    passwordHash: data.passwordHash,
    name: data.name,
    systemRole: data.systemRole,
    status: "Active",
    branch: data.branch,
    jobRole: data.jobRole,
  },
});
console.log(`OK: CEO user ${row.email} (${row.id})`);
await prisma.$disconnect();
