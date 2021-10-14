import { v4 } from "https://deno.land/std@0.91.0/uuid/mod.ts";

function toISOString(date: Date, allDay = false) {
  function pad(number: number) {
    if (number < 10) {
      return "0" + number;
    }
    return number.toString();
  }

  //console.log(date);

  let str = date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate());
  if (!allDay) {
    str += "T" + pad(date.getUTCHours()) +
      pad(date.getUTCMinutes()) +
      pad(date.getUTCSeconds()) + "Z";
  }

  //console.log(str);

  return str;
}

function BetweenBeginEnd(list: string[][], s: number, e: number) {
  let value = "";
  let begin = s;
  for (; begin < e; begin++) {
    if (list[begin][0] === "BEGIN") {
      value = list[begin][1];
      break;
    }
  }
  let end = begin;
  for (; end < e; end++) {
    if (list[end][0] === "END" && list[end][1] === value) break;
  }
  return { begin, end, value };
}

function dateParse(text: string) {
  const year = parseInt(text.slice(0, 4));
  const month = parseInt(text.slice(4, 6)) - 1;
  const day = parseInt(text.slice(6, 8));
  const hour = parseInt(text.slice(9, 11) || "0");
  const minite = parseInt(text.slice(11, 13) || "0");
  const second = parseInt(text.slice(13, 15) || "0");
  const date = new Date(0);
  date.setUTCFullYear(year, month, day);
  date.setUTCHours(hour, minite, second);
  return date;
}

export class VCalendar {
  private version = "2.0";
  private prodId: string;
  private timezone?: VTimezone;
  private events: VEvent[];
  public xWrCalName: string;
  public xWrCalDesc: string;
  public xWrTimezone: string;
  public readonly xWrRelcalId: string;

  constructor(
    {
      prodId,
      timezone,
      events,
      xWrCalName,
      xWrCalDesc,
      xWrTimezone,
      xWrRelcalId,
    }: {
      prodId: string;
      timezone?: VTimezone;
      events?: VEvent[];
      xWrCalName?: string;
      xWrCalDesc?: string;
      xWrTimezone?: string;
      xWrRelcalId?: string;
    },
  ) {
    this.prodId = prodId;
    this.timezone = timezone;
    this.events = events || [];
    this.xWrCalName = xWrCalName || "";
    this.xWrCalDesc = xWrCalDesc || "";
    this.xWrTimezone = xWrTimezone || "";
    this.xWrRelcalId = xWrRelcalId || v4.generate();
  }

  addEvent(...event: VEvent[]) {
    this.events.push(...event);
  }

  getEvents = () => this.events;
  setEvents = (events: VEvent[]) => this.events = events;

  sortingEvents = () => {
    this.events.sort((a, b) => {
      if (a.dtStart.getTime() < b.dtStart.getTime()) return -1;
      if (a.dtStart.getTime() > b.dtStart.getTime()) return 1;
      return 0;
    });
  };

  toICSString() {
    this.sortingEvents();
    let str = "BEGIN:VCALENDAR\n";
    str += "VERSION:" + this.version + "\n";
    str += "PRODID:" + this.prodId + "\n";
    if (this.xWrCalName) str += "X-WR-CALNAME:" + this.xWrCalName + "\n";
    if (this.xWrCalDesc) str += "X-WR-CALDESC:" + this.xWrCalDesc + "\n";
    if (this.xWrTimezone) str += "X-WR-TIMEZONE:" + this.xWrTimezone + "\n";
    str += "X-WR-RELCALID:" + this.xWrRelcalId + "\n";
    if (this.timezone) str += this.timezone.toICSString();
    this.events.forEach((e) => {
      str += e.toICSString();
    });
    str += "END:VCALENDAR\n";
    return str;
  }

  static convertICS(text: string) {
    const lines = text.split(/\n|\n|\r/).map((e) => e.split(":"));
    //console.log(lines);

    // VCALENCARのBEGINとENDを取る
    let { begin: b, end: e, value: v } = BetweenBeginEnd(
      lines,
      0,
      lines.length,
    );
    if (v !== "VCALENDAR") return;
    //console.log(b, e);

    let prodId: string | undefined;
    let timezone: VTimezone | undefined = undefined;
    const events: VEvent[] = [];
    let xWrCalName: string | undefined;
    let xWrCalDesc: string | undefined;
    let xWrTimezone: string | undefined;
    let xWrRelcalId: string | undefined;

    while (true) {
      const { begin: b1, end: e1, value: v1 } = BetweenBeginEnd(
        lines,
        b + 1,
        e - 1,
      );
      //console.log(b1, e1, v1);
      if (b1 === e1) break;
      for (let i = b + 1; i < b1; i++) {
        const [k, v] = lines[i];
        if (k === "PRODID") prodId = v;
        else if (k === "X-WR-CALNAME") xWrCalName = v;
        else if (k === "X-WR-CALDESC") xWrCalDesc = v;
        else if (k === "X-WR-TIMEZONE") xWrTimezone = v;
        else if (k === "X-WR-RELCALID") xWrRelcalId = v;
      }
      if (v1 === "VTIMEZONE") {
        timezone = VTimezone.convertICS(lines.slice(b1, e1 + 1));
      } else if (v1 === "VEVENT") {
        const event = VEvent.convertICS(lines.slice(b1, e1 + 1));
        if (event) events.push(event);
      }
      b = e1;
    }
    if (!prodId || !xWrRelcalId) return;
    const calendar = new VCalendar({
      prodId,
      timezone,
      events,
      xWrCalName,
      xWrCalDesc,
      xWrTimezone,
      xWrRelcalId,
    });
    return calendar;
  }
}

export class VTimezone {
  private tzId: string;
  private standard: Standard;

  constructor({ tzId, standard }: { tzId: string; standard: Standard }) {
    this.tzId = tzId;
    this.standard = standard;
  }

  toICSString() {
    let str = "BEGIN:VTIMEZONE\n";
    str += "TZID:" + this.tzId + "\n";
    str += this.standard.toICSString();
    str += "END:VTIMEZONE\n";
    return str;
  }

  static convertICS(list: string[][]) {
    let tzId: string | undefined;
    let standard: Standard | undefined = undefined;

    let b = 0;
    const e = list.length;
    while (true) {
      const { begin: b1, end: e1, value: v1 } = BetweenBeginEnd(
        list,
        b + 1,
        e - 1,
      );
      console.log(b1, e1, v1);
      if (b1 === e1) break;
      for (let i = b + 1; i < b1; i++) {
        if (list[i][0] === "TZID") tzId = list[i][1];
      }
      if (v1 === "STANDARD") {
        standard = Standard.convertICS(list.slice(b1, e1 + 1)); // console.log("STANDARD");
      }
      b = e1;
    }
    if (!tzId || !standard) return;
    const timezone = new VTimezone({ tzId, standard });
    return timezone;
  }
}

export class Standard {
  private dtStart: Date;
  private tzOffsetFrom: string;
  private tzOffsetTo: string;

  constructor(
    { dtStart, tzOffsetFrom, tzOffsetTo }: {
      dtStart?: Date;
      tzOffsetFrom?: string;
      tzOffsetTo?: string;
    },
  ) {
    this.dtStart = dtStart || new Date(0);
    this.tzOffsetFrom = tzOffsetFrom || "+0000";
    this.tzOffsetTo = tzOffsetTo || "+0000";
  }

  toICSString() {
    let str = "BEGIN:STANDARD\n";
    str += "DTSTART:" + toISOString(this.dtStart) + "\n";
    str += "TZOFFSETFROM:" + this.tzOffsetFrom + "\n";
    str += "TZOFFSETTO:" + this.tzOffsetTo + "\n";
    str += "END:STANDARD\n";
    return str;
  }

  static convertICS(list: string[][]) {
    let dtStart = new Date(0);
    let tzOffsetFrom = "+0000";
    let tzOffsetTo = "+0000";

    for (let i = 0; i < list.length; i++) {
      switch (list[i][0]) {
        case "DTSTART":
          console.log(dateParse(list[i][1]));
          dtStart = dateParse(list[i][1]);
          break;
        case "TZOFFSETFROM":
          tzOffsetFrom = list[i][1];
          break;
        case "TZOFFSETTO":
          tzOffsetTo = list[i][1];
          break;
      }
    }
    const standard = new Standard({ dtStart, tzOffsetFrom, tzOffsetTo });
    return standard;
  }
}

export class VEvent {
  public dtStart: Date;
  public dtEnd: Date;
  public summary: string;
  private dtStamp: Date;
  private allDay: boolean;
  public readonly uId: string;

  constructor(
    { dtStart, dtEnd, summary, allDay, dtStamp, uId }: {
      dtStart: Date;
      dtEnd: Date;
      summary: string;
      allDay?: boolean;
      dtStamp?: Date;
      uId?: string;
    },
  ) {
    this.dtStart = dtStart;
    this.dtEnd = dtEnd;
    this.summary = summary;
    this.dtStamp = dtStamp || new Date();
    this.allDay = allDay || false;
    this.uId = uId || v4.generate();
  }

  toICSString() {
    let str = "BEGIN:VEVENT\n";
    str += "DTSTART" + (this.allDay ? ";VALUE=DATE:" : ":") +
      toISOString(this.dtStart, this.allDay) + "\n";
    str += "DTEND" + (this.allDay ? ";VALUE=DATE:" : ":") +
      toISOString(this.dtEnd, this.allDay) + "\n";
    str += "SUMMARY:" + this.summary + "\n";
    str += "DTSTAMP:" + toISOString(this.dtStamp) + "\n";
    str += "UID:" + this.uId + "\n";
    str += "END:VEVENT" + "\n";
    return str;
  }

  static convertICS(list: string[][]) {
    let dtStart: Date | undefined = undefined;
    let dtEnd: Date | undefined = undefined;
    let summary: string | undefined = undefined;
    let dtStamp: Date | undefined = undefined;
    let allDay = false;
    let uId: string | undefined = undefined;

    for (let i = 0; i < list.length; i++) {
      const [k, v] = list[i];
      if (k.startsWith("DTSTART")) {
        dtStart = dateParse(v);
        if (k.includes("VALUE=DATE")) allDay = true;
      } else if (k.startsWith("DTEND")) {
        dtEnd = dateParse(v);
        if (k.includes("VALUE=DATE")) allDay = true;
      } else if (k === "SUMMARY") summary = v;
      else if (k === "DTSTAMP") dtStamp = dateParse(v);
      else if (k === "UID") uId = v;
    }
    if (!dtStart || !dtEnd || !summary || !dtStamp || !uId) return;
    const event = new VEvent({ dtStart, dtEnd, summary, dtStamp, uId, allDay });
    return event;
  }
}
