import { Router, type IRouter } from "express";
import PDFDocument from "pdfkit";

const router: IRouter = Router();

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function calcTaxRate(taxable: number): number {
  if (taxable <= 300000) return 0.05;
  if (taxable <= 600000) return 0.075;
  if (taxable <= 1100000) return 0.1;
  if (taxable <= 1600000) return 0.125;
  return 0.15;
}

function fmt(n: number): string {
  return "N" + n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

router.post("/", (req, res) => {
  try {
    const {
      income = 0,
      expenses = 0,
      month = new Date().getMonth() + 1,
      year = new Date().getFullYear(),
      businessName = "My Business",
      transactions = [],
    } = req.body as {
      income: number;
      expenses: number;
      month?: number;
      year?: number;
      businessName?: string;
      transactions?: Array<{ description: string; amount: number; type: string; date: string; category?: string }>;
    };

    const taxableIncome = Math.max(0, income - expenses);
    const taxRate = calcTaxRate(taxableIncome);
    const estimatedTax = Math.round(taxableIncome * taxRate * 100) / 100;
    const monthName = MONTH_NAMES[(month - 1) % 12];
    const generatedDate = new Date().toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="tax-estimate-${monthName}-${year}.pdf"`);

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    doc.pipe(res);

    const teal = "#1a7a6e";
    const darkText = "#1a2332";
    const midGray = "#64748b";
    const lightGray = "#f1f5f9";
    const green = "#16a34a";
    const red = "#dc2626";

    doc.rect(0, 0, doc.page.width, 140).fill(teal);

    doc.fill("white").fontSize(26).font("Helvetica-Bold").text("TaxMate", 50, 45);
    doc.fill("rgba(255,255,255,0.8)").fontSize(11).font("Helvetica").text("Simple Tax Estimate Report", 50, 80);
    doc.fill("rgba(255,255,255,0.7)").fontSize(10).text(`${monthName} ${year}  •  Generated ${generatedDate}`, 50, 100);

    doc.fill(darkText).font("Helvetica-Bold").fontSize(13).text(businessName, 50, 155);
    doc.moveTo(50, 175).lineTo(doc.page.width - 50, 175).strokeColor("#e2e8f0").lineWidth(1).stroke();

    let y = 195;

    doc.fill(teal).font("Helvetica-Bold").fontSize(11).text("INCOME & EXPENSE SUMMARY", 50, y);
    y += 22;

    const rows = [
      { label: "Total Income", value: fmt(income), color: green, bold: false },
      { label: "Total Business Expenses", value: `- ${fmt(expenses)}`, color: red, bold: false },
      { label: "Taxable Income", value: fmt(taxableIncome), color: darkText, bold: true },
    ];

    for (const row of rows) {
      doc.rect(50, y, doc.page.width - 100, 32).fill(row.bold ? "#e8f4f2" : lightGray);
      doc.fill(darkText).font(row.bold ? "Helvetica-Bold" : "Helvetica").fontSize(11).text(row.label, 65, y + 10);
      doc.fill(row.color).font(row.bold ? "Helvetica-Bold" : "Helvetica").text(row.value, 0, y + 10, { align: "right", width: doc.page.width - 65 });
      y += 38;
    }

    y += 18;
    doc.fill(teal).font("Helvetica-Bold").fontSize(11).text("TAX ESTIMATE", 50, y);
    y += 22;

    doc.rect(50, y, doc.page.width - 100, 80).fill("#e8f4f2");

    doc.fill(teal).font("Helvetica-Bold").fontSize(10).text(`Tax Rate Applied: ${(taxRate * 100).toFixed(1)}%`, 65, y + 14);
    doc.fill(midGray).font("Helvetica").fontSize(9).text(
      taxableIncome <= 300000
        ? "Income bracket: Up to N300,000 — lowest rate applies"
        : taxableIncome <= 600000
        ? "Income bracket: N300,001 – N600,000"
        : "Income bracket: Above N600,000",
      65, y + 30
    );

    doc.fill(darkText).font("Helvetica-Bold").fontSize(20).text(fmt(estimatedTax), 65, y + 44);
    doc.fill(midGray).font("Helvetica").fontSize(9).text("Estimated Tax to Set Aside", 65 + 160, y + 52);

    y += 100;

    const friendlyMsg = estimatedTax === 0
      ? "Great news! Your expenses covered your income this period, so no tax is estimated. Keep recording your expenses — they save you money!"
      : `Based on your income of ${fmt(income)} and expenses of ${fmt(expenses)}, you may need to set aside about ${fmt(estimatedTax)} for taxes this ${monthName}. The good news: tracking more expenses lowers this amount!`;

    doc.rect(50, y, doc.page.width - 100, 70).fill("#f0fdf4");
    doc.fill(green).font("Helvetica-Bold").fontSize(10).text("What this means for you:", 65, y + 12);
    doc.fill(darkText).font("Helvetica").fontSize(9).text(friendlyMsg, 65, y + 28, { width: doc.page.width - 130, lineGap: 4 });

    y += 90;

    if (transactions && transactions.length > 0) {
      doc.fill(teal).font("Helvetica-Bold").fontSize(11).text("TRANSACTION BREAKDOWN", 50, y);
      y += 22;

      doc.rect(50, y, doc.page.width - 100, 26).fill(teal);
      doc.fill("white").font("Helvetica-Bold").fontSize(9)
        .text("Date", 62, y + 8)
        .text("Description", 130, y + 8)
        .text("Category", 320, y + 8)
        .text("Amount", 0, y + 8, { align: "right", width: doc.page.width - 55 });
      y += 32;

      let rowToggle = false;
      for (const tx of transactions.slice(0, 15)) {
        if (y > doc.page.height - 150) {
          doc.addPage();
          y = 50;
        }
        doc.rect(50, y, doc.page.width - 100, 24).fill(rowToggle ? "#f8fafc" : "white");
        doc.fill(midGray).font("Helvetica").fontSize(8).text(tx.date || "", 62, y + 8);
        doc.fill(darkText).text(tx.description || "", 130, y + 8, { width: 180 });
        doc.fill(midGray).text(tx.category || "—", 320, y + 8, { width: 90 });
        doc.fill(tx.type === "income" ? green : red)
          .text(`${tx.type === "income" ? "+" : "-"}${fmt(Math.abs(tx.amount))}`, 0, y + 8, { align: "right", width: doc.page.width - 55 });
        y += 26;
        rowToggle = !rowToggle;
      }
    }

    y = Math.max(y + 30, doc.page.height - 130);

    doc.moveTo(50, y).lineTo(doc.page.width - 50, y).strokeColor("#e2e8f0").lineWidth(1).stroke();
    y += 16;

    doc.fill(midGray).font("Helvetica").fontSize(8)
      .text("This is a simplified tax estimate for planning purposes only. For official tax filing, consult a certified tax professional or the Federal Inland Revenue Service (FIRS).", 50, y, {
        width: doc.page.width - 100,
        align: "center",
        lineGap: 3,
      });

    y += 36;
    doc.fill(teal).font("Helvetica-Bold").fontSize(9).text("TaxMate — Making taxes simple for every business", 0, y, { align: "center" });

    doc.end();
  } catch (err) {
    console.error("PDF generation error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate PDF", message: String(err) });
    }
  }
});

export default router;
