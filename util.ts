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

function getEventEqualKey(e: VEvent) {
  return `${e.dtStart.getTime()}-${e.dtEnd.getTime()}-${e.summary}`;
}

function eventEquals(a: VEvent, b: VEvent) {
  return getEventEqualKey(a) === getEventEqualKey(b);
}

export function compEvents(
  oldEvents: VEvent[],
  newEvents: VEvent[],
  updateYear: number,
) {
  // (更新したい年度中にて)古い方のみ：古い方から削除
  // (更新したい年度中にて)新しい方のみ：なにもしない
  // (更新したい年度中にて)どちらにもある：新しい方から削除
  // 古い方に新しい方をマージ

  oldEvents = oldEvents.filter((o) => {
    if (
      o.dtStart.getTime() < new Date(updateYear, 4 - 1).getTime() ||
      o.dtStart.getTime() >= new Date(updateYear + 1, 4 - 1).getTime()
    ) {
      return true;
    }
    const sameEvent = newEvents.some((n) => eventEquals(n, o));
    if (sameEvent) return true;
    else return false;
  });

  newEvents = newEvents.filter((n) => {
    const sameEvent = oldEvents.some((o) => eventEquals(n, o));
    if (sameEvent) return false;
    else return true;
  });

  const events = [...oldEvents, ...newEvents];

  // eventsの重複を排除
  const eventSet = new Set<string>();
  const uniqueEvents = events.filter((e) => {
    const key = getEventEqualKey(e);
    if (eventSet.has(key)) return false;
    else {
      eventSet.add(key);
      return true;
    }
  });

  return uniqueEvents;
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
