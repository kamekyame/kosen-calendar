function toISOString(date: Date, allDay = false) {
  function pad(number: number) {
    if (number < 10) {
      return "0" + number;
    }
    return number.toString();
  }

  console.log(date);

  let str = date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate());
  if (!allDay) {
    str += "T" + pad(date.getHours()) +
      pad(date.getMinutes()) +
      pad(date.getSeconds());
  }

  console.log(str);

  return str;
}

export class VCalendar {
  private version = "2.0";
  private prodId: string;
  private timezone?: VTimezone;
  private events: VEvent[] = [];

  constructor({ prodId, timezone }: { prodId: string; timezone?: VTimezone }) {
    this.prodId = prodId;
    this.timezone = timezone;
  }

  addEvent(event: VEvent) {
    this.events.push(event);
  }

  toICSString() {
    let str = "BEGIN:VCALENDAR\r\n";
    str += "VERSION:" + this.version + "\r\n";
    str += "PRODID:" + this.prodId + "\r\n";
    if (this.timezone) str += this.timezone.toICSString();
    this.events.forEach((e) => {
      str += e.toICSString();
    });
    str += "END:VCALENDAR\r\n";
    return str;
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
    let str = "BEGIN:VTIMEZONE\r\n";
    str += "TZID:" + this.tzId + "\r\n";
    str += this.standard.toICSString();
    str += "END:VTIMEZONE\r\n";
    return str;
  }
}

export class Standard {
  private dtStart: Date = new Date(0);
  private tzOffsetFrom: string;
  private tzOffsetTo: string;

  constructor(
    { tzOffsetFrom, tzOffsetTo }: {
      tzOffsetFrom?: string;
      tzOffsetTo?: string;
    },
  ) {
    this.tzOffsetFrom = tzOffsetFrom || "+0000";
    this.tzOffsetTo = tzOffsetTo || "+0000";
  }

  toICSString() {
    let str = "BEGIN:STANDARD\r\n";
    str += "DTSTART:" + toISOString(this.dtStart) + "\r\n";
    str += "TZOFFSETFROM:" + this.tzOffsetFrom + "\r\n";
    str += "TZOFFSETTO:" + this.tzOffsetTo + "\r\n";
    str += "END:STANDARD\r\n";
    return str;
  }
}

export class VEvent {
  private dtStart: Date;
  private dtEnd: Date;
  private summary: string;
  private dtStamp: Date;
  private allDay: boolean;

  constructor(
    { dtStart, dtEnd, summary, allDay }: {
      dtStart: Date;
      dtEnd: Date;
      summary: string;
      allDay?: boolean;
    },
  ) {
    this.dtStart = dtStart;
    this.dtEnd = dtEnd;
    this.summary = summary;
    this.dtStamp = new Date();
    this.allDay = allDay || false;
  }

  toICSString() {
    let str = "BEGIN:VEVENT\r\n";
    str += "DTSTART" + (this.allDay ? ";VALUE=DATE:" : ":") +
      toISOString(this.dtStart, this.allDay) + "\r\n";
    str += "DTEND" + (this.allDay ? ";VALUE=DATE:" : ":") +
      toISOString(this.dtEnd, this.allDay) + "\r\n";
    str += "SUMMARY:" + this.summary + "\r\n";
    str += "DTSTAMP:" + toISOString(this.dtStamp) + "\r\n";
    str += "END:VEVENT" + "\r\n";
    return str;
  }
}
