export const SNOOZE_THRESHOLD = 2;

// Snooze options in minutes
export const SNOOZE_OPTIONS = {
  SHORT: 5,
  MEDIUM: 15,
  LONG: 30,
} as const;

// Notification priorities
export const NOTIFICATION_PRIORITY = {
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;
