import { getDOM } from "../dom.ts";
import { VCalendar, VEvent } from "../calendar.ts";
import {
  compEvents,
  createKosenCalendar,
  fullToHalf,
  resolver,
} from "../util.ts";

const resolve = resolver(import.meta);

async function getScrapeEvents() {
  const events: VEvent[] = [];

  const dom = await getDOM(
    "https://www.tsuyama-ct.ac.jp/gyoujiVer4/gyouji.html",
  );
  if (!dom) throw Error("Can not get dom");
  const body = dom.body;

  const contents = body.querySelector("#contents");
  if (!contents) throw Error("Can not get contents");
  // 令和○年度を西暦に変換
  const title = contents.querySelector("h3");
  const yearText = fullToHalf(title?.textContent).match(/\d+/);
  if (!yearText) throw Error("Can not get year");
  const year = parseInt(yearText[0]) + 2018;
  console.log(year + "年度");

  const monthUls = contents.getElementsByTagName("ul");
  monthUls.forEach((monthUl, i) => {
    const month = i + 4;
    console.log(month + "月");

    const dayLi = monthUl.getElementsByTagName("li");
    dayLi.forEach((day) => {
      const rawText = day.textContent;
      const [dayText, summariesText] = fullToHalf(rawText).trim().split(
        " ",
      );

      const daysText = dayText.split("・");
      const summaries = Array.from(
        summariesText.matchAll(/[^、]*（.*）[^、]*|[^、]+/g),
      );

      // console.log(rawText, daysText, summaries /*, match*/);

      daysText.forEach((dayText) => {
        const dayMatch = dayText.match(
          /^(\d+)日（.+?）(?:～(?:(\d+?)月)?(\d+?)日（.+?）)?$/,
        );
        if (!dayMatch) return;
        const [, fromDayText, toMonthText, toDayText] = dayMatch;
        const fromDay = parseInt(fromDayText);
        const toMonth = toMonthText ? parseInt(toMonthText) : month;
        const toDay = toDayText ? parseInt(toDayText) : fromDay;
        // console.log(dayMatch);

        summaries.forEach((summaryMatch) => {
          const summary = summaryMatch[0];
          const dtStart = new Date(0);
          dtStart.setFullYear(year, month - 1, fromDay);
          const dtEnd = new Date(0);
          dtEnd.setFullYear(
            toMonth <= 3 ? year + 1 : year,
            toMonth - 1,
            toDay + 1,
          );
          console.log(rawText, [dayText, summary]);

          const event = new VEvent({ dtStart, dtEnd, summary, allDay: true });
          events.push(event);
        });
      });
    });
  });
  return { events, year };
}

async function scraping(oldCalendar?: VCalendar) {
  const calendar = oldCalendar || createKosenCalendar("津山高専", "津山工業高等専門学校");

  const { events: newEvents, year } = await getScrapeEvents();
  const oldEvents = calendar.getEvents();

  const allEvents = compEvents(oldEvents, newEvents, year);

  calendar.setEvents(allEvents);

  return calendar;
}

const fileName = resolve(`./tsuyama.ics`);

let text = "";
try {
  text = Deno.readTextFileSync(fileName);
} catch (e) {
  console.log(e);
}
const c = VCalendar.convertICS(text);

const calendar = await scraping(c);
if (!calendar) {
  console.error("スクレイピング失敗");
  Deno.exit();
}

const icsText = calendar.toICSString();
//console.log(icsText);

Deno.writeTextFileSync(fileName, icsText);
//console.log(`${fileName}に出力しました。`);
