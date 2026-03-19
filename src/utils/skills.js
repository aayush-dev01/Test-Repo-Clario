export const AVAILABLE_SKILLS = ['React', 'Python', 'Public Speaking', 'Photography', 'UI Design'];

export const TIMING_OPTIONS = [
  'Anytime',
  '12-1 AM',
  '1-2 AM',
  '2-3 AM',
  '3-4 AM',
  '4-5 AM',
  '5-6 AM',
  '6-7 AM',
  '7-8 AM',
  '8-9 AM',
  '9-10 AM',
  '10-11 AM',
  '11 AM-12 PM',
  '12-1 PM',
  '1-2 PM',
  '2-3 PM',
  '3-4 PM',
  '4-5 PM',
  '5-6 PM',
  '6-7 PM',
  '7-8 PM',
  '8-9 PM',
  '9-10 PM',
  '10-11 PM',
  '11 PM-12 AM',
];

export function normalizeSkill(s) {
  if (typeof s === 'string') return { name: s, rate: 0, timingSlots: [] };
  return {
    name: s.name || s.skill || '',
    rate: s.rate ?? 0,
    timingSlots: s.timingSlots || [],
  };
}

export function getSkillName(s) {
  return typeof s === 'string' ? s : (s.name || s.skill || '');
}
