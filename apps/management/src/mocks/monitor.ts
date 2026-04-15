export interface MockBranch {
  id: string;
  name: string;
  city: string;
  country: string;
  status: "online" | "partial" | "offline";
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
  status: "online" | "offline" | "recording";
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
    id: "branch-phulpur",
    name: "PouchCare - Digital Marketing",
    city: "Phulpur, Mymensingh",
    country: "Bangladesh",
    status: "online",
    totalCameras: 6,
    onlineCameras: 5,
    gradientFrom: "#1d4ed8",
    gradientTo: "#3b82f6",
    address: "Phulpur, Mymensingh, Bangladesh",
    nvr: "TP-Link VIGI NVR1104H-4P",
  },
];

const CAMERA_LOCATIONS = [
  "Main Entrance",
  "Reception",
  "Server Room",
  "Office Floor",
  "Meeting Room A",
  "Meeting Room B",
  "Parking Lot",
  "Fire Exit",
  "CEO Office",
  "Operations Room",
  "Warehouse",
  "Roof Access",
  "Side Entrance",
  "Break Room",
  "Print Room",
];

const RESOLUTIONS = ["1080p", "4K", "2K", "720p"];
const ANGLES = ["Wide 140°", "Standard 90°", "Narrow 60°", "PTZ 360°"];

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
    const lastMotion = new Date(
      Date.now() - lastMotionMinsAgo * 60_000,
    ).toISOString();

    cameras.push({
      id: `${branch.id}-cam-${i + 1}`,
      branchId: branch.id,
      label: `CAM-${String(i + 1).padStart(2, "0")}`,
      location: loc,
      status: isOnline ? (isRecording ? "recording" : "online") : "offline",
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

export const MOCK_CAMERAS: MockCamera[] = MOCK_BRANCHES.flatMap(
  buildCamerasForBranch,
);

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
  onlineBranches: MOCK_BRANCHES.filter((b) => b.status === "online").length,
  totalCameras: MOCK_BRANCHES.reduce((acc, b) => acc + b.totalCameras, 0),
  onlineCameras: MOCK_BRANCHES.reduce((acc, b) => acc + b.onlineCameras, 0),
  recordingCameras: MOCK_CAMERAS.filter((c) => c.status === "recording").length,
  offlineCameras: MOCK_CAMERAS.filter((c) => c.status === "offline").length,
};
