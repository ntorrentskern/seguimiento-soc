import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";

export type Database = NeonHttpDatabase<typeof schema>;

let cached: Database | null = null;

export function databaseUrl() {
  return process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? null;
}

export function getDb() {
  const url = databaseUrl();
  if (!url) return null;
  if (!cached) cached = drizzle(neon(url), { schema });
  return cached;
}
