import {
  DOMParser,
  Element,
} from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

//import jsdom from "https://dev.jspm.io/jsdom";
//const { JSDOM } = jsdom;

async function getHTML(url: string) {
  const res = await fetch(url);
  if (res.status !== 200) console.error("HTTP Response status is not 200");
  if (res.headers.get("content-type")?.indexOf("text/html") === -1) {
    console.error(`${url} is not html`);
  }
  const html = await res.text();
  return html;
}

export async function getDOM(url: string) {
  const html = await getHTML(url);
  //const filtHtml = html.replace(/<img.*?>/g, "");

  //const dom = new JSDOM(filtHtml);
  const dom = new DOMParser().parseFromString(html, "text/html");
  return dom;
}
