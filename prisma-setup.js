const fs = require("fs");
const path = require("path");

const dbUrl = process.env.DATABASE_URL || "file:./prisma/dev.db";
const isPostgres = dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://");

const provider = isPostgres ? "postgresql" : "sqlite";

// 1. Write schema.prisma
const schemaContent = `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "${provider}"
}

model Session {
  id         String      @id @default(uuid())
  slug       String      @unique
  name       String
  createdAt  DateTime    @default(now())
  flashcards Flashcard[]
}

model Flashcard {
  id        String   @id @default(uuid())
  question  String
  answer    String
  order     Int      @default(0)
  sessionId String
  session   Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
}
`;

fs.writeFileSync(path.join(__dirname, "prisma", "schema.prisma"), schemaContent);
console.log(`[prisma-setup] Wrote prisma/schema.prisma with provider = "${provider}"`);

// 2. Write src/lib/db.ts
let dbContent = "";
if (isPostgres) {
  dbContent = `import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool } from "@neondatabase/serverless";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaNeon(pool);
  return new PrismaClient({ adapter });
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
`;
} else {
  dbContent = `import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  const adapter = new PrismaBetterSqlite3({
    url: "file:./prisma/dev.db",
  });
  return new PrismaClient({ adapter });
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
`;
}

fs.writeFileSync(path.join(__dirname, "src", "lib", "db.ts"), dbContent);
console.log(`[prisma-setup] Wrote src/lib/db.ts for ${isPostgres ? "PostgreSQL/Neon" : "SQLite"}`);
exportProjectInfo();

function exportProjectInfo() {
  console.log("[prisma-setup] Configuration completed successfully.");
}
