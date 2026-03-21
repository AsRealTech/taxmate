import { AppLayout } from "@/components/layout/AppLayout";
import { useGetTaxSummary, useGetTaxEstimate } from "@/lib/api-client";
import { formatNaira, cn } from "@/lib/utils";
import { ShieldCheck, Info, FileText, TrendingUp, AlertTriangle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function Tax() {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data: summary, isLoading: isSummaryLoading } = useGetTaxSummary({ year });
  const { data: estimate, isLoading: isEstimateLoading } = useGetTaxEstimate({ month, year });

  const chartData = (summary?.monthlyData ?? []).map(d => ({
    name: d.monthName.substring(0, 3),
    Income: d.income,
    Tax: d.estimatedTax,
    Expenses: d.expenses
  }));

  return (
    <AppLayout title="Tax Insights">
      <div className="px-6 pb-6 space-y-8">
        
        {/* Main Tax Card */}
        <div className="bg-gradient-to-br from-primary to-primary/90 rounded-[2rem] p-6 shadow-xl shadow-primary/20 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
          
          <div className="flex items-center gap-2 mb-4 bg-white/10 w-max px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
            <ShieldCheck className="w-4 h-4 text-green-300" />
            <span className="text-xs font-medium tracking-wide uppercase">Safe & Compliant</span>
          </div>

          <h2 className="text-white/80 font-medium mb-1">Estimated Tax Owed ({year})</h2>
          
          {isSummaryLoading ? (
            <div className="h-12 w-48 bg-white/20 animate-pulse rounded-xl my-2" />
          ) : (
            <div className="flex items-end gap-2">
              <span className="text-5xl font-display font-bold">{formatNaira(summary?.totalEstimatedTax || 0)}</span>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-white/70">Total Income</span>
              <span className="font-medium">{formatNaira(summary?.totalIncome || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/70">Total Expenses (Deductions)</span>
              <span className="font-medium">-{formatNaira(summary?.totalExpenses || 0)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold pt-2">
              <span className="text-white/90">Taxable Income</span>
              <span>{formatNaira(summary?.totalTaxableIncome || 0)}</span>
            </div>
          </div>
        </div>

        {/* Current Month Explanation */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-border/50 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-accent" />
          <h3 className="text-lg font-bold font-display mb-2 flex items-center gap-2">
            <Info className="w-5 h-5 text-accent" /> 
            Plain English Explanation
          </h3>
          
          {isEstimateLoading ? (
            <div className="space-y-2 mt-4">
              <div className="h-4 bg-muted rounded animate-pulse w-full" />
              <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
              <div className="h-4 bg-muted rounded animate-pulse w-4/6" />
            </div>
          ) : (
            <div className="space-y-4 mt-3">
              <p className="text-muted-foreground leading-relaxed text-sm">
                {estimate?.explanation || `For this month, you made ${formatNaira(estimate?.totalIncome)} and spent ${formatNaira(estimate?.totalExpenses)}. The government only taxes your profit (what's left over), which is ${formatNaira(estimate?.taxableIncome)}.`}
              </p>
              
              <div className="bg-secondary/50 rounded-2xl p-4">
                <p className="text-sm font-semibold text-foreground mb-3">How we calculated this month:</p>
                <div className="space-y-2">
                  {(estimate?.breakdown ?? []).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          item.label.includes('Tax') ? "bg-accent" : item.amount < 0 ? "bg-destructive" : "bg-primary"
                        )} />
                        <span className="text-muted-foreground">{item.label}</span>
                      </div>
                      <span className="font-medium text-foreground">{formatNaira(Math.abs(item.amount))}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chart */}
        <div>
          <h3 className="text-lg font-bold font-display mb-6">Income vs Tax Over Time</h3>
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-border/50 h-72">
            <ResponsiveContainer w-full h-full>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTax" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(val) => `₦${val/1000}k`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                  formatter={(value: number) => formatNaira(value)}
                />
                <Area type="monotone" dataKey="Income" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="Tax" stroke="hsl(var(--accent))" strokeWidth={3} fillOpacity={1} fill="url(#colorTax)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Warning / Education */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex gap-4 mt-8">
          <FileText className="w-8 h-8 text-blue-500 shrink-0" />
          <div>
            <h4 className="font-bold text-blue-900">Need to file?</h4>
            <p className="text-sm text-blue-800/80 mt-1 leading-relaxed">
              These are estimates for planning. Official tax returns should be filed annually with the FIRS.
            </p>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
