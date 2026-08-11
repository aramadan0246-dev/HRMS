import { ListService } from "./ListService";
import { IHoliday } from "../models";

class HolidayServiceImpl extends ListService<IHoliday> {
  constructor() {
    super("Holidays", ["Id", "HolidayName", "Date"]);
  }

  public async getUpcoming(withinDays: number): Promise<IHoliday[]> {
    const all = await this.getAll(undefined, "Date");
    const today = new Date();
    const limit = new Date(today.getTime() + withinDays * 86400000);
    return all.filter((h) => {
      const d = new Date(h.Date);
      return d >= today && d <= limit;
    });
  }
}

export const HolidayService = new HolidayServiceImpl();
