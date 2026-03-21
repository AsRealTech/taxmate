import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import transactionsRouter from "./transactions.js";
import categoriesRouter from "./categories.js";
import receiptsRouter from "./receipts.js";
import taxRouter from "./tax.js";
import taxPdfRouter from "./taxpdf.js";
import downloadRouter from "./download.js";
import openaiRouter from "./openai/indexTogether.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/transactions", transactionsRouter);
router.use("/categories", categoriesRouter);
router.use("/receipts", receiptsRouter);
router.use("/tax/pdf", taxPdfRouter);
router.use("/tax", taxRouter);
router.use("/download", downloadRouter);
router.use("/openai", openaiRouter);

export default router;
