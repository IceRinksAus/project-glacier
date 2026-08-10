import { api } from "@/lib/api";

export type OperationalSchedulePattern =
  | "DAILY"
  | "WEEKDAY_WEEKEND"
  | "SELECTED_DAYS"
  | "MANUAL";

export interface OperationalScheduleEntry {
  id: string;
  name: string;
  startTime: string;
  duration: number;
  capacity: number;
  type: "BOOKABLE" | "OPERATIONAL";
}

export interface CreateOperationalSchedulePayload {
  eventId: string;
  name: string;
  pattern: OperationalSchedulePattern;
  startDate: string;
  endDate: string;

  timetable?: OperationalScheduleEntry[];

  weekdayTimetable?: OperationalScheduleEntry[];
  weekendTimetable?: OperationalScheduleEntry[];
}

export interface OperationalScheduleResponse {
  schedule: {
    id: string;
    name: string;
    pattern: string;
    startDate: string;
    endDate: string;
    timetable:
      | OperationalScheduleEntry[]
      | {
          weekdayTimetable: OperationalScheduleEntry[];
          weekendTimetable: OperationalScheduleEntry[];
        };
    eventId: string;
    createdAt: string;
    updatedAt: string;
  };

  generatedSessions: number;
  operationalBlocks: number;
}

export const operationalScheduleService = {
  createSchedule(
    payload: CreateOperationalSchedulePayload,
  ) {
    return api.post<OperationalScheduleResponse>(
      "/operational-schedule",
      payload,
    );
  },
};