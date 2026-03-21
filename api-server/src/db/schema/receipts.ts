import { pgTable, text, serial, timestamp, numeric, date, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const receiptsTable = pgTable("receipts", {
  id: serial("id").primaryKey(),
  imageUrl: text("image_url"),
  extractedAmount: numeric("extracted_amount", { precision: 12, scale: 2 }),
  extractedDate: date("extracted_date"),
  extractedVendor: text("extracted_vendor"),
  extractedCategory: text("extracted_category"),
  rawText: text("raw_text"),
  status: text("status", { enum: ["pending", "processed", "failed"] }).notNull().default("pending"),
  transactionId: integer("transaction_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertReceiptSchema = createInsertSchema(receiptsTable).omit({ id: true, createdAt: true });
export type InsertReceipt = z.infer<typeof insertReceiptSchema>;
export type Receipt = typeof receiptsTable.$inferSelect;
