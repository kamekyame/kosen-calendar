import { getDOM } from "../dom.ts";
import { VCalendar, VEvent } from "../calendar.ts";
import { compEvents, createKosenCalendar, resolver } from "../util.ts";
const resolve = resolver(import.meta);

async function getScrapeEvents() {
  const events: VEvent[] = [];

  const dom = await getDOM("https://www.nagaoka-ct.ac.jp/zaikousei/calendar/");
  if (!dom) throw Error("Can not get dom");
  const body = dom.body;
  //console.log(body.innerHTML);

  const section = body.querySelector("#page");
  //console.log(section?.innerHTML);

  const yearText = section?.querySelectorAll("h3")[0]?.textContent
    .replace(
      /[０-９]/g,
      (s) => String.fromCharCode(s.charCodeAt(0) - 65248),
    ).match(/\d+/);
  if (!yearText) throw Error("Can not get year");
  const year = parseInt(yearText[0]) + 2018;
  console.log(yearText, year);

  let month = 4;
  const start = new Date(0);
  const end = new Date(0);
  section?.querySelector("table tbody")?.getElementsByTagName("tr").forEach(
    (dayTr) => {
      const dayTh = dayTr.getElementsByTagName("th");
      if (dayTh.length > 0) {
        const monthText = dayTh.reverse()[0].textContent.replace(
          /[０-９]/g,
          (s) => String.fromCharCode(s.charCodeAt(0) - 65248),
        ).match(/\d+/);
        if (!monthText) return;
        month = parseInt(monthText[0]);
        console.log(month + "月");
      }
      const [summaryTd, dayTd] = dayTr.getElementsByTagName("td").reverse();
      if (dayTd) {
        const dayText = dayTd?.textContent.replace(
          /[０-９]/g,
          (s) => String.fromCharCode(s.charCodeAt(0) - 65248),
        );
        const dayMatch = dayText.match(/(\d+)(?:.*～(?:(\d+)月)?(\d+)日)?/)
          ?.splice(1).map((e) => parseInt(e));
        if (!dayMatch) return;
        console.log("\t" + dayText, dayMatch);
        const day = dayMatch[0];
        const endMonth = dayMatch[1] || month;
        const endDay = (dayMatch[2] || day) + 1;
        start.setFullYear(month <= 3 ? year + 1 : year, month - 1, day);
        end.setFullYear(month <= 3 ? year + 1 : year, endMonth - 1, endDay);
      }

      const dtStart = new Date(start.getTime());
      const dtEnd = new Date(end.getTime());
      const summaries = summaryTd.textContent.split(/\n|\n|\r/);

      summaries.forEach((summary) => {
        const event = new VEvent({ dtStart, dtEnd, summary, allDay: true });
        events.push(event);
      });

      /*const event = new VEvent({
        start: new Date(start.getTime()),
        end: new Date(end.getTime()),
        summary: summaryTd.textContent,
      });*/
      //calendar.addEvent(event);
      console.log("\t\t" + summaryTd.textContent);
    },
  );

  return { events, year };
}

async function scraping(oldCalendar?: VCalendar) {
  const calendar = oldCalendar ||
    createKosenCalendar("長岡高専", "長岡工業高等専門学校");

  const oldEvents = calendar.getEvents();
  const { events: newEvents, year } = await getScrapeEvents();

  const allEvents = compEvents(oldEvents, newEvents, year);

  calendar.setEvents(allEvents);

  return calendar;
}

const fileName = resolve(`nagaoka.ics`);
console.log(fileName);

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
//console.log(calendar);
const icsText = calendar.toICSString();
//console.log(icsText);

Deno.writeTextFileSync(fileName, icsText);
console.log(`${fileName}に出力しました。`);
