import { getDOM } from "../dom.ts";
import { VCalendar, VEvent } from "../calendar.ts";
import { compEvents, createKosenCalendar, pathResolver } from "../util.ts";
const resolver = pathResolver(import.meta);

async function getScrapeEvents() {
  const events: VEvent[] = [];

  const dom = await getDOM("https://www.kct.ac.jp/katudou/gyouji.html");
  if (!dom) throw Error("Can not get dom");
  const body = dom.body;
  //console.log(body.innerHTML);

  const main = body.querySelector("#main");
  const yearText = main?.querySelector("h3")?.innerHTML.match(/\d+/);
  if (!yearText) throw Error("Can not get year");
  const year = parseInt(yearText[0]) + 2018;
  console.log(year + "年度");

  let month = 4;
  main?.querySelector("table tbody")?.getElementsByTagName("tr").forEach(
    (dayTr) => {
      let dayTds = dayTr.getElementsByTagName("td");
      if (dayTds.length === 3) {
        const monthText = dayTds[0].textContent.match(/\d+/);
        if (!monthText) return;
        month = parseInt(monthText[0]);
        console.log(month + "月");
        dayTds = dayTds.slice(1);
      }
      const dayText = dayTds[0].textContent.match(/\d+/);
      if (!dayText) return;
      const day = parseInt(dayText[0]);
      const summaries = dayTds[1].innerHTML.replaceAll("\n", "").split("<br>");
      console.log("\t" + day + "日", summaries);

      const dtStart = new Date(0);
      dtStart.setFullYear(month <= 3 ? year + 1 : year, month - 1, day);
      const dtEnd = new Date(0);
      dtEnd.setFullYear(month <= 3 ? year + 1 : year, month - 1, day + 1);

      summaries.forEach((summary) => {
        const event = new VEvent({
          dtStart,
          dtEnd,
          summary: summary.trim(),
          allDay: true,
        });
        events.push(event);
      });
    },
  );

  return { events, year };
}

async function scraping(oldCalendar?: VCalendar) {
  const calendar = oldCalendar ||
    createKosenCalendar("北九州高専", "北九州高等専門学校");

  const oldEvents = calendar.getEvents();
  const { events: newEvents, year } = await getScrapeEvents();

  const allEvents = compEvents(oldEvents, newEvents, year);

  calendar.setEvents(allEvents);

  return calendar;
}

const fileName = resolver(`kitakyusyu.ics`);

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
