import { Standard, VCalendar, VTimezone } from "./calendar.ts";

export function createKosenCalendar(shortKosenName: string, kosenName: string) {
  const standard = new Standard({ tzOffsetFrom: "+0900", tzOffsetTo: "+0900" });
  const timezone = new VTimezone({ tzId: "Japan", standard });
  const calendar = new VCalendar({
    prodId: "KOSEN calender scraping project",
    timezone,
    xWrCalName: shortKosenName + " - KOSEN calendar",
    xWrCalDesc: kosenName + "の行事予定です。",
    xWrTimezone: "Asia/Tokyo",
  });

  return calendar;
}
