export interface HealthStatus { status: string; }
export interface ErrorResponse { error: string; message: string; }
export type CategoryType = (typeof CategoryType)[keyof typeof CategoryType];
export const CategoryType = { income: "income", expense: "expense", both: "both" } as const;
export interface Category { id: number; name: string; icon: string; color: string; type: CategoryType; createdAt: string; }
export type CreateCategoryInputType = (typeof CreateCategoryInputType)[keyof typeof CreateCategoryInputType];
export const CreateCategoryInputType = { income: "income", expense: "expense", both: "both" } as const;
export interface CreateCategoryInput { name: string; icon: string; color: string; type: CreateCategoryInputType; }
export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];
export const TransactionType = { income: "income", expense: "expense" } as const;
export interface Transaction { id: number; type: TransactionType; amount: number; description: string; categoryId?: number | null; category?: Category | null; date: string; receiptId?: number | null; notes?: string | null; createdAt: string; updatedAt: string; }
export type CreateTransactionInputType = (typeof CreateTransactionInputType)[keyof typeof CreateTransactionInputType];
export const CreateTransactionInputType = { income: "income", expense: "expense" } as const;
export interface CreateTransactionInput { type: CreateTransactionInputType; amount: number; description: string; categoryId?: number | null; date: string; notes?: string | null; receiptId?: number | null; }
export type UpdateTransactionInputType = (typeof UpdateTransactionInputType)[keyof typeof UpdateTransactionInputType];
export const UpdateTransactionInputType = { income: "income", expense: "expense" } as const;
export interface UpdateTransactionInput { type?: UpdateTransactionInputType; amount?: number; description?: string; categoryId?: number | null; date?: string; notes?: string | null; }
export type ReceiptStatus = (typeof ReceiptStatus)[keyof typeof ReceiptStatus];
export const ReceiptStatus = { pending: "pending", processed: "processed", failed: "failed" } as const;
export interface Receipt { id: number; imageUrl?: string | null; extractedAmount?: number | null; extractedDate?: string | null; extractedVendor?: string | null; extractedCategory?: string | null; rawText?: string | null; status: ReceiptStatus; transactionId?: number | null; createdAt: string; }
export type UploadReceiptInputMimeType = (typeof UploadReceiptInputMimeType)[keyof typeof UploadReceiptInputMimeType];
export const UploadReceiptInputMimeType = { "image/jpeg": "image/jpeg", "image/png": "image/png", "image/webp": "image/webp" } as const;
export interface UploadReceiptInput { imageData: string; mimeType: UploadReceiptInputMimeType; }
export interface TaxBreakdownItem { label: string; amount: number; description: string; }
export interface TaxEstimate { month: number; year: number; totalIncome: number; totalExpenses: number; taxableIncome: number; estimatedTax: number; taxRate: number; explanation: string; breakdown: TaxBreakdownItem[]; }
export interface MonthlyTaxData { month: number; monthName: string; income: number; expenses: number; taxableIncome: number; estimatedTax: number; }
export interface CategorySummary { category: Category; total: number; count: number; percentage: number; }
export interface TaxSummary { year: number; monthlyData: MonthlyTaxData[]; totalIncome: number; totalExpenses: number; totalTaxableIncome: number; totalEstimatedTax: number; topCategories: CategorySummary[]; }
export interface OpenaiConversation { id: number; title: string; createdAt: string; }
export interface OpenaiMessage { id: number; conversationId: number; role: string; content: string; createdAt: string; }
export interface CreateOpenaiConversationBody { title: string; }
export interface SendOpenaiMessageBody { content: string; }
export interface OpenaiConversationWithMessages { id: number; title: string; createdAt: string; messages: OpenaiMessage[]; }
export interface OpenaiError { error: string; }
export type GetTransactionsParams = { type?: GetTransactionsType; categoryId?: number; startDate?: string; endDate?: string; };
export type GetTransactionsType = (typeof GetTransactionsType)[keyof typeof GetTransactionsType];
export const GetTransactionsType = { income: "income", expense: "expense" } as const;
export type GetTaxEstimateParams = { month?: number; year?: number; };
export type GetTaxSummaryParams = { year?: number; };
