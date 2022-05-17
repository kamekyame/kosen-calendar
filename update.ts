import * as log from "https://deno.land/std@0.139.0/log/mod.ts";
import { expandGlob } from "https://deno.land/std@0.139.0/fs/mod.ts";

for await (const file of expandGlob("*/update*.ts")) {
  log.info(`Updating ${file.path}`);

  try {
    await import("file://" + file.path);
  } catch (e) {
    log.error(e);
  }
}
