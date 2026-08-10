export interface OperationalScheduleEntryDto {
  id: string;
  name: string;
  startTime: string;
  duration: number;
  capacity: number;
  type: 'BOOKABLE' | 'OPERATIONAL';
}

export interface CreateOperationalScheduleDto {
  eventId: string;
  name: string;
  pattern: string;
  startDate: string;
  endDate: string;
  timetable: OperationalScheduleEntryDto[];
}