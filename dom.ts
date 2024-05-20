import { DOMParser } from "deno_dom";
export * from "deno_dom";

const noCache = Deno.args.includes("--no-cache") ?? false;
const tempDir = new URL("./.html-cache/", import.meta.url);
await Deno.mkdir(tempDir, { recursive: true });

async function getHTML(url: string) {
  const cacheFile = new URL(btoa(encodeURIComponent(url)), tempDir);
  if (noCache === false) {
    try {
      const text = await Deno.readTextFile(cacheFile);
      console.log("Cached " + url);
      return text;
    } catch {
      console.log("No Cache! " + url);
    }
  }
  const res = await fetch(url);
  if (res.status !== 200) throw Error("HTTP Response status is not 200");
  if (res.headers.get("content-type")?.indexOf("text/html") === -1) {
    throw Error(`${url} is not html`);
  }
  const html = await res.text();
  Deno.writeTextFile(cacheFile, html);
  return html;
}

export async function getDOM(url: string) {
  const html = await getHTML(url);
  //const filtHtml = html.replace(/<img.*?>/g, "");

  //const dom = new JSDOM(filtHtml);
  const dom = new DOMParser().parseFromString(html, "text/html");
  return dom;
}
