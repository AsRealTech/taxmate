import { Router, type IRouter } from "express";
import { db, transactionsTable, categoriesTable } from "../db/index.js";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import {
  CreateTransactionBody,
  UpdateTransactionBody,
  GetTransactionsQueryParams,
  GetTransactionParams,
  UpdateTransactionParams,
  DeleteTransactionParams,
} from "../lib/api-zod.js";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const rawQuery = req.query as Record<string, string>;
    const conditions = [];

    if (rawQuery.type && ["income", "expense"].includes(rawQuery.type)) {
      conditions.push(eq(transactionsTable.type, rawQuery.type as "income" | "expense"));
    }
    if (rawQuery.categoryId) {
      const catId = parseInt(rawQuery.categoryId);
      if (!isNaN(catId)) conditions.push(eq(transactionsTable.categoryId, catId));
    }
    if (rawQuery.startDate) conditions.push(gte(transactionsTable.date, rawQuery.startDate));
    if (rawQuery.endDate) conditions.push(lte(transactionsTable.date, rawQuery.endDate));

    const rows = await db
      .select({
        id: transactionsTable.id,
        type: transactionsTable.type,
        amount: transactionsTable.amount,
        description: transactionsTable.description,
        categoryId: transactionsTable.categoryId,
        date: transactionsTable.date,
        receiptId: transactionsTable.receiptId,
        notes: transactionsTable.notes,
        createdAt: transactionsTable.createdAt,
        updatedAt: transactionsTable.updatedAt,
        category: {
          id: categoriesTable.id,
          name: categoriesTable.name,
          icon: categoriesTable.icon,
          color: categoriesTable.color,
          type: categoriesTable.type,
          createdAt: categoriesTable.createdAt,
        },
      })
      .from(transactionsTable)
      .leftJoin(categoriesTable, eq(transactionsTable.categoryId, categoriesTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(sql`${transactionsTable.date} DESC, ${transactionsTable.createdAt} DESC`);

    const result = rows.map((r) => ({
      ...r,
      amount: parseFloat(r.amount),
      category: r.category?.id ? r.category : null,
    }));

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: "Bad Request", message: String(err) });
  }
});

router.post("/", async (req, res) => {
  try {
    const body = CreateTransactionBody.parse(req.body);
    const [row] = await db
      .insert(transactionsTable)
      .values({
        type: body.type,
        amount: String(body.amount),
        description: body.description,
        categoryId: body.categoryId ?? null,
        date: body.date,
        notes: body.notes ?? null,
        receiptId: body.receiptId ?? null,
      })
      .returning();

    let category = null;
    if (row.categoryId) {
      const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, row.categoryId));
      if (cat) category = cat;
    }

    res.status(201).json({ ...row, amount: parseFloat(row.amount), category });
  } catch (err) {
    res.status(400).json({ error: "Bad Request", message: String(err) });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = GetTransactionParams.parse({ id: parseInt(req.params.id) });
    const [row] = await db
      .select({
        id: transactionsTable.id,
        type: transactionsTable.type,
        amount: transactionsTable.amount,
        description: transactionsTable.description,
        categoryId: transactionsTable.categoryId,
        date: transactionsTable.date,
        receiptId: transactionsTable.receiptId,
        notes: transactionsTable.notes,
        createdAt: transactionsTable.createdAt,
        updatedAt: transactionsTable.updatedAt,
        category: {
          id: categoriesTable.id,
          name: categoriesTable.name,
          icon: categoriesTable.icon,
          color: categoriesTable.color,
          type: categoriesTable.type,
          createdAt: categoriesTable.createdAt,
        },
      })
      .from(transactionsTable)
      .leftJoin(categoriesTable, eq(transactionsTable.categoryId, categoriesTable.id))
      .where(eq(transactionsTable.id, id));

    if (!row) {
      return res.status(404).json({ error: "Not Found", message: "Transaction not found" });
    }

    res.json({ ...row, amount: parseFloat(row.amount), category: row.category?.id ? row.category : null });
  } catch (err) {
    res.status(400).json({ error: "Bad Request", message: String(err) });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = UpdateTransactionParams.parse({ id: parseInt(req.params.id) });
    const body = UpdateTransactionBody.parse(req.body);

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (body.type !== undefined) updateData.type = body.type;
    if (body.amount !== undefined) updateData.amount = String(body.amount);
    if (body.description !== undefined) updateData.description = body.description;
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
    if (body.date !== undefined) updateData.date = body.date;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const [row] = await db
      .update(transactionsTable)
      .set(updateData)
      .where(eq(transactionsTable.id, id))
      .returning();

    if (!row) {
      return res.status(404).json({ error: "Not Found", message: "Transaction not found" });
    }

    let category = null;
    if (row.categoryId) {
      const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, row.categoryId));
      if (cat) category = cat;
    }

    res.json({ ...row, amount: parseFloat(row.amount), category });
  } catch (err) {
    res.status(400).json({ error: "Bad Request", message: String(err) });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = DeleteTransactionParams.parse({ id: parseInt(req.params.id) });
    const [row] = await db.delete(transactionsTable).where(eq(transactionsTable.id, id)).returning();
    if (!row) {
      return res.status(404).json({ error: "Not Found", message: "Transaction not found" });
    }
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: "Bad Request", message: String(err) });
  }
});

export default router;
