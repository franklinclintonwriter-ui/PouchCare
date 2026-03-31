import { PrismaClient, SystemRole, LeadStage, PortalMemberStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding PouchCare database...')

  const hash = await bcrypt.hash('Password123!', 12)

  // ── Team Members ──────────────────────────────────
  const ceo = await prisma.staffMember.upsert({
    where: { email: 'ceo@pouchcare.com' },
    update: {},
    create: {
      name: 'Abdullah Al Mamun', email: 'ceo@pouchcare.com', passwordHash: hash,
      systemRole: SystemRole.CEO, branch: 'Dubai HQ', jobRole: 'CEO & Founder',
      employmentType: "Full-Time", status: 'Active',
      primarySkill: 'On-Page SEO', skillLevel: 'Expert', yearsExperience: 8,
      joinDate: new Date('2016-01-01'),
    },
  })

  const comd = await prisma.staffMember.upsert({
    where: { email: 'comd@pouchcare.com' },
    update: {},
    create: {
      name: 'Oliullah Mithu', email: 'comd@pouchcare.com', passwordHash: hash,
      systemRole: SystemRole.CO_MD, branch: 'Bangladesh HQ', jobRole: 'Co-MD & Partner',
      employmentType: "Full-Time", status: 'Active',
      primarySkill: 'Project Management', skillLevel: 'Expert', yearsExperience: 7,
      joinDate: new Date('2017-06-01'),
    },
  })

  const opsMgr = await prisma.staffMember.upsert({
    where: { email: 'ops@pouchcare.com' },
    update: {},
    create: {
      name: 'Habib Sourov', email: 'ops@pouchcare.com', passwordHash: hash,
      systemRole: SystemRole.OP_MANAGER, branch: 'Bangladesh HQ', jobRole: 'Operations Manager',
      employmentType: "Full-Time", status: 'Active',
      primarySkill: 'Off-Page SEO', skillLevel: 'Expert', yearsExperience: 5,
      joinDate: new Date('2019-03-01'),
    },
  })

  const staff1 = await prisma.staffMember.upsert({
    where: { email: 'staff1@pouchcare.com' },
    update: {},
    create: {
      name: 'Farhan Ahmed', email: 'staff1@pouchcare.com', passwordHash: hash,
      systemRole: SystemRole.STAFF, branch: 'Bangladesh HQ', jobRole: 'SEO Specialist',
      employmentType: "Full-Time", status: 'Active',
      primarySkill: 'Link Building', skillLevel: 'Advanced', yearsExperience: 3,
      joinDate: new Date('2021-08-01'), salary: 800,
    },
  })

  const staff2 = await prisma.staffMember.upsert({
    where: { email: 'staff2@pouchcare.com' },
    update: {},
    create: {
      name: 'Riya Begum', email: 'staff2@pouchcare.com', passwordHash: hash,
      systemRole: SystemRole.STAFF, branch: 'Dhaka', jobRole: 'Content Writer',
      employmentType: "Full-Time", status: 'Active',
      primarySkill: 'Content Writing', skillLevel: 'Intermediate', yearsExperience: 2,
      joinDate: new Date('2022-05-01'), salary: 600,
    },
  })

  console.log('✅ Team members seeded')

  // ── Branches ──────────────────────────────────────
  await prisma.branch.upsert({
    where: { name: 'Dubai HQ' },
    update: {},
    create: { name: 'Dubai HQ', country: 'UAE', city: 'Dubai', type: 'HQ', status: 'Active', branchManager: 'Abdullah Al Mamun' },
  })
  await prisma.branch.upsert({
    where: { name: 'Bangladesh HQ' },
    update: {},
    create: { name: 'Bangladesh HQ', country: 'Bangladesh', city: 'Chittagong', type: 'HQ', status: 'Active', branchManager: 'Habib Sourov' },
  })
  await prisma.branch.upsert({
    where: { name: 'Dhaka' },
    update: {},
    create: { name: 'Dhaka', country: 'Bangladesh', city: 'Dhaka', type: 'Regional', status: 'Active' },
  })
  console.log('✅ Branches seeded')

  // ── Services ──────────────────────────────────────
  const services = [
    { name: 'On-Page SEO', category: 'SEO', basePriceUsd: 200, slug: 'on-page-seo', icon: '🔍', featured: true, turnaroundDays: 7 },
    { name: 'Link Building', category: 'SEO', basePriceUsd: 15, slug: 'link-building', icon: '🔗', featured: true, turnaroundDays: 14 },
    { name: 'Technical SEO', category: 'SEO', basePriceUsd: 300, slug: 'technical-seo', icon: '⚙️', turnaroundDays: 10 },
    { name: 'Local SEO', category: 'SEO', basePriceUsd: 150, slug: 'local-seo', icon: '📍', turnaroundDays: 7 },
    { name: 'Web Development', category: 'Dev', basePriceUsd: 299, slug: 'web-development', icon: '💻', featured: true, turnaroundDays: 21 },
    { name: 'App Development', category: 'Dev', basePriceUsd: 999, slug: 'app-development', icon: '📱', turnaroundDays: 30 },
    { name: 'Graphic Design', category: 'Design', basePriceUsd: 49, slug: 'graphic-design', icon: '🎨', turnaroundDays: 3 },
    { name: 'Content Writing', category: 'Content', basePriceUsd: 25, slug: 'content-writing', icon: '📝', turnaroundDays: 3 },
  ]
  for (const s of services) {
    await prisma.service.upsert({
      where: { slug: s.slug },
      update: {},
      create: { ...s, shortDescription: `Professional ${s.name} service`, displayOrder: services.indexOf(s) },
    })
  }
  console.log('✅ Services seeded')

  // ── Backlink Packages ─────────────────────────────
  const packages = [
    { name: 'Starter Guest Post', type: 'Guest Post', daRange: 'DA 20-30', pricePerLink: 15, priceX10: 130, priceX50: 600, priceX100: 1100, priceX1000: 9500 },
    { name: 'Standard Guest Post', type: 'Guest Post', daRange: 'DA 30-40', pricePerLink: 30, priceX10: 265, priceX50: 1300, priceX100: 2400, priceX1000: 22000, featured: true },
    { name: 'Premium Guest Post', type: 'Guest Post', daRange: 'DA 50+', pricePerLink: 80, priceX10: 720, priceX50: 3600, priceX100: 6800, priceX1000: 65000 },
    { name: 'Niche Edit', type: 'Niche Edit', daRange: 'DA 30-40', pricePerLink: 25, priceX10: 220, priceX50: 1050, priceX100: 1950, priceX1000: 18000 },
    { name: 'Bulk Mixed', type: 'Mixed', daRange: 'Mixed', pricePerLink: 10, priceX10: 88, priceX50: 420, priceX100: 800, priceX1000: 7500 },
  ]
  for (const p of packages) {
    await prisma.backlinkPackage.upsert({
      where: { id: p.name },
      update: {},
      create: { ...p, turnaroundDays: 14 },
    }).catch(() => prisma.backlinkPackage.create({ data: { ...p, turnaroundDays: 14 } }).catch(() => null))
  }
  console.log('✅ Backlink packages seeded')

  // ── Sample tasks ──────────────────────────────────
  await prisma.task.create({
    data: {
      title: 'Build 50 DA30+ backlinks for client domain',
      priority: 'HIGH', category: 'SEO',
      createdByRole: 'CEO', assignedMemberId: staff1.id, assignedManagerId: opsMgr.id,
      assignedBranch: 'Bangladesh HQ',
      deadline: new Date(Date.now() + 14 * 86400000), estimatedHours: 20,
    },
  }).catch(() => null)

  await prisma.task.create({
    data: {
      title: 'Write 10 blog articles for PouchCare website',
      priority: 'MEDIUM', category: 'Content',
      createdByRole: 'OPERATION_MANAGER', assignedMemberId: staff2.id, assignedManagerId: opsMgr.id,
      assignedBranch: 'Dhaka',
      deadline: new Date(Date.now() + 7 * 86400000), estimatedHours: 15,
    },
  }).catch(() => null)

  console.log('✅ Sample tasks seeded')

  // ── Sample CRM lead ───────────────────────────────
  await prisma.crmLead.create({
    data: {
      company: 'TechFlow Agency', contactName: 'James Martin', email: 'james@techflow.io',
      stage: 'QUALIFIED', source: 'Referral', serviceInterested: 'SEO',
      budgetUsd: 500, estimatedValue: 6000, leadScore: 75,
      country: 'United Kingdom', owner: opsMgr.id,
    },
  }).catch(() => null)

  console.log('✅ Sample CRM lead seeded')

  // ── Portal member ─────────────────────────────────
  const portalMember = await prisma.portalMember.upsert({
    where: { email: 'client@example.com' },
    update: {},
    create: {
      fullName: 'John Smith', email: 'client@example.com', passwordHash: hash,
      country: 'United States', referralCode: 'REF-DEMO001',
      emailVerified: true, status: 'ACTIVE', walletBalance: 500,
    },
  })
  console.log('✅ Portal member seeded')

  console.log('\n🎉 Seed complete!\n')
  console.log('Login credentials (all use: Password123!)')
  console.log('─────────────────────────────────────────')
  console.log('CEO:          ceo@pouchcare.com')
  console.log('Co-MD:        comd@pouchcare.com')
  console.log('Ops Manager:  ops@pouchcare.com')
  console.log('Staff 1:      staff1@pouchcare.com')
  console.log('Staff 2:      staff2@pouchcare.com')
  console.log('Portal:       client@example.com  → my.pouchcare.com')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
