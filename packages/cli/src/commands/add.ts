import type { Command } from "commander";
import { apiRequest, jsonBody } from "../lib/api";

async function resolveMemberId(name?: string): Promise<number | null> {
  if (!name) {
    return null;
  }
  const result = await apiRequest<{ items: Array<{ id: number; name: string }> }>("/members");
  const member = result.items.find((entry) => entry.name.toLowerCase() === name.toLowerCase());
  return member?.id ?? null;
}

async function resolveLocationId(name?: string): Promise<number | null> {
  if (!name) {
    return null;
  }
  const result = await apiRequest<{ items: Array<{ id: number; name: string }> }>("/locations");
  const location = result.items.find((entry) => entry.name.toLowerCase() === name.toLowerCase());
  return location?.id ?? null;
}

export function registerAddCommand(program: Command) {
  program
    .command("add")
    .description("Add a LEGO set to inventory")
    .argument("<set-number>")
    .option("--owner <name>")
    .option("--location <name>")
    .option("--condition <type>", "new_sealed")
    .option("--quantity <n>", "1")
    .option("--price <amount>")
    .option("--date <yyyy-mm-dd>")
    .option("--notes <text>")
    .action(async (setNumber, options) => {
      const ownerId = await resolveMemberId(options.owner);
      const locationId = await resolveLocationId(options.location);

      if (options.owner && ownerId === null) {
        throw new Error(`Unknown owner: ${options.owner}`);
      }
      if (options.location && locationId === null) {
        throw new Error(`Unknown location: ${options.location}`);
      }

      const payload = {
        setNum: String(setNumber),
        ownerId,
        locationId,
        condition: String(options.condition ?? "new_sealed"),
        quantity: Number(options.quantity ?? 1),
        purchasePrice: options.price ? Number(options.price) : null,
        dateAcquired: options.date ?? null,
        notes: options.notes ?? null
      };

      const result = await apiRequest<{ id: number }>("/sets", {
        method: "POST",
        ...jsonBody(payload)
      });

      console.log(`Added set to inventory with id ${result.id}`);
    });
}
