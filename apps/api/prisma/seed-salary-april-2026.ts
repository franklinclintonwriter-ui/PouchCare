/**
 * One-off / periodic seed: April 2026 salary list (BDT), random passwords.
 * Run: cd apps/api && npx tsx prisma/seed-salary-april-2026.ts
 *
 * Credentials are written to prisma/.salary-seed-credentials.txt (gitignored).
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { PrismaClient, SystemRole } from "@prisma/client";

const prisma = new PrismaClient();

const CREDENTIALS_FILE = path.join(
  __dirname,
  ".salary-seed-credentials.txt",
);

type Row = {
  name: string;
  salaryBdt: number;
  /** If set, upsert this login (exec accounts). */
  email?: string;
  role?: SystemRole;
};

/** Order matches user-provided April 2026 list (BDT). */
const ROWS: Row[] = [
  { name: "Rakibul Hasan Rashad", salaryBdt: 20_000 },
  { name: "Mirza Yead (Yasin)", salaryBdt: 15_000 },
  { name: "Mushfiqujaman Anik", salaryBdt: 15_000 },
  { name: "Sany Mia Talukdar", salaryBdt: 17_000 },
  { name: "Tanbirul Islam (Lalon)", salaryBdt: 15_000 },
  { name: "Nazmul Hasan (Rimon)", salaryBdt: 15_000 },
  { name: "Arafath Islam Shan", salaryBdt: 25_000 },
  { name: "Md. Shoreful Islam", salaryBdt: 15_000 },
  { name: "Md. Abdullah Al Humaiyun", salaryBdt: 35_000 },
  { name: "Whidul Hasan Sifat", salaryBdt: 15_000 },
  { name: "Masum Parvej", salaryBdt: 15_000 },
  { name: "Irfan Elahi Balam Sabina", salaryBdt: 15_000 },
  { name: "Md Robiul Islam", salaryBdt: 35_000 },
  { name: "Mustakim Mia", salaryBdt: 15_000 },
  { name: "Md Abu Nadim (Champa Begum)", salaryBdt: 15_000 },
  { name: "Zihadduzzaman", salaryBdt: 40_000 },
  { name: "Hifzul Sarker", salaryBdt: 25_000 },
  { name: "Abu Naeim", salaryBdt: 8_000 },
  { name: "Humayun Kabir", salaryBdt: 12_500 },
  { name: "Nahid Hasan Akhand", salaryBdt: 20_000 },
  { name: "Raihan Mia", salaryBdt: 35_000 },
  { name: "Mst. Shanaz", salaryBdt: 0 },
  { name: "Toslim Biswas", salaryBdt: 30_000 },
  { name: "Tasmia Tabassum Sarker", salaryBdt: 50_000 },
  { name: "Md. Habibullah", salaryBdt: 99_500 },
  { name: "Md Barkul Islam", salaryBdt: 25_000 },
  {
    name: "Md Oliullah",
    salaryBdt: 100_000,
    email: "comd@pouchcare.com",
    role: SystemRole.CO_MD,
  },
  {
    name: "Abdullah Al Mamun",
    salaryBdt: 323_000,
    email: "ceo@pouchcare.com",
    role: SystemRole.CEO,
  },
  { name: "Alimul", salaryBdt: 50_000 },
];

const DEFAULT_BRANCH = "Bangladesh HQ";

function randomPassword(): string {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*";
  let s = "";
  for (let i = 0; i < 16; i++) {
    s += chars[crypto.randomInt(0, chars.length)];
  }
  return s;
}

function slugEmail(name: string, index: number): string {
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[()]/g, " ")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .replace(/\.{2,}/g, ".")
    .slice(0, 40);
  const base = slug || `emp.${index}`;
  return `${base}.${String(index).padStart(2, "0")}@team.pouchcare.com`;
}

async function main() {
  const usedEmails = new Set<string>();
  const lines: string[] = [
    "# PouchCare — April 2026 salary seed (BDT)",
    `# Generated: ${new Date().toISOString()}`,
    "# Format: name | email | password | salary (BDT)",
    "# Store securely; staff can change password after first login.",
    "",
  ];

  let i = 0;
  for (const row of ROWS) {
    i += 1;
    const password = randomPassword();
    const passwordHash = bcrypt.hashSync(password, 10);

    let email = row.email?.toLowerCase().trim();
    if (!email) {
      let candidate = slugEmail(row.name, i);
      let n = 0;
      while (usedEmails.has(candidate)) {
        n += 1;
        candidate = slugEmail(`${row.name} ${n}`, i);
      }
      email = candidate;
    }

    if (usedEmails.has(email)) {
      throw new Error(`Duplicate email in batch: ${email}`);
    }
    usedEmails.add(email);

    const role = row.role ?? SystemRole.STAFF;

    await prisma.staffMember.upsert({
      where: { email },
      create: {
        name: row.name,
        email,
        passwordHash,
        systemRole: role,
        status: "Active",
        branch: DEFAULT_BRANCH,
        jobRole: role === SystemRole.STAFF ? "Team Member" : undefined,
        employmentType: "Full-Time",
        salary: row.salaryBdt,
        preferredCurrency: "BDT",
        joinDate: new Date("2026-04-01"),
        phone: null,
      },
      update: {
        name: row.name,
        passwordHash,
        salary: row.salaryBdt,
        preferredCurrency: "BDT",
        systemRole: role,
        branch: DEFAULT_BRANCH,
      },
    });

    lines.push(
      `${row.name} | ${email} | ${password} | ${row.salaryBdt.toLocaleString("en-BD")} BDT`,
    );
  }

  fs.writeFileSync(CREDENTIALS_FILE, lines.join("\n"), "utf8");
  console.log(`✅ Upserted ${ROWS.length} staff records (salary in BDT, preferredCurrency BDT).`);
  console.log(`📄 Credentials: ${CREDENTIALS_FILE}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
