import type { Command } from "commander";
import { apiRequest } from "../lib/api";
import { printTable } from "../lib/output";

export function registerSearchCommand(program: Command) {
  program
    .command("search")
    .description("Search Rebrickable for sets")
    .argument("<query>")
    .action(async (query) => {
      const response = await apiRequest<{
        items: Array<{ setNum: string; name: string; year: number | null }>;
      }>(`/lookup/search?q=${encodeURIComponent(String(query))}`);

      printTable(
        response.items.map((item) => ({
          setNum: item.setNum,
          name: item.name,
          year: item.year ?? "Unknown"
        }))
      );
    });
}
