let _id = 0;
export const fakeId = () => `id_${++_id}_${Math.random().toString(36).slice(2, 8)}`;

export const randomFrom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const randomFloat = (min: number, max: number, decimals = 2) =>
  parseFloat((Math.random() * (max - min) + min).toFixed(decimals));

export const fakeDateRecent = (days = 30) => {
  const d = new Date();
  d.setDate(d.getDate() - randomInt(0, days));
  return d.toISOString().split('T')[0];
};

export const fakeDateFuture = (days = 90) => {
  const d = new Date();
  d.setDate(d.getDate() + randomInt(1, days));
  return d.toISOString().split('T')[0];
};

export const fakeDatePast = (months = 12) => {
  const d = new Date();
  d.setMonth(d.getMonth() - randomInt(1, months));
  return d.toISOString().split('T')[0];
};

export const fakeTime = () =>
  `${String(randomInt(7, 19)).padStart(2, '0')}:${String(randomInt(0, 59)).padStart(2, '0')}`;

export const firstNames = [
  'Arif', 'Sara', 'Ahmed', 'Fatima', 'Hassan', 'Zara', 'Omar', 'Aisha',
  'Bilal', 'Nadia', 'Yusuf', 'Maryam', 'Tariq', 'Hina', 'Imran', 'Sana',
  'Khalid', 'Lubna', 'Faisal', 'Amina',
];

export const lastNames = [
  'Khan', 'Ali', 'Ahmed', 'Malik', 'Hussain', 'Shah', 'Iqbal', 'Rashid',
  'Chaudhry', 'Butt', 'Mirza', 'Qureshi', 'Siddiqui', 'Raza', 'Aslam',
];

export const companies = [
  'TechVista', 'CloudNine', 'DataPeak', 'WebForge', 'PixelCraft',
  'CodeSphere', 'NetBoost', 'DigiFlow', 'AppNova', 'CyberEdge',
  'BrightPath', 'QuantumLeap', 'SkyBridge', 'CoreStack', 'BlueShift',
];

export const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Operations', 'Finance', 'Design'];
export const branches = ['Main Office', 'Branch A', 'Branch B', 'Remote'];
export const countries = ['Pakistan', 'UAE', 'Saudi Arabia', 'UK', 'USA', 'Canada', 'Germany', 'Turkey'];

export const fakeName = () => `${randomFrom(firstNames)} ${randomFrom(lastNames)}`;
export const fakeEmail = (name: string) => `${name.toLowerCase().replace(/\s/g, '.')}@example.com`;
export const fakePhone = () => `+92${randomInt(300, 399)}${randomInt(1000000, 9999999)}`;

export const categories = ['Software', 'Marketing', 'Travel', 'Equipment', 'Office', 'Training', 'Utilities'];
export const sources = ['Website', 'Referral', 'LinkedIn', 'Cold Call', 'Event', 'Google Ads', 'Social Media'];
export const serviceNames = [
  'SEO Optimization', 'Web Development', 'Content Writing', 'Social Media Management',
  'PPC Campaign', 'Logo Design', 'Mobile App Development', 'Email Marketing',
  'Video Production', 'Backlink Building',
];

export { formatCurrency, formatCompact } from '@/lib/format';
