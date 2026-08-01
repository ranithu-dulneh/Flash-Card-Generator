const { execSync } = require("child_process");

console.log("[prisma-setup] Starting multi-schema database generation...");

try {
  console.log("[prisma-setup] Generating SQLite client...");
  execSync("npx prisma generate --schema=prisma/schema.prisma", { stdio: "inherit" });

  console.log("[prisma-setup] Generating PostgreSQL client...");
  execSync("npx prisma generate --schema=prisma/schema-pg.prisma", { stdio: "inherit" });

  console.log("[prisma-setup] Both clients generated successfully.");
} catch (error) {
  console.error("[prisma-setup] Error during database generation:", error);
  process.exit(1);
}
