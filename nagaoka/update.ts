import { getDOM } from "../dom.ts";
import { VCalendar, VEvent } from "../calendar.ts";
import { createKosenCalendar, pathResolver } from "../util.ts";
const resolver = pathResolver(import.meta);

async function scraping(oldCalendar?: VCalendar) {
  const calendar = oldCalendar ||
    createKosenCalendar("長岡高専", "長岡工業高等専門学校");

  const dom = await getDOM("https://www.nagaoka-ct.ac.jp/campus/213.html");
  if (!dom) return;
  const body = dom.body;
  //console.log(body.innerHTML);

  const section = body.querySelector(".tinyMCE");
  //console.log(section?.innerHTML);

  const yearText = section?.querySelector("h3")?.textContent.replace(
    /[０-９]/g,
    (s) => String.fromCharCode(s.charCodeAt(0) - 65248),
  ).match(/\d+/);
  if (!yearText) return;
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
      const summary = summaryTd.textContent;

      const events = calendar.getEvents();
      let event = events.find((e) =>
        e.dtStart.getTime() == start.getTime() &&
        e.dtEnd.getTime() == end.getTime() && e.summary === summary
      );
      if (event) {
        event.summary = summary;
      } else {
        event = new VEvent({ dtStart, dtEnd, summary, allDay: true });
        calendar.addEvent(event);
      }
      /*const event = new VEvent({
        start: new Date(start.getTime()),
        end: new Date(end.getTime()),
        summary: summaryTd.textContent,
      });*/
      //calendar.addEvent(event);
      console.log("\t\t" + summaryTd.textContent);
    },
  );

  /*const main = body.querySelector("#main");
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

      const start = new Date(0);
      start.setFullYear(month <= 3 ? year + 1 : year, month - 1, day);
      const end = new Date(0);
      end.setFullYear(month <= 3 ? year + 1 : year, month - 1, day + 1);

      const events = calendar.getEvents();
      summaries.forEach((summary) => {
        let event = events.find((e) =>
          e.start.getTime() == start.getTime() &&
          e.end.getTime() == end.getTime() && e.summary === summary
        );
        if (event) {
          event.summary = summary;
        } else {
          event = new VEvent({ start, end, summary, allDay: true });
          calendar.addEvent(event);
        }
      });
    },
  );*/

  return calendar;
}

const fileName = resolver(`nagaoka.ics`);

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
