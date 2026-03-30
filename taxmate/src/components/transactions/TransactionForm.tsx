import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, ArrowUpRight, ArrowDownRight, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

import { useCreateTransaction, useGetCategories, getGetTransactionsQueryKey } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  description: z.string().min(2, "Please enter a description"),
  categoryId: z.coerce.number().optional().nullable(),
  date: z.string(),
  notes: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  initialData?: Partial<TransactionFormValues>;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function TransactionForm({ initialData, onSuccess, trigger }: TransactionFormProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data: categories } = useGetCategories();
  
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: initialData?.type || "expense",
      amount: initialData?.amount || undefined,
      description: initialData?.description || "",
      categoryId: initialData?.categoryId || undefined,
      date: initialData?.date || format(new Date(), 'yyyy-MM-dd'),
      notes: initialData?.notes || "",
    },
  });

  const createMutation = useCreateTransaction({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetTransactionsQueryKey() });
        form.reset();
        setOpen(false);
        onSuccess?.();
      },
    }
  });

  const onSubmit = (data: TransactionFormValues) => {
    createMutation.mutate({ data });
  };

  const type = form.watch("type");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="rounded-full shadow-lg shadow-primary/25 hover:shadow-xl transition-all">
            <Plus className="w-4 h-4 mr-2" />
            Add Transaction
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-t-3xl rounded-b-none sm:rounded-3xl mt-auto sm:mt-auto mb-0 sm:mb-auto p-6 bg-background/95 backdrop-blur-xl border-t-0 shadow-2xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="font-display text-2xl">
            {initialData ? "Review & Save" : "New Transaction"}
          </DialogTitle>
          <DialogDescription>
            Record your income or expense to keep your tax estimate accurate.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Type Selector Toggle */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex p-1 bg-secondary rounded-2xl">
                      <button
                        type="button"
                        onClick={() => field.onChange("income")}
                        className={cn(
                          "flex-1 flex items-center justify-center py-2.5 px-4 rounded-xl font-medium text-sm transition-all duration-300",
                          field.value === "income" 
                            ? "bg-white text-primary shadow-sm" 
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <ArrowUpRight className="w-4 h-4 mr-1.5" />
                        Income
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange("expense")}
                        className={cn(
                          "flex-1 flex items-center justify-center py-2.5 px-4 rounded-xl font-medium text-sm transition-all duration-300",
                          field.value === "expense" 
                            ? "bg-white text-destructive shadow-sm" 
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <ArrowDownRight className="w-4 h-4 mr-1.5" />
                        Expense
                      </button>
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground">Amount (₦)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-muted-foreground font-display font-medium">₦</span>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          className="pl-10 text-2xl font-display font-bold h-14 bg-background border-border/50 focus-visible:ring-primary/20 rounded-2xl" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground">What was this for?</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Sold 5 bags of rice" className="h-12 rounded-xl bg-background" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground">Category</FormLabel>
                      <Select 
                        onValueChange={(v) => field.onChange(parseInt(v))} 
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 rounded-xl bg-background">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.filter(c => c.type === type || c.type === 'both').map(cat => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              <div className="flex items-center">
                                <span className="mr-2 text-lg">{cat.icon}</span>
                                {cat.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground">Date</FormLabel>
                      <FormControl>
                        <Input type="date" className="h-12 rounded-xl bg-background block w-full" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className={cn(
                "w-full h-14 rounded-2xl text-lg font-semibold shadow-lg transition-all active:scale-[0.98]",
                type === "income" ? "bg-primary hover:bg-primary/90 shadow-primary/25" : "bg-destructive hover:bg-destructive/90 shadow-destructive/25"
              )}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Save {type === "income" ? "Income" : "Expense"}
                </>
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
