import { getDOM } from "../dom.ts";
import { VCalendar, VEvent } from "../calendar.ts";
import { createKosenCalendar } from "../util.ts";

async function scraping(oldCalendar?: VCalendar) {
  const calendar = oldCalendar || createKosenCalendar();

  const dom = await getDOM("https://www.fukui-nct.ac.jp/life/event/");
  if (!dom) return;
  const body = dom.body; //dom.window.document.body;

  const titleH2 = body.querySelector("#entry-content h2");
  if (!titleH2) return;
  const yearMatch = titleH2.textContent.match(/\d+/);
  if (!yearMatch || yearMatch.length < 1) return;
  const year = parseInt(yearMatch[0]);
  //console.log(year + "年度");

  body.getElementById("entry-content")
    ?.getElementsByTagName("table").forEach(
      (monthTable, i) => {
        const month = (i + 4) % 12;
        //console.log(month + "月");

        monthTable.getElementsByTagName("tr").forEach((dayTr) => {
          const dayTds = dayTr.getElementsByTagName("td");
          if (dayTds.length == 2) {
            const [dayTd, eventTd] = dayTds;
            const dayMatch = dayTd.textContent.match(/\d+/);
            if (!dayMatch || dayMatch.length < 1) return;
            const day = parseInt(dayMatch[0]);
            const summary = eventTd.textContent;
            //console.log(day + "日", summary);

            const dtStart = new Date(0);
            dtStart.setFullYear(month <= 3 ? year + 1 : year, month - 1, day);
            const dtEnd = new Date(0);
            dtEnd.setFullYear(month <= 3 ? year + 1 : year, month - 1, day + 1);

            const events = calendar.getEvents();
            let event = events.find((e) =>
              e.dtStart.getTime() == dtStart.getTime() &&
              e.dtEnd.getTime() == dtEnd.getTime()
            );
            if (event) {
              event.summary = summary;
            } else {
              event = new VEvent({ dtStart, dtEnd, summary, allDay: true });
              calendar.addEvent(event);
            }
          }
        });
      },
    );
  return { calendar, year };
}

const fileName = `fukui.ics`;

const text = Deno.readTextFileSync(fileName);
const c = VCalendar.convertICS(text);

const scrapingData = await scraping(c);
if (!scrapingData) {
  console.error("スクレイピング失敗");
  Deno.exit();
}

const icsText = scrapingData.calendar.toICSString();
//console.log(icsText);

Deno.writeTextFileSync(fileName, icsText);
console.log(`${fileName}に出力しました。`);
