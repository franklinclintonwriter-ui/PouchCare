export interface MockBranch {
  id: string;
  name: string;
  city: string;
  country: string;
  status: 'online' | 'partial' | 'offline';
  totalCameras: number;
  onlineCameras: number;
  gradientFrom: string;
  gradientTo: string;
  address: string;
  nvr: string;
}

export interface MockCamera {
  id: string;
  branchId: string;
  label: string;
  location: string;
  status: 'online' | 'offline' | 'recording';
  resolution: string;
  streamUrl: string;
  lastMotion?: string;
  fps: number;
  angle: string;
  hasAudio: boolean;
  hasMotionDetect: boolean;
}

export const MOCK_BRANCHES: MockBranch[] = [
  {
    id: 'branch-dhaka',
    name: 'Dhaka Main Office',
    city: 'Dhaka',
    country: 'Bangladesh',
    status: 'online',
    totalCameras: 12,
    onlineCameras: 12,
    gradientFrom: '#1d4ed8',
    gradientTo: '#3b82f6',
    address: 'House 12, Road 7, Banani, Dhaka-1213',
    nvr: 'Hikvision DS-9632NI-I8',
  },
  {
    id: 'branch-chittagong',
    name: 'Chittagong Branch',
    city: 'Chittagong',
    country: 'Bangladesh',
    status: 'partial',
    totalCameras: 8,
    onlineCameras: 6,
    gradientFrom: '#0f766e',
    gradientTo: '#14b8a6',
    address: 'Agrabad C/A, Chittagong',
    nvr: 'Dahua NVR5216-4KS2',
  },
  {
    id: 'branch-sylhet',
    name: 'Sylhet Branch',
    city: 'Sylhet',
    country: 'Bangladesh',
    status: 'online',
    totalCameras: 6,
    onlineCameras: 6,
    gradientFrom: '#7e22ce',
    gradientTo: '#a855f7',
    address: 'Zindabazar, Sylhet-3100',
    nvr: 'Hikvision DS-7716NI-K4',
  },
  {
    id: 'branch-dubai',
    name: 'Dubai Office',
    city: 'Dubai',
    country: 'UAE',
    status: 'online',
    totalCameras: 10,
    onlineCameras: 10,
    gradientFrom: '#b45309',
    gradientTo: '#f59e0b',
    address: 'Business Bay, Sheikh Zayed Road, Dubai',
    nvr: 'Axis S3016',
  },
  {
    id: 'branch-remote',
    name: 'Remote Hub',
    city: 'London',
    country: 'UK',
    status: 'offline',
    totalCameras: 4,
    onlineCameras: 0,
    gradientFrom: '#374151',
    gradientTo: '#6b7280',
    address: 'Canary Wharf, London E14',
    nvr: 'Synology NVR1218',
  },
];

const CAMERA_LOCATIONS = [
  'Main Entrance', 'Reception', 'Server Room', 'Office Floor', 'Meeting Room A',
  'Meeting Room B', 'Parking Lot', 'Fire Exit', 'CEO Office', 'Operations Room',
  'Warehouse', 'Roof Access', 'Side Entrance', 'Break Room', 'Print Room',
];

const RESOLUTIONS = ['1080p', '4K', '2K', '720p'];
const ANGLES = ['Wide 140°', 'Standard 90°', 'Narrow 60°', 'PTZ 360°'];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 4294967296;
  };
}

function buildCamerasForBranch(branch: MockBranch): MockCamera[] {
  const cameras: MockCamera[] = [];
  const rand = seededRandom(branch.id.charCodeAt(0) + branch.id.charCodeAt(5));

  for (let i = 0; i < branch.totalCameras; i++) {
    const isOnline = i < branch.onlineCameras;
    const isRecording = isOnline && rand() > 0.3;
    const loc = CAMERA_LOCATIONS[i % CAMERA_LOCATIONS.length];

    const lastMotionMinsAgo = Math.floor(rand() * 120);
    const lastMotion = new Date(Date.now() - lastMotionMinsAgo * 60_000).toISOString();

    cameras.push({
      id: `${branch.id}-cam-${i + 1}`,
      branchId: branch.id,
      label: `CAM-${String(i + 1).padStart(2, '0')}`,
      location: loc,
      status: isOnline ? (isRecording ? 'recording' : 'online') : 'offline',
      resolution: RESOLUTIONS[Math.floor(rand() * RESOLUTIONS.length)],
      streamUrl: `rtsp://stream.pouchcare.com/${branch.id}/cam${i + 1}/live`,
      lastMotion: isOnline ? lastMotion : undefined,
      fps: isOnline ? [15, 25, 30][Math.floor(rand() * 3)] : 0,
      angle: ANGLES[Math.floor(rand() * ANGLES.length)],
      hasAudio: rand() > 0.5,
      hasMotionDetect: rand() > 0.3,
    });
  }

  return cameras;
}

export const MOCK_CAMERAS: MockCamera[] = MOCK_BRANCHES.flatMap(buildCamerasForBranch);

export function getMockBranch(id: string): MockBranch | undefined {
  return MOCK_BRANCHES.find((b) => b.id === id);
}

export function getMockCamerasForBranch(branchId: string): MockCamera[] {
  return MOCK_CAMERAS.filter((c) => c.branchId === branchId);
}

export function getMockCamera(id: string): MockCamera | undefined {
  return MOCK_CAMERAS.find((c) => c.id === id);
}

export const MONITOR_SUMMARY = {
  totalBranches: MOCK_BRANCHES.length,
  onlineBranches: MOCK_BRANCHES.filter((b) => b.status === 'online').length,
  totalCameras: MOCK_BRANCHES.reduce((acc, b) => acc + b.totalCameras, 0),
  onlineCameras: MOCK_BRANCHES.reduce((acc, b) => acc + b.onlineCameras, 0),
  recordingCameras: MOCK_CAMERAS.filter((c) => c.status === 'recording').length,
  offlineCameras: MOCK_CAMERAS.filter((c) => c.status === 'offline').length,
};
