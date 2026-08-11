export type HolidayType = "Public" | "Optional" | "Restricted";

export interface IHoliday {
  Id: number;
  HolidayName: string;
  Date: string;
}
