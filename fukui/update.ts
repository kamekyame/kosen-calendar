import { getDOM } from "../dom.ts";
import { VCalendar, VEvent } from "../calendar.ts";
import { compEvents, createKosenCalendar, pathResolver } from "../util.ts";
const resolver = pathResolver(import.meta);

async function getScrapeEvents() {
  const events: VEvent[] = [];

  const dom = await getDOM("https://www.fukui-nct.ac.jp/life/event/");
  if (!dom) throw Error("Can not get dom");
  const body = dom.body; //dom.window.document.body;

  const titleH2 = body.querySelector("#entry-content h2");
  if (!titleH2) throw Error("Can not get #entry-content h2");
  const yearMatch = titleH2.textContent.match(/\d+/);
  if (!yearMatch || yearMatch.length < 1) throw Error("Can not get year");
  const year = parseInt(yearMatch[0]);
  console.log(year + "年度");

  body.getElementById("entry-content")
    ?.getElementsByTagName("table").forEach(
      (monthTable, i) => {
        const month = (i + 4) % 12;
        console.log(month + "月");

        monthTable.getElementsByTagName("tr").forEach((dayTr) => {
          const dayTds = dayTr.getElementsByTagName("td");
          if (dayTds.length == 2) {
            const [dayTd, eventTd] = dayTds;
            const dayMatch = dayTd.textContent.match(/\d+/);
            if (!dayMatch || dayMatch.length < 1) return;
            const day = parseInt(dayMatch[0]);
            const summary = eventTd.textContent;
            console.log(day + "日", summary);

            const dtStart = new Date(0);
            dtStart.setFullYear(month <= 3 ? year + 1 : year, month - 1, day);
            const dtEnd = new Date(0);
            dtEnd.setFullYear(month <= 3 ? year + 1 : year, month - 1, day + 1);

            const event = new VEvent({ dtStart, dtEnd, summary, allDay: true });
            events.push(event);
          }
        });
      },
    );
  return { events, year };
}

async function scraping(oldCalendar?: VCalendar) {
  const calendar = oldCalendar || createKosenCalendar("福井高専", "福井工業高等専門学校");

  const { events: newEvents, year } = await getScrapeEvents();
  const oldEvents = calendar.getEvents();

  const allEvents = compEvents(oldEvents, newEvents, year);

  calendar.setEvents(allEvents);

  return { calendar, year };
}

const fileName = resolver(`./fukui.ics`);

let text = "";
try {
  text = Deno.readTextFileSync(fileName);
} catch (e) {
  console.log(e);
}
const c = VCalendar.convertICS(text);

const scrapingData = await scraping(c);
if (!scrapingData) {
  console.error("スクレイピング失敗");
  Deno.exit(1);
}

const icsText = scrapingData.calendar.toICSString();
//console.log(icsText);

Deno.writeTextFileSync(fileName, icsText);
console.log(`${fileName}に出力しました。`);
