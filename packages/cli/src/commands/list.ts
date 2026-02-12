import type { Command } from "commander";
import { apiRequest } from "../lib/api";
import { printJson, printTable } from "../lib/output";

async function resolveOwnerId(name?: string): Promise<string | undefined> {
  if (!name) {
    return undefined;
  }
  const result = await apiRequest<{ items: Array<{ id: number; name: string }> }>("/members");
  const found = result.items.find((entry) => entry.name.toLowerCase() === name.toLowerCase());
  if (!found) {
    throw new Error(`Unknown owner: ${name}`);
  }
  return String(found.id);
}

export function registerListCommand(program: Command) {
  program
    .command("list")
    .description("List inventory")
    .option("--owner <name>")
    .option("--theme <name>")
    .option("--condition <type>")
    .option("--sort <field>", "date_added")
    .option("--json")
    .action(async (options) => {
      const owner = await resolveOwnerId(options.owner);
      const query = new URLSearchParams();
      if (owner) query.set("owner", owner);
      if (options.theme) query.set("theme", String(options.theme));
      if (options.condition) query.set("condition", String(options.condition));
      if (options.sort) query.set("sort", String(options.sort));
      query.set("pageSize", "200");

      const response = await apiRequest<{
        items: Array<{
          id: number;
          setNum: string;
          setName: string;
          ownerName: string | null;
          condition: string;
          quantity: number;
          marketValue: number | null;
        }>;
      }>(`/sets?${query.toString()}`);

      if (options.json) {
        printJson(response.items);
        return;
      }

      printTable(
        response.items.map((item) => ({
          id: item.id,
          set: `${item.setNum} ${item.setName}`,
          owner: item.ownerName ?? "Unassigned",
          condition: item.condition,
          qty: item.quantity,
          value: item.marketValue === null ? "N/A" : `$${item.marketValue.toFixed(2)}`
        }))
      );
    });
}
