import { processCoverageStatus } from "../lib/coverage-engine.js";

async function main() {
  console.log(`[${new Date().toISOString()}] Processing coverage status...`);

  const result = await processCoverageStatus();

  console.log(
    `[${new Date().toISOString()}] Done. Moved to grace: ${result.movedToGrace}, moved to lapsed: ${result.movedToLapsed}`,
  );

  process.exit(0);
}

main().catch((err) => {
  console.error("Coverage processing failed:", err);
  process.exit(1);
});
