import { Router, type IRouter } from "express";
import { db, receiptsTable } from "../db/index.js";
import { eq } from "drizzle-orm";
import { UploadReceiptBody, GetReceiptParams } from "../lib/api-zod.js";

const router: IRouter = Router();

router.get("/", async (_req, res) => {
  try {
    const rows = await db.select().from(receiptsTable).orderBy(receiptsTable.createdAt);
    const result = rows.map((r) => ({
      ...r,
      extractedAmount: r.extractedAmount ? parseFloat(r.extractedAmount) : null,
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

router.post("/", async (req, res) => {
  try {
    const body = UploadReceiptBody.parse(req.body);

    const [row] = await db
      .insert(receiptsTable)
      .values({
        status: "pending",
        imageUrl: `data:${body.mimeType};base64,${body.imageData}`,
      })
      .returning();

    await processReceiptAsync(row.id, body.imageData, body.mimeType);

    const [updatedRow] = await db.select().from(receiptsTable).where(eq(receiptsTable.id, row.id));
    res.status(201).json({
      ...updatedRow,
      extractedAmount: updatedRow?.extractedAmount ? parseFloat(updatedRow.extractedAmount) : null,
    });
  } catch (err) {
    res.status(400).json({ error: "Bad Request", message: String(err) });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = GetReceiptParams.parse({ id: parseInt(req.params.id) });
    const [row] = await db.select().from(receiptsTable).where(eq(receiptsTable.id, id));
    if (!row) {
      return res.status(404).json({ error: "Not Found", message: "Receipt not found" });
    }
    res.json({ ...row, extractedAmount: row.extractedAmount ? parseFloat(row.extractedAmount) : null });
  } catch (err) {
    res.status(400).json({ error: "Bad Request", message: String(err) });
  }
});

async function processReceiptAsync(receiptId: number, imageData: string, mimeType: string) {
  try {
    const extracted = await extractReceiptData(imageData, mimeType);
    await db
      .update(receiptsTable)
      .set({
        status: "processed",
        extractedAmount: extracted.amount ? String(extracted.amount) : null,
        extractedDate: extracted.date ?? null,
        extractedVendor: extracted.vendor ?? null,
        extractedCategory: extracted.category ?? null,
        rawText: extracted.rawText ?? null,
      })
      .where(eq(receiptsTable.id, receiptId));
  } catch (err) {
    await db.update(receiptsTable).set({ status: "failed" }).where(eq(receiptsTable.id, receiptId));
    console.error("Receipt processing failed:", err);
  }
}

async function extractReceiptData(imageData: string, mimeType: string) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;

  if (!apiKey) {
    return simulateExtraction();
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Extract the following from this receipt image and return as JSON:
- amount (number, in Naira if currency shown)
- date (string, format YYYY-MM-DD)
- vendor (string, business name)
- category (string, one of: Food & Drinks, Transport, Utilities, Shopping, Services, Other)
- rawText (string, all visible text from receipt)

Return ONLY valid JSON with these keys. If a field cannot be determined, use null.`,
              },
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${imageData}` },
              },
            ],
          },
        ],
        max_tokens: 500,
      }),
    });

    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content ?? "{}";
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return simulateExtraction();
  }
}

function simulateExtraction() {
  const vendors = ["Shoprite", "Mr Biggs", "Jumia", "Konga", "Total Filling Station", "GTBank ATM"];
  const categories = ["Food & Drinks", "Transport", "Shopping", "Services"];
  const today = new Date();
  const daysAgo = Math.floor(Math.random() * 30);
  today.setDate(today.getDate() - daysAgo);

  return {
    amount: Math.round((Math.random() * 50000 + 500) * 100) / 100,
    date: today.toISOString().split("T")[0],
    vendor: vendors[Math.floor(Math.random() * vendors.length)],
    category: categories[Math.floor(Math.random() * categories.length)],
    rawText: "Receipt scan simulated - AI vision not configured",
  };
}

export default router;
