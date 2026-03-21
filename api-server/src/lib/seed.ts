import { db, categoriesTable, transactionsTable } from "../db/index.js";

const defaultCategories = [
  { name: "Sales Revenue", icon: "💰", color: "#22C55E", type: "income" as const },
  { name: "Freelance Work", icon: "💻", color: "#3B82F6", type: "income" as const },
  { name: "Market Sales", icon: "🛒", color: "#10B981", type: "income" as const },
  { name: "Food & Drinks", icon: "🍔", color: "#F97316", type: "expense" as const },
  { name: "Transport", icon: "🚗", color: "#8B5CF6", type: "expense" as const },
  { name: "Utilities", icon: "⚡", color: "#EAB308", type: "expense" as const },
  { name: "Supplies", icon: "📦", color: "#6B7280", type: "expense" as const },
  { name: "Marketing", icon: "📢", color: "#EC4899", type: "expense" as const },
  { name: "Rent", icon: "🏠", color: "#14B8A6", type: "expense" as const },
  { name: "Other", icon: "📌", color: "#94A3B8", type: "both" as const },
];

async function seed() {
  const existingCats = await db.select().from(categoriesTable);
  if (existingCats.length === 0) {
    await db.insert(categoriesTable).values(defaultCategories);
    console.log("Categories seeded");
  } else {
    console.log("Categories already exist, skipping");
  }

  const existingTx = await db.select().from(transactionsTable);
  if (existingTx.length === 0) {
    const allCats = await db.select().from(categoriesTable);
    const catMap = Object.fromEntries(allCats.map((c) => [c.name, c.id]));
    const now = new Date();
    const transactions = [];

    for (let i = 0; i < 4; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), Math.max(1, now.getDate() - i * 2));
      const dateStr = d.toISOString().split("T")[0];
      transactions.push(
        { type: "income" as const, amount: String(Math.round((15000 + Math.random() * 35000) * 100) / 100), description: "Market Sales", categoryId: catMap["Market Sales"] ?? null, date: dateStr, notes: null, receiptId: null },
        { type: "expense" as const, amount: String(Math.round((1000 + Math.random() * 3000) * 100) / 100), description: "Transport to market", categoryId: catMap["Transport"] ?? null, date: dateStr, notes: null, receiptId: null },
        { type: "expense" as const, amount: String(Math.round((2000 + Math.random() * 6000) * 100) / 100), description: "Business supplies", categoryId: catMap["Supplies"] ?? null, date: dateStr, notes: null, receiptId: null },
      );
    }

    for (let i = 0; i < 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - 1, 5 + i * 8);
      const dateStr = d.toISOString().split("T")[0];
      transactions.push(
        { type: "income" as const, amount: String(Math.round((20000 + Math.random() * 40000) * 100) / 100), description: "Freelance Design Project", categoryId: catMap["Freelance Work"] ?? null, date: dateStr, notes: null, receiptId: null },
        { type: "expense" as const, amount: String(Math.round((3000 + Math.random() * 5000) * 100) / 100), description: "Food for the week", categoryId: catMap["Food & Drinks"] ?? null, date: dateStr, notes: null, receiptId: null },
        { type: "expense" as const, amount: String(25000), description: "Shop rent", categoryId: catMap["Rent"] ?? null, date: dateStr, notes: null, receiptId: null },
      );
    }

    await db.insert(transactionsTable).values(transactions);
    console.log("Transactions seeded");
  } else {
    console.log("Transactions already exist, skipping");
  }

  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
