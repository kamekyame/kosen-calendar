import { Standard, VCalendar, VTimezone } from "./calendar.ts";

export function createKosenCalendar() {
  const standard = new Standard({ tzOffsetFrom: "+0900", tzOffsetTo: "+0900" });
  const timezone = new VTimezone({ tzId: "Japan", standard });
  const calendar = new VCalendar({
    prodId: "KOSEN calender scraping project",
    timezone,
  });
  return calendar;
}
