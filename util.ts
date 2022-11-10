import { Standard, VCalendar, VEvent, VTimezone } from "./calendar.ts";

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

export function compEvents(
  oldEvents: VEvent[],
  newEvents: VEvent[],
  year: number,
) {
  // 古い方のみ：古い方から削除
  // 新しい方のみ：なにもしない
  // どちらにもある：新しい方から削除
  // 古い方に新しい方をマージ

  oldEvents = oldEvents.filter((o) => {
    if (
      o.dtStart.getTime() < new Date(year, 4 - 1).getTime() ||
      o.dtStart.getTime() >= new Date(year + 1, 4 - 1).getTime()
    ) {
      return true;
    }
    const sameEvent = newEvents.some((n) => {
      if (n.dtEnd.getTime() !== o.dtEnd.getTime()) return false;
      else if (n.dtStart.getTime() !== o.dtStart.getTime()) return false;
      else if (n.summary !== o.summary) return false;
      return true;
    });
    if (sameEvent) return true;
    else return false;
  });

  newEvents = newEvents.filter((n) => {
    const sameEvent = oldEvents.some((o) => {
      if (n.dtEnd.getTime() !== o.dtEnd.getTime()) return false;
      else if (n.dtStart.getTime() !== o.dtStart.getTime()) return false;
      else if (n.summary !== o.summary) return false;
      return true;
    });
    if (sameEvent) return false;
    else return true;
  });

  return [...oldEvents, ...newEvents];
}

export function resolver(meta: ImportMeta) {
  return (path: string) => new URL(path, meta.url);
}

export function fullToHalf(str?: string) {
  return str?.replace(
    /[Ａ-Ｚａ-ｚ０-９　]/g,
    (s) => s === "　" ? " " : String.fromCharCode(s.charCodeAt(0) - 65248),
  ) || "";
}
