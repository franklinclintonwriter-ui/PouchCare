import type { Position, JobApplication } from '@/types/models';
import { fakeId, fakeName, fakeEmail, randomFrom, randomInt, fakeDateRecent, fakeDatePast, departments } from './generators';

const positionStatuses: Position['status'][] = ['open', 'closed', 'paused'];
const employmentTypes: Position['type'][] = ['full_time', 'part_time', 'contract', 'internship'];
const stages: JobApplication['stage'][] = ['new', 'screening', 'interview', 'offer', 'hired', 'rejected'];
const locations = ['On-site', 'Remote', 'Hybrid'];

const positionTitles = [
  'Senior Frontend Developer', 'Backend Engineer', 'UI/UX Designer',
  'SEO Specialist', 'Content Writer', 'DevOps Engineer',
  'Project Manager', 'Sales Executive', 'HR Coordinator',
  'Marketing Manager', 'Data Analyst', 'Customer Support Lead',
];

export const mockPositions: Position[] = positionTitles.map((title) => ({
  id: fakeId(), title, department: randomFrom(departments),
  location: randomFrom(locations), type: randomFrom(employmentTypes),
  salaryRange: { min: randomInt(3, 8) * 10000, max: randomInt(9, 20) * 10000 },
  applicationsCount: randomInt(2, 35), status: randomFrom(positionStatuses),
  postedDate: fakeDatePast(3),
}));

export const mockApplications: JobApplication[] = Array.from({ length: 30 }, () => {
  const pos = randomFrom(mockPositions);
  const name = fakeName();
  return {
    id: fakeId(), applicantName: name, applicantEmail: fakeEmail(name),
    positionId: pos.id, positionTitle: pos.title,
    stage: randomFrom(stages), resumeUrl: '#',
    rating: randomInt(1, 5), appliedDate: fakeDateRecent(30),
    notes: randomFrom(['Strong candidate', 'Needs follow-up', 'Good cultural fit', 'Technical skills impressive', '']),
  };
});
