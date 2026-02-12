import type { Command } from "commander";
import { apiRequest, jsonBody } from "../lib/api";
import { printJson } from "../lib/output";

export function registerUpdatePricesCommand(program: Command) {
  program
    .command("update-prices")
    .description("Update prices for one set or all sets")
    .argument("[set-number]")
    .action(async (setNumber) => {
      const result = await apiRequest<{ updated: number; failed: number; failures: Array<{ setNum: string; error: string }> }>(
        "/prices/update",
        {
          method: "POST",
          ...jsonBody(setNumber ? { setNum: String(setNumber) } : {})
        }
      );
      printJson(result);
    });
}
