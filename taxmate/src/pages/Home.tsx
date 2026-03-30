import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { formatNaira, cn } from "@/lib/utils";
import {
  ArrowUpRight, ArrowDownRight, ArrowRight, ScanLine, ListOrdered,
  Calculator, ChevronRight, CheckCircle2, Download,
  UserPlus, Sparkles, Star, X, Loader2,
  ExternalLink,
} from "lucide-react";
import { Link } from "wouter";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { useGetTransactions } from "@/lib/api-client";
import { format, parseISO } from "date-fns";
import FAQHome from "./FAQHome";
import { motion } from "framer-motion";

function calcTaxRate(taxable: number) {
  if (taxable <= 800_000) return 0;
  if (taxable <= 3_000_000) return 0.15;
  if (taxable <= 12_000_000) return 0.18;
  if (taxable <= 25_000_000) return 0.21;
  if (taxable <= 50_000_000) return 0.23;
  return 0.25;
}


function calculateTax(taxable: number) {
  let tax = 0;

  if (taxable > 50_000_000) {
    tax += (taxable - 50_000_000) * 0.25;
    taxable = 50_000_000;
  }

  if (taxable > 25_000_000) {
    tax += (taxable - 25_000_000) * 0.23;
    taxable = 25_000_000;
  }

  if (taxable > 12_000_000) {
    tax += (taxable - 12_000_000) * 0.21;
    taxable = 12_000_000;
  }

  if (taxable > 3_000_000) {
    tax += (taxable - 3_000_000) * 0.18;
    taxable = 3_000_000;
  }

  if (taxable > 800_000) {
    tax += (taxable - 800_000) * 0.15;
  }

  return Math.round(tax * 100) / 100;
}

function SignUpModal({ onClose }: { onClose: () => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-t-3xl p-6 pb-10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Star className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-bold text-lg text-foreground">Unlock More Features</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <h4 className="font-bold text-foreground text-lg">You're on the list!</h4>
            <p className="text-sm text-muted-foreground mt-2">We'll notify you when your account is ready. Keep tracking your business!</p>
            <button onClick={onClose} className="mt-5 w-full bg-primary text-white rounded-2xl py-3 font-semibold text-sm">Done</button>
          </div>
        ) : (
          <>
            <ul className="space-y-3 mb-6">
              {[
                "Automatic receipt scanning with AI",
                "Monthly tax reports & reminders",
                "Multi-business tracking",
                "WhatsApp tax alerts",
                "Export to Excel & PDF anytime",
              ].map((feat) => (
                <li key={feat} className="flex items-center gap-3 text-sm text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  {feat}
                </li>
              ))}
            </ul>
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-border rounded-xl px-4 py-3 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              onClick={() => email && setSubmitted(true)}
              className="w-full bg-primary text-white rounded-2xl py-3 font-semibold text-sm active:scale-95 transition-transform"
            >
              Sign Me Up — It's Free
            </button>
            <p className="text-xs text-muted-foreground text-center mt-3">No spam. Unsubscribe anytime.</p>
          </>
        )}
      </div>
    </div>
  );
}

function TaxCalculatorSection() {
  const [income, setIncome] = useState("");
  const [expenses, setExpenses] = useState("");
  const [result, setResult] = useState<null | { income: number; expenses: number; taxable: number; tax: number; rate: number }>(null);
  const [showSignUp, setShowSignUp] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { data: transactions } = useGetTransactions();

  function calculate() {
  const parse = (val:string) => parseFloat((val || "").replace(/,/g, "")) || 0;

  const inc = parse(income);
  const exp = parse(expenses);

  const taxable = Math.max(0, inc - exp);
  const rate = calcTaxRate(taxable);
  const tax = calculateTax(taxable);

  setResult({ income: inc, expenses: exp, taxable, tax, rate });
}

  async function downloadPdf() {
    if (!result) return;
    setDownloading(true);
    try {
      const txList = (transactions || []).slice(0, 20).map((tx) => ({
        description: tx.description,
        amount: tx.amount,
        type: tx.type,
        date: tx.date,
        category: tx.category?.name,
      }));
      const apiBase = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
      const res = await fetch(`${apiBase}/api/tax/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          income: result.income,
          expenses: result.expenses,
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          businessName: "My Business",
          transactions: txList,
        }),
      });
      const blob = await res.blob();
      if (!res.ok) {
        const errorText = await blob.text();
        console.error("Failed to generate PDF:", res.status, errorText);
        throw new Error(errorText || `PDF request failed with status ${res.status}`);
      }
      const pdfBlob = new Blob([blob], { type: "application/pdf" });
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tax-estimate-${new Date().toISOString().slice(0, 7)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  const month = new Date().toLocaleString("en-NG", { month: "long" });

  return (
    <div className="grid grid-cols-12 bg-white rounded-3xl border border-border/50 shadow-sm overflow-hidden">
        <div className="col-span-12 bg-primary/5 px-5 py-4 border-b border-border/30">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calculator className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-sm">Quick Tax Estimate</h3>
              <p className="text-xs text-muted-foreground">Enter your numbers for {month}</p>
            </div>
          </div>
        </div>
        <div className="col-span-12 shadow-md md:col-span-6 p-4">

            <div className="p-5 space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Total Income (₦)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="e.g. 150000"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Total Expenses (₦)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="e.g. 45000"
                  value={expenses}
                  onChange={(e) => setExpenses(e.target.value)}
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
                  />
              </div>
              <button
                onClick={calculate}
                disabled={!income}
                className="w-full bg-primary text-white rounded-2xl py-3 font-semibold text-sm active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Calculate My Tax
              </button>
            </div>
        </div>
        <div className="col-span-12 md:col-span-6 p-4">

            {result && (
              <div className="border-t border-border/30">
                {/* result */}
                <h3 className="font-bold text-foreground text-sm px-5 py-4">Your Tax Estimate</h3>
                <p className="text-xs text-muted-foreground">Personal income tax in Nigeria is progressive, and you pay only on the portion of income within Taxable Annual Income</p>
                {/* Result Summary */}
                <div className="px-5 py-4 bg-gradient-to-br from-primary/5 to-transparent space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Income</span>
                    <span className="font-semibold text-foreground">{formatNaira(result.income)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Expenses</span>
                    <span className="font-semibold text-foreground">- {formatNaira(result.expenses)}</span>
                  </div>
                  <div className="h-px bg-border/50 my-1" />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxable Income</span>
                    <span className="font-semibold text-foreground">{formatNaira(result.taxable)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Tax Rate</span>
                    <span className="text-xs bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">{(result.rate * 100).toFixed(1)}%</span>
                  </div>
                </div>

                {/* Friendly Tax Message */}
                <div className="mx-5 mb-4 bg-primary rounded-2xl p-4 text-white">
                  <p className="text-xs text-white/70 font-medium mb-0.5">Estimated Tax for {month}</p>
                  <p className="text-3xl font-bold">{formatNaira(result.tax)}</p>
                  <p className="text-xs text-white/80 mt-2 leading-relaxed">
                    {result.tax === 0
                      ? "Your expenses covered your income — no tax owed! Keep recording expenses to reduce your tax bill."
                      : `Set aside about ${formatNaira(result.tax)} this month. Every expense you track reduces this amount!`}
                  </p>
                </div>

                {/* CTA Buttons */}
                <div className="px-5 pb-5 space-y-3">
                  <p className="text-xs text-center text-muted-foreground font-medium">What would you like to do?</p>
                  <button
                    onClick={downloadPdf}
                    disabled={downloading}
                    className="flex items-center justify-center gap-2 w-full border border-primary/30 bg-primary/5 text-primary font-semibold py-3 rounded-2xl text-sm active:scale-95 transition-all hover:bg-primary/10"
                  >
                    {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {downloading ? "Generating PDF…" : "Download Tax Summary (PDF)"}
                  </button>
                  <button
                    onClick={() => setShowSignUp(true)}
                    className="flex items-center justify-center gap-2 w-full bg-primary text-white font-semibold py-3 rounded-2xl text-sm active:scale-95 transition-transform"
                  >
                    <UserPlus className="w-4 h-4" />
                    Sign Up for More Features
                  </button>
                  <p className="text-[10px] text-center text-muted-foreground leading-snug">
                    Sign up to get monthly reports, WhatsApp reminders, and AI-powered receipt scanning.
                  </p>
                </div>
              </div>
            )}

            {showSignUp && <SignUpModal onClose={() => setShowSignUp(false)} />}
        </div>
    </div>
  );
}

export default function Home() {
    const { data: transactions, isLoading } = useGetTransactions();

  return (
    <AppLayout>
      <div className="px-1 pb-6 space-y-6">
        {/* NRS Banner */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-600 to-green-700 p-4  text-white shadow-lg px-4 py-4 glass-panel sticky top-0 z-40"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-lg font-bold">🇳🇬</span>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm">Nigeria Revenue Service (NRS)</p>
              <p className="text-xs text-green-100 mt-0.5">
                Nigeria's official tax authority — responsible for all federal taxes.
              </p>
              <a
                href="https://www.firs.gov.ng"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-white underline decoration-white/50 mt-1.5 hover:text-green-100"
              >
                www.firs.gov.ng <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </motion.div>
        
        {/* Hero */}
        <div className="space-y-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-1.5 text-primary text-sm font-medium mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Welcome to TaxMate</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
                Your simple tax companion for smarter cashflow
              </h1>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed max-w-xl">
                Track income, scan receipts, and understand your taxes without the complexity. Start with a snapshot of your business performance and let TaxMate keep everything organised.
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-md shadow-primary/10 transition hover:bg-primary/90">
                  <ArrowUpRight className="w-4 h-4" />
                  Add Transaction
                </Link>
                <Link href="/receipts" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary">
                  <ListOrdered className="w-4 h-4" />
                  Scan Receipt
                </Link>
                <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/5 px-5 py-3 text-sm font-semibold text-primary transition hover:bg-primary/10">
                  <ArrowRight className="w-4 h-4" />
                  Sign in to Dashboard
                </Link>
              </div>
            </div>

            <div className="shrink-0 w-20 h-20 rounded-3xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-3xl font-black text-white">₦</span>
            </div>
          </div>


        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-white border border-border/50 p-5 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
              <ListOrdered className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Record once</h3>
            <p className="text-sm text-muted-foreground">Log income, expenses, or receipts and keep your business finances organised in one place.</p>
          </div>
          <div className="rounded-3xl bg-white border border-border/50 p-5 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
              <Calculator className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Estimate instantly</h3>
            <p className="text-sm text-muted-foreground">Get a quick tax estimate as soon as you enter your numbers, with transparency on taxable income and rates.</p>
          </div>
          <div className="rounded-3xl bg-white border border-border/50 p-5 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Take action</h3>
            <p className="text-sm text-muted-foreground">Export summaries, sign up for reminders, and stay ahead of deadlines with a simpler workflow.</p>
          </div>
        </div>

        {/* Tax Calculator */}
        <TaxCalculatorSection />

        <FAQHome />
      </div>
    </AppLayout>
  );
}
