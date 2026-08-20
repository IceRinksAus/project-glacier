export type EventReadinessItemStatus =
  'COMPLETE' | 'INCOMPLETE' | 'NOT_REQUIRED';

export interface EventReadinessItem {
  id: 'EVENT_DETAILS' | 'SESSIONS' | 'TICKET_TYPES' | 'WAIVER';
  label: string;
  status: EventReadinessItemStatus;
  explanation: string;
  destinationTab: 'Overview' | 'Sessions' | 'Ticket Types' | 'Waiver';
}

export interface EventReadiness {
  eventId: string;
  readyToActivate: boolean;
  completedRequiredItems: number;
  requiredItems: number;
  percentage: number;
  items: EventReadinessItem[];
}
