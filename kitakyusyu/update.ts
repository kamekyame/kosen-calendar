import { getDOM } from "../dom.ts";
import { VCalendar, VEvent } from "../calendar.ts";
import { createKosenCalendar } from "../util.ts";

async function scraping(oldCalendar?: VCalendar) {
  const calendar = oldCalendar ||
    createKosenCalendar("北九州高専", "北九州高等専門学校");

  const dom = await getDOM("https://www.kct.ac.jp/katudou/gyouji.html");
  if (!dom) return;
  const body = dom.body;
  //console.log(body.innerHTML);

  const main = body.querySelector("#main");
  const yearText = main?.querySelector("h3")?.innerHTML.match(/\d+/);
  if (!yearText) return;
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

      const events = calendar.getEvents();
      summaries.forEach((summary) => {
        let event = events.find((e) =>
          e.dtStart.getTime() == dtStart.getTime() &&
          e.dtEnd.getTime() == dtEnd.getTime() && e.summary === summary
        );
        if (event) {
          event.summary = summary;
        } else {
          event = new VEvent({ dtStart, dtEnd, summary, allDay: true });
          calendar.addEvent(event);
        }
      });
    },
  );

  return calendar;
}

const fileName = `kitakyusyu.ics`;

let text = "";
try {
  text = Deno.readTextFileSync(fileName);
} catch (e) {
  console.log(e);
}
const c = VCalendar.convertICS(text);

const calendar = await scraping();
if (!calendar) {
  console.error("スクレイピング失敗");
  Deno.exit();
}
//console.log(calendar);
const icsText = calendar.toICSString();
//console.log(icsText);

Deno.writeTextFileSync(fileName, icsText);
console.log(`${fileName}に出力しました。`);
