import { pgTable, text, serial, timestamp, numeric, date, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { categoriesTable } from "./categories.js";
import { receiptsTable } from "./receipts.js";

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  type: text("type", { enum: ["income", "expense"] }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description").notNull(),
  categoryId: integer("category_id").references(() => categoriesTable.id),
  date: date("date").notNull(),
  receiptId: integer("receipt_id").references(() => receiptsTable.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;
