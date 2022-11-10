import { getDOM } from "../dom.ts";
import { VCalendar, VEvent } from "../calendar.ts";
import { createKosenCalendar, resolver } from "../util.ts";
const resolve = resolver(import.meta);

const type = ["共通", "寮", "本科", "専攻科"];
const year = parseInt(Deno.args[0]);

async function scraping(oldCalendar?: VCalendar) {
  const calendar = oldCalendar ||
    createKosenCalendar("熊本高専(八代)", "熊本高等専門学校 八代キャンパス");

  const dom = await getDOM(
    `https://kumamoto-nct.ac.jp/shien/schedule/y-${year}.html`,
  );
  if (!dom) return;
  const body = dom.body; //dom.window.document.body;
  //console.log(body.innerHTML);

  for (let i = 1; i <= 12; i++) {
    console.log(i + "月");
    const monthTbody = body.querySelector(`#mon${i}`);
    monthTbody?.getElementsByTagName("tr").forEach((dayTr) => {
      const c = dayTr.getElementsByTagName("td");
      const date = c[0].textContent.match(/(\d+)\/(\d+)/)?.slice(1).map(
        (e) => parseInt(e),
      );
      const summaries = c.slice(1).map((e) => {
        if (e.textContent === "\u00A0") return ""; // 空白セル(&nbsp;)の除外
        else return e.textContent;
      });
      //console.log(date, summaries);

      if (!date || date.length < 2) return;
      const dtStart = new Date(
        date[0] <= 3 ? year + 1 : year,
        date[0] - 1,
        date[1],
      );
      const dtEnd = new Date(
        date[0] <= 3 ? year + 1 : year,
        date[0] - 1,
        date[1] + 1,
      );

      console.log(date[1] + "日");
      summaries.forEach((s, i) => {
        if (!s) return;
        const summary = `【${type[i]}】${s}`;
        console.log("\t" + summary);

        const event = new VEvent({ dtStart, dtEnd, summary });
        calendar.addEvent(event);
      });
    });
  }
  return calendar;
}

const fileName = resolve(`yatsushiro.ics`);

let text = "";
try {
  text = Deno.readTextFileSync(fileName);
} catch (e) {
  console.log(e);
}
const _c = VCalendar.convertICS(text);

const calendar = await scraping();
if (!calendar) {
  console.error("スクレイピング失敗");
  Deno.exit();
}

const icsText = calendar.toICSString();
//console.log(icsText);

Deno.writeTextFileSync(fileName, icsText);
console.log(`${fileName}に出力しました。`);
