import { getDOM } from "../dom.ts";
import { VCalendar, VEvent } from "../calendar.ts";
import { compEvents, createKosenCalendar, resolver } from "../util.ts";
import { Element } from "https://deno.land/x/deno_dom@v0.1.38/src/dom/element.ts";
const resolve = resolver(import.meta);

async function getScrapeEvents() {
  const events: VEvent[] = [];

  const dom = await getDOM("https://www.kct.ac.jp/campuslife/schedule");
  if (!dom) throw Error("Can not get dom");
  const body = dom.body;

  const main = body.querySelector("#page_wrap");
  const yearText = main?.querySelector("h3")?.innerHTML.match(/\d+/);
  if (!yearText) throw Error("Can not get year");
  const baseYear = parseInt(yearText[0]) + 2018;
  console.log(baseYear + "年度");

  main?.querySelectorAll(".bge-ckeditor").forEach(
    (monthDiv) => {
      if (!(monthDiv instanceof Element)) {
        throw Error("monthDiv is not Element");
      }
      const monthText = monthDiv.querySelector("p")?.innerText;
      const monthMatch = monthText?.match(/(\d+)/);
      if (!monthMatch) throw Error("Can not get month");
      const month = parseInt(monthMatch[1]);

      const year = month >= 4 ? baseYear : baseYear + 1;

      console.log(`${year}年 ${month}月`);

      monthDiv.querySelectorAll(".item-list").forEach((dayDiv) => {
        if (!(dayDiv instanceof Element)) throw Error("dayDiv is not Element");
        const dayText = dayDiv.querySelector(".item-date")?.innerText;
        const dayMatch = dayText?.match(/(\d+)/);
        if (!dayMatch) throw Error("Can not get day");
        const day = parseInt(dayMatch[1]);

        const dtStart = new Date(0);
        dtStart.setFullYear(year, month - 1, day);

        const summariesText = dayDiv.querySelector(".item-event")?.innerText;
        if (!summariesText) throw Error("Can not get summaries");
        const summaries = summariesText.replaceAll("＞\n", "＞ ").split("\n");

        summaries.forEach((summary) => {
          if (!summary) return;
          summary = summary.trim().replaceAll("（", "(").replaceAll("）", ")");
          const m = summary.match(/\(～(?:(\d+)月)?(?:(\d+)日)\)/);
          let toMonth = month;
          let toDay = day;
          if (m) {
            // console.log(m);
            if (m[1]) toMonth = parseInt(m[1]);
            if (m[2]) toDay = parseInt(m[2]);
          }

          const dtEnd = new Date(0);
          dtEnd.setFullYear(
            toMonth <= 3 ? baseYear + 1 : baseYear,
            toMonth - 1,
            toDay + 1,
          );
          console.log(dtStart, dtEnd, summary);

          const event = new VEvent({
            dtStart,
            dtEnd,
            summary,
            allDay: true,
          });
          events.push(event);
        });
      });
    },
  );

  return { events, year: baseYear };
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

const fileName = resolve(`kitakyusyu.ics`);

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
