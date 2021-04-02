import { getDOM } from "../dom.ts";
import { VCalendar, VEvent } from "../calendar.ts";
import { createKosenCalendar } from "../util.ts";

async function scraping(oldCalendar?: VCalendar) {
  const calendar = oldCalendar || createKosenCalendar("津山高専", "津山工業高等専門学校");

  const dom = await getDOM(
    "https://www.tsuyama-ct.ac.jp/gyoujiVer4/gyouji.html",
  );
  if (!dom) return;
  const body = dom.body;

  const contents = body.querySelector("#contents");
  if (!contents) return;
  // 令和○年度を西暦に変換
  const title = contents.querySelector("h3");
  const yearText = title?.textContent.replace(
    /[０-９]/g,
    (s) => String.fromCharCode(s.charCodeAt(0) - 65248),
  ).match(/\d+/);
  if (!yearText) return;
  const year = parseInt(yearText[0]) + 2019;
  console.log(year + "年度");

  const monthUls = contents.getElementsByTagName("ul");
  monthUls.forEach((monthUl, i) => {
    const month = (i + 4) % 12;
    console.log(month + "月");
    const dayLi = monthUl.getElementsByTagName("li");
    dayLi.forEach((day) => {
      const text = day.innerHTML;
      text.match("");
      console.log(day.innerHTML);

      // ここまで作ったけど2021年度のがないことに気づいたので後回しにします。
    });
  });

  return calendar;
}

const fileName = `tsuyama.ics`;

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

//Deno.writeTextFileSync(fileName, icsText);
//console.log(`${fileName}に出力しました。`);
