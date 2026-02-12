import { runPriceUpdate } from "../packages/api/src/services/price-updater";

async function main() {
  const startedAt = new Date();
  console.log(`[${startedAt.toISOString()}] Starting nightly price update`);

  const summary = await runPriceUpdate({ delayMs: 200 });

  for (const failure of summary.failures) {
    console.error(`Failed ${failure.setNum}: ${failure.error}`);
  }

  console.log(`Updated ${summary.updated} sets. ${summary.failed} failures.`);
  console.log(`[${new Date().toISOString()}] Nightly price update complete`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(message);
  process.exit(1);
});
