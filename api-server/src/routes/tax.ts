import { Router, type IRouter } from "express";
import { db, transactionsTable, categoriesTable } from "../db/index.js";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { GetTaxEstimateQueryParams, GetTaxSummaryQueryParams } from "../lib/api-zod.js";

const router: IRouter = Router();

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function calculateTaxRate(taxableIncome: number): number {
  if (taxableIncome <= 300000) return 0.05;
  if (taxableIncome <= 600000) return 0.075;
  if (taxableIncome <= 1100000) return 0.1;
  if (taxableIncome <= 1600000) return 0.125;
  return 0.15;
}

function generateExplanation(income: number, expenses: number, taxableIncome: number, estimatedTax: number, taxRate: number): string {
  const fmt = (n: number) => `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  if (income === 0) {
    return "No income recorded for this period. Once you add income transactions, we'll calculate your estimated tax.";
  }

  if (estimatedTax === 0) {
    return `Your expenses (${fmt(expenses)}) exceeded your income (${fmt(income)}), so no tax is estimated for this period. Keep tracking your expenses — they reduce your tax!`;
  }

  return `You earned ${fmt(income)} and spent ${fmt(expenses)} on business expenses. Your taxable income is ${fmt(taxableIncome)}, which falls in the ${(taxRate * 100).toFixed(1)}% tax bracket. You may need to set aside about ${fmt(estimatedTax)} for taxes. Tip: More business expenses mean lower taxes!`;
}

router.get("/estimate", async (req, res) => {
  try {
    const now = new Date();
    const rawQuery = req.query as Record<string, string>;
    const month = rawQuery.month ? parseInt(rawQuery.month) : now.getMonth() + 1;
    const year = rawQuery.year ? parseInt(rawQuery.year) : now.getFullYear();

    const monthStr = String(month).padStart(2, "0");
    const startDate = `${year}-${monthStr}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${monthStr}-${String(lastDay).padStart(2, "0")}`;

    const rows = await db
      .select({
        type: transactionsTable.type,
        amount: transactionsTable.amount,
        categoryId: transactionsTable.categoryId,
        categoryName: categoriesTable.name,
        categoryIcon: categoriesTable.icon,
        categoryColor: categoriesTable.color,
        categoryType: categoriesTable.type,
      })
      .from(transactionsTable)
      .leftJoin(categoriesTable, eq(transactionsTable.categoryId, categoriesTable.id))
      .where(and(gte(transactionsTable.date, startDate), lte(transactionsTable.date, endDate)));

    const totalIncome = rows
      .filter((r) => r.type === "income")
      .reduce((sum, r) => sum + parseFloat(r.amount), 0);

    const totalExpenses = rows
      .filter((r) => r.type === "expense")
      .reduce((sum, r) => sum + parseFloat(r.amount), 0);

    const taxableIncome = Math.max(0, totalIncome - totalExpenses);
    const taxRate = calculateTaxRate(taxableIncome);
    const estimatedTax = Math.round(taxableIncome * taxRate * 100) / 100;
    const explanation = generateExplanation(totalIncome, totalExpenses, taxableIncome, estimatedTax, taxRate);

    const breakdown = [
      {
        label: "Total Income",
        amount: totalIncome,
        description: "Money earned from your business this period",
      },
      {
        label: "Total Expenses",
        amount: -totalExpenses,
        description: "Business costs that reduce your taxable income",
      },
      {
        label: "Taxable Income",
        amount: taxableIncome,
        description: "Income minus expenses — what you'll be taxed on",
      },
      {
        label: `Tax (${(taxRate * 100).toFixed(1)}% rate)`,
        amount: estimatedTax,
        description: "Estimated amount to set aside for taxes",
      },
    ];

    res.json({
      month,
      year,
      totalIncome,
      totalExpenses,
      taxableIncome,
      estimatedTax,
      taxRate,
      explanation,
      breakdown,
    });
  } catch (err) {
    res.status(400).json({ error: "Bad Request", message: String(err) });
  }
});

router.get("/summary", async (req, res) => {
  try {
    const rawQuery = req.query as Record<string, string>;
    const year = rawQuery.year ? parseInt(rawQuery.year) : new Date().getFullYear();

    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const rows = await db
      .select({
        type: transactionsTable.type,
        amount: transactionsTable.amount,
        date: transactionsTable.date,
        categoryId: transactionsTable.categoryId,
        categoryName: categoriesTable.name,
        categoryIcon: categoriesTable.icon,
        categoryColor: categoriesTable.color,
        categoryType: categoriesTable.type,
      })
      .from(transactionsTable)
      .leftJoin(categoriesTable, eq(transactionsTable.categoryId, categoriesTable.id))
      .where(and(gte(transactionsTable.date, startDate), lte(transactionsTable.date, endDate)));

    const monthlyData = MONTH_NAMES.map((monthName, idx) => {
      const month = idx + 1;
      const monthStr = String(month).padStart(2, "0");
      const monthRows = rows.filter((r) => r.date.startsWith(`${year}-${monthStr}`));
      const income = monthRows.filter((r) => r.type === "income").reduce((s, r) => s + parseFloat(r.amount), 0);
      const expenses = monthRows.filter((r) => r.type === "expense").reduce((s, r) => s + parseFloat(r.amount), 0);
      const taxableIncome = Math.max(0, income - expenses);
      const taxRate = calculateTaxRate(taxableIncome);
      const estimatedTax = Math.round(taxableIncome * taxRate * 100) / 100;
      return { month, monthName, income, expenses, taxableIncome, estimatedTax };
    });

    const totalIncome = rows.filter((r) => r.type === "income").reduce((s, r) => s + parseFloat(r.amount), 0);
    const totalExpenses = rows.filter((r) => r.type === "expense").reduce((s, r) => s + parseFloat(r.amount), 0);
    const totalTaxableIncome = Math.max(0, totalIncome - totalExpenses);
    const totalTaxRate = calculateTaxRate(totalTaxableIncome);
    const totalEstimatedTax = Math.round(totalTaxableIncome * totalTaxRate * 100) / 100;

    const categoryTotals: Record<number, { category: { id: number; name: string; icon: string; color: string; type: string; createdAt: Date }; total: number; count: number }> = {};
    for (const row of rows.filter((r) => r.type === "expense" && r.categoryId)) {
      const catId = row.categoryId!;
      if (!categoryTotals[catId]) {
        categoryTotals[catId] = {
          category: {
            id: catId,
            name: row.categoryName ?? "Uncategorized",
            icon: row.categoryIcon ?? "📦",
            color: row.categoryColor ?? "#6B7280",
            type: row.categoryType ?? "expense",
            createdAt: new Date(),
          },
          total: 0,
          count: 0,
        };
      }
      categoryTotals[catId].total += parseFloat(row.amount);
      categoryTotals[catId].count++;
    }

    const topCategories = Object.values(categoryTotals)
      .map((c) => ({
        ...c,
        percentage: totalExpenses > 0 ? Math.round((c.total / totalExpenses) * 100 * 10) / 10 : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    res.json({
      year,
      monthlyData,
      totalIncome,
      totalExpenses,
      totalTaxableIncome,
      totalEstimatedTax,
      topCategories,
    });
  } catch (err) {
    res.status(400).json({ error: "Bad Request", message: String(err) });
  }
});

export default router;
