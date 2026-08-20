export const AUSTRALIAN_EVENT_TIMEZONES = [
  'Australia/Adelaide',
  'Australia/Brisbane',
  'Australia/Broken_Hill',
  'Australia/Darwin',
  'Australia/Eucla',
  'Australia/Hobart',
  'Australia/Lord_Howe',
  'Australia/Melbourne',
  'Australia/Perth',
  'Australia/Sydney',
] as const;

export type AustralianEventTimezone =
  (typeof AUSTRALIAN_EVENT_TIMEZONES)[number];
