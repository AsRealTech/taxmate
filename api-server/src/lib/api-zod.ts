import * as zod from "zod";

export const HealthCheckResponse = zod.object({ status: zod.string() });

export const GetTransactionsQueryParams = zod.object({
  type: zod.enum(["income", "expense"]).optional(),
  categoryId: zod.coerce.number().optional(),
  startDate: zod.date().optional(),
  endDate: zod.date().optional(),
});

export const GetTransactionsResponseItem = zod.object({
  id: zod.number(), type: zod.enum(["income", "expense"]), amount: zod.number(),
  description: zod.string(), categoryId: zod.number().nullish(),
  category: zod.object({ id: zod.number(), name: zod.string(), icon: zod.string(), color: zod.string(), type: zod.enum(["income", "expense", "both"]), createdAt: zod.date() }).nullish(),
  date: zod.date(), receiptId: zod.number().nullish(), notes: zod.string().nullish(), createdAt: zod.date(), updatedAt: zod.date(),
});
export const GetTransactionsResponse = zod.array(GetTransactionsResponseItem);

export const createTransactionBodyAmountMin = 0.01;
export const CreateTransactionBody = zod.object({
  type: zod.enum(["income", "expense"]),
  amount: zod.number().min(createTransactionBodyAmountMin),
  description: zod.string(),
  categoryId: zod.number().nullish(),
  date: zod.date(),
  notes: zod.string().nullish(),
  receiptId: zod.number().nullish(),
});

export const GetTransactionParams = zod.object({ id: zod.coerce.number() });

export const GetTransactionResponse = zod.object({
  id: zod.number(), type: zod.enum(["income", "expense"]), amount: zod.number(),
  description: zod.string(), categoryId: zod.number().nullish(),
  category: zod.object({ id: zod.number(), name: zod.string(), icon: zod.string(), color: zod.string(), type: zod.enum(["income", "expense", "both"]), createdAt: zod.date() }).nullish(),
  date: zod.date(), receiptId: zod.number().nullish(), notes: zod.string().nullish(), createdAt: zod.date(), updatedAt: zod.date(),
});

export const UpdateTransactionParams = zod.object({ id: zod.coerce.number() });
export const updateTransactionBodyAmountMin = 0.01;
export const UpdateTransactionBody = zod.object({
  type: zod.enum(["income", "expense"]).optional(),
  amount: zod.number().min(updateTransactionBodyAmountMin).optional(),
  description: zod.string().optional(),
  categoryId: zod.number().nullish(),
  date: zod.date().optional(),
  notes: zod.string().nullish(),
});
export const UpdateTransactionResponse = GetTransactionResponse;
export const DeleteTransactionParams = zod.object({ id: zod.coerce.number() });

export const GetCategoriesResponseItem = zod.object({ id: zod.number(), name: zod.string(), icon: zod.string(), color: zod.string(), type: zod.enum(["income", "expense", "both"]), createdAt: zod.date() });
export const GetCategoriesResponse = zod.array(GetCategoriesResponseItem);
export const CreateCategoryBody = zod.object({ name: zod.string(), icon: zod.string(), color: zod.string(), type: zod.enum(["income", "expense", "both"]) });

export const GetReceiptParams = zod.object({ id: zod.coerce.number() });
export const UploadReceiptBody = zod.object({
  imageData: zod.string(),
  mimeType: zod.enum(["image/jpeg", "image/png", "image/webp"]),
});

export const GetTaxEstimateQueryParams = zod.object({
  month: zod.coerce.number().min(1).max(12).optional(),
  year: zod.coerce.number().optional(),
});
export const GetTaxSummaryQueryParams = zod.object({
  year: zod.coerce.number().optional(),
});

export const CreateOpenaiConversationBody = zod.object({ title: zod.string() });
export const SendOpenaiMessageBody = zod.object({ content: zod.string() });
export const SendOpenaiMessageParams = zod.object({ id: zod.coerce.number() });
