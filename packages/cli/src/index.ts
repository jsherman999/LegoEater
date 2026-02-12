#!/usr/bin/env bun
import { Command } from "commander";
import { registerAddCommand } from "./commands/add";
import { registerListCommand } from "./commands/list";
import { registerSearchCommand } from "./commands/search";
import { registerUpdatePricesCommand } from "./commands/update-prices";
import { registerReportCommand } from "./commands/report";
import { registerInfoCommand } from "./commands/info";

const program = new Command();
program.name("lego").description("LegoEater CLI").version("0.1.0");

registerAddCommand(program);
registerListCommand(program);
registerSearchCommand(program);
registerInfoCommand(program);
registerUpdatePricesCommand(program);
registerReportCommand(program);

program.parseAsync(process.argv).catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
