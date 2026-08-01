import { PrismaClient as SQLitePrismaClient } from "@/generated/sqlite";
import { PrismaClient as PGPrismaClient } from "@/generated/postgres";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Set the web socket constructor for Neon serverless pool in Node.js runtime
neonConfig.webSocketConstructor = ws;

const globalForDB = globalThis as unknown as {
  db: any | undefined;
};

const createDBInstance = () => {
  const dbUrl = process.env.DATABASE_URL || "";
  const isPostgres = dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://");

  if (isPostgres) {
    console.log("[db] Initializing dynamic PostgreSQL client using PrismaNeon adapter...");
    const pool = new Pool({ connectionString: dbUrl });
    const adapter = new PrismaNeon(pool as any);
    return new PGPrismaClient({ adapter });
  } else {
    console.log("[db] Initializing dynamic SQLite client using PrismaBetterSqlite3 adapter...");
    const adapter = new PrismaBetterSqlite3({
      url: "file:./prisma/dev.db",
    });
    return new SQLitePrismaClient({ adapter });
  }
};

export const db = globalForDB.db ?? createDBInstance();

if (process.env.NODE_ENV !== "production") globalForDB.db = db;
