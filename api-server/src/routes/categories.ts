import { Router, type IRouter } from "express";
import { db, categoriesTable } from "../db/index.js";
import { CreateCategoryBody } from "../lib/api-zod.js";

const router: IRouter = Router();

router.get("/", async (_req, res) => {
  try {
    const rows = await db.select().from(categoriesTable).orderBy(categoriesTable.name);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

router.post("/", async (req, res) => {
  try {
    const body = CreateCategoryBody.parse(req.body);
    const [row] = await db.insert(categoriesTable).values(body).returning();
    res.status(201).json(row);
  } catch (err) {
    res.status(400).json({ error: "Bad Request", message: String(err) });
  }
});

export default router;
