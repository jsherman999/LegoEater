import type { Command } from "commander";
import { apiRequest } from "../lib/api";
import { printJson } from "../lib/output";

export function registerInfoCommand(program: Command) {
  program
    .command("info")
    .description("Look up a set by number")
    .argument("<set-number>")
    .action(async (setNumber) => {
      const result = await apiRequest(`/lookup/set/${encodeURIComponent(String(setNumber))}`);
      printJson(result);
    });
}
