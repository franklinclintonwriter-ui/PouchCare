import type { Domain, ServerAsset, WebsiteAsset, Service, BacklinkPackage } from '@/types/models';
import { fakeId, randomFrom, randomInt, randomFloat, fakeDateFuture, fakeDateRecent } from './generators';

const registrars = ['Namecheap', 'GoDaddy', 'Cloudflare', 'Google Domains'];
const dnsProviders = ['Cloudflare', 'Route53', 'DigitalOcean DNS', 'Namecheap'];
const domainNames = [
  'pouchcare.com', 'pouchdigital.com', 'techvista.io', 'clientportal.net',
  'seoboost.org', 'webforge.dev', 'datapeak.co', 'cloudnine.app',
  'pixelcraft.studio', 'netboost.io', 'appnova.dev', 'brightpath.co',
];

export const mockDomains: Domain[] = domainNames.map((d) => ({
  id: fakeId(), domain: d, registrar: randomFrom(registrars),
  expiryDate: Math.random() > 0.2 ? fakeDateFuture(365) : fakeDateFuture(25),
  autoRenew: Math.random() > 0.3,
  status: randomFrom(['active', 'active', 'active', 'expired'] as const),
  dnsProvider: randomFrom(dnsProviders), annualCost: randomInt(8, 45),
}));

const providers = ['DigitalOcean', 'AWS', 'Hetzner', 'Vultr', 'Linode'];
const serverNames = ['web-prod-1', 'web-prod-2', 'api-prod', 'db-primary', 'staging-1', 'cdn-edge', 'mail-server'];

export const mockServers: ServerAsset[] = serverNames.map((name) => ({
  id: fakeId(), name, provider: randomFrom(providers),
  ip: `${randomInt(10, 200)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`,
  specs: { cpu: `${randomFrom([2, 4, 8, 16])} vCPU`, ram: `${randomFrom([2, 4, 8, 16, 32])} GB`, disk: `${randomFrom([50, 100, 200, 500])} GB SSD` },
  usage: { cpu: randomFloat(5, 85), ram: randomFloat(20, 90), disk: randomFloat(15, 80) },
  status: randomFrom(['online', 'online', 'online', 'maintenance'] as const),
  uptime: randomFloat(99.0, 99.99), monthlyCost: randomInt(10, 200), websiteCount: randomInt(0, 15),
}));

export const mockWebsites: WebsiteAsset[] = Array.from({ length: 14 }, (_, i) => ({
  id: fakeId(), name: `Site ${i + 1}`, url: `https://${randomFrom(domainNames)}`,
  serverId: randomFrom(mockServers).id, serverName: randomFrom(mockServers).name,
  domainId: randomFrom(mockDomains).id, domainName: randomFrom(mockDomains).domain,
  status: randomFrom(['live', 'live', 'staging', 'down'] as const),
  monthlyTraffic: randomInt(500, 100000), lastDeploy: fakeDateRecent(14),
}));

export const mockServices: Service[] = [
  { id: fakeId(), name: 'SEO Optimization', description: 'Full SEO audit and optimization', category: 'SEO', priceRange: { min: 200, max: 2000 }, isActive: true, orderCount: randomInt(20, 100), icon: 'search' },
  { id: fakeId(), name: 'Web Development', description: 'Custom website development', category: 'Development', priceRange: { min: 500, max: 10000 }, isActive: true, orderCount: randomInt(15, 60), icon: 'code' },
  { id: fakeId(), name: 'Content Writing', description: 'SEO-optimized content creation', category: 'Content', priceRange: { min: 50, max: 500 }, isActive: true, orderCount: randomInt(30, 150), icon: 'file-text' },
  { id: fakeId(), name: 'Social Media Management', description: 'Complete social media handling', category: 'Marketing', priceRange: { min: 300, max: 1500 }, isActive: true, orderCount: randomInt(10, 40), icon: 'share-2' },
  { id: fakeId(), name: 'PPC Campaign', description: 'Pay-per-click advertising', category: 'Marketing', priceRange: { min: 500, max: 5000 }, isActive: true, orderCount: randomInt(8, 35), icon: 'target' },
  { id: fakeId(), name: 'Logo Design', description: 'Professional logo and branding', category: 'Design', priceRange: { min: 100, max: 800 }, isActive: true, orderCount: randomInt(20, 80), icon: 'palette' },
  { id: fakeId(), name: 'Mobile App Development', description: 'iOS and Android app creation', category: 'Development', priceRange: { min: 2000, max: 20000 }, isActive: true, orderCount: randomInt(3, 15), icon: 'smartphone' },
  { id: fakeId(), name: 'Email Marketing', description: 'Email campaign management', category: 'Marketing', priceRange: { min: 150, max: 1000 }, isActive: true, orderCount: randomInt(12, 45), icon: 'mail' },
  { id: fakeId(), name: 'Video Production', description: 'Professional video content', category: 'Content', priceRange: { min: 300, max: 5000 }, isActive: false, orderCount: randomInt(5, 20), icon: 'video' },
  { id: fakeId(), name: 'Backlink Building', description: 'High-quality backlink acquisition', category: 'SEO', priceRange: { min: 100, max: 3000 }, isActive: true, orderCount: randomInt(25, 90), icon: 'link' },
];

export const mockBacklinkPackages: BacklinkPackage[] = [
  { id: fakeId(), name: 'Starter', tier: 'basic', daRange: 'DA 10-30', linkType: 'Guest Post', quantity: 5, price: 99, turnaround: '7 days', isPopular: false },
  { id: fakeId(), name: 'Growth', tier: 'standard', daRange: 'DA 30-50', linkType: 'Guest Post + Niche Edit', quantity: 10, price: 249, turnaround: '14 days', isPopular: true },
  { id: fakeId(), name: 'Authority', tier: 'premium', daRange: 'DA 50-70', linkType: 'Guest Post + Editorial', quantity: 15, price: 599, turnaround: '21 days', isPopular: false },
  { id: fakeId(), name: 'Enterprise', tier: 'enterprise', daRange: 'DA 70+', linkType: 'Premium Editorial', quantity: 25, price: 1499, turnaround: '30 days', isPopular: false },
];
