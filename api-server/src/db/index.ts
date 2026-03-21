import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { configDotenv } from "dotenv";
import * as schema from "./schema/index.js";

export * from "./schema/index.js";

const { Pool } = pg;
  
configDotenv();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });


export const categoriesTable = schema?.categoriesTable;
export const transactionsTable = schema?.transactionsTable;
export const receiptsTable = schema?.receiptsTable;
export const conversations = schema?.conversations;
export const messages = schema?.messages;
