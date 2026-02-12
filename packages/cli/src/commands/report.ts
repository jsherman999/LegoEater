import type { Command } from "commander";
import { apiRequest } from "../lib/api";
import { printJson, printTable } from "../lib/output";

function endpointForType(type: string, options: { limit?: string; days?: string }): string {
  switch (type) {
    case "summary":
      return "/reports/summary";
    case "by-member":
      return "/reports/by-member";
    case "by-theme":
      return "/reports/by-theme";
    case "top-sets": {
      const limit = options.limit ?? "10";
      return `/reports/top-sets?limit=${encodeURIComponent(limit)}`;
    }
    case "movers": {
      const limit = options.limit ?? "10";
      const days = options.days ?? "30";
      return `/reports/movers?days=${encodeURIComponent(days)}&limit=${encodeURIComponent(limit)}`;
    }
    default:
      throw new Error(`Unsupported report type: ${type}`);
  }
}

export function registerReportCommand(program: Command) {
  program
    .command("report")
    .description("Show report data")
    .argument("<type>")
    .option("--limit <n>", "10")
    .option("--days <n>", "30")
    .option("--json")
    .action(async (type, options) => {
      const endpoint = endpointForType(String(type), {
        limit: options.limit,
        days: options.days
      });

      const result = await apiRequest<Record<string, unknown>>(endpoint);
      if (options.json || !Object.prototype.hasOwnProperty.call(result, "items")) {
        printJson(result);
        return;
      }

      const items = result.items;
      if (!Array.isArray(items)) {
        printJson(result);
        return;
      }

      printTable(items as Array<Record<string, unknown>>);
    });
}
