import { useMutation, useQuery } from "@tanstack/react-query";
import type { MutationFunction, QueryFunction, QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import type { Category, CreateCategoryInput, CreateTransactionInput, ErrorResponse, GetTaxEstimateParams, GetTaxSummaryParams, GetTransactionsParams, HealthStatus, Receipt, TaxEstimate, TaxSummary, Transaction, UpdateTransactionInput, UploadReceiptInput } from "./api.schemas";
import { customFetch } from "./custom-fetch";
import type { ErrorType, BodyType } from "./custom-fetch";

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, ""); // Remove trailing slash if present

type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

export const getHealthCheckUrl = () => `${API_BASE}/api/healthz`;
export const healthCheck = async (options?: RequestInit): Promise<HealthStatus> => customFetch<HealthStatus>(getHealthCheckUrl(), { ...options, method: "GET" });
export const getHealthCheckQueryKey = () => [`/api/healthz`] as const;
export const getHealthCheckQueryOptions = <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: { query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>; request?: SecondParameter<typeof customFetch>; }) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getHealthCheckQueryKey();
  const queryFn: QueryFunction<Awaited<ReturnType<typeof healthCheck>>> = ({ signal }) => healthCheck({ signal, ...requestOptions });
  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & { queryKey: QueryKey };
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
export function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: { query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>; request?: SecondParameter<typeof customFetch>; }): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getHealthCheckQueryOptions(options);
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & { queryKey: QueryKey };
  return { ...query, queryKey: queryOptions.queryKey };
}

export const getGetTransactionsUrl = (params?: GetTransactionsParams) => {
  const normalizedParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => { if (value !== undefined) normalizedParams.append(key, value === null ? "null" : value.toString()); });
  const stringifiedParams = normalizedParams.toString();
  const path = stringifiedParams.length > 0 ? `/api/transactions?${stringifiedParams}` : `/api/transactions`;
  return `${API_BASE}${path}`;
};
export const getTransactions = async (params?: GetTransactionsParams, options?: RequestInit): Promise<Transaction[]> => customFetch<Transaction[]>(getGetTransactionsUrl(params), { ...options, method: "GET" });
export const getGetTransactionsQueryKey = (params?: GetTransactionsParams) => [`/api/transactions`, ...(params ? [params] : [])] as const;
export const getGetTransactionsQueryOptions = <TData = Awaited<ReturnType<typeof getTransactions>>, TError = ErrorType<unknown>>(params?: GetTransactionsParams, options?: { query?: UseQueryOptions<Awaited<ReturnType<typeof getTransactions>>, TError, TData>; request?: SecondParameter<typeof customFetch>; }) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getGetTransactionsQueryKey(params);
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getTransactions>>> = ({ signal }) => getTransactions(params, { signal, ...requestOptions });
  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<Awaited<ReturnType<typeof getTransactions>>, TError, TData> & { queryKey: QueryKey };
};
export type GetTransactionsQueryResult = NonNullable<Awaited<ReturnType<typeof getTransactions>>>;
export type GetTransactionsQueryError = ErrorType<unknown>;
export function useGetTransactions<TData = Awaited<ReturnType<typeof getTransactions>>, TError = ErrorType<unknown>>(params?: GetTransactionsParams, options?: { query?: UseQueryOptions<Awaited<ReturnType<typeof getTransactions>>, TError, TData>; request?: SecondParameter<typeof customFetch>; }): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getGetTransactionsQueryOptions(params, options);
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & { queryKey: QueryKey };
  return { ...query, queryKey: queryOptions.queryKey };
}

export const getCreateTransactionUrl = () => `${API_BASE}/api/transactions`;
export const createTransaction = async (createTransactionInput: CreateTransactionInput, options?: RequestInit): Promise<Transaction> => customFetch<Transaction>(getCreateTransactionUrl(), { ...options, method: "POST", headers: { "Content-Type": "application/json", ...options?.headers }, body: JSON.stringify(createTransactionInput) });
export const getCreateTransactionMutationOptions = <TError = ErrorType<unknown>, TContext = unknown>(options?: { mutation?: UseMutationOptions<Awaited<ReturnType<typeof createTransaction>>, TError, { data: BodyType<CreateTransactionInput> }, TContext>; request?: SecondParameter<typeof customFetch>; }): UseMutationOptions<Awaited<ReturnType<typeof createTransaction>>, TError, { data: BodyType<CreateTransactionInput> }, TContext> => {
  const mutationKey = ["createTransaction"];
  const { mutation: mutationOptions, request: requestOptions } = options ? (options.mutation && "mutationKey" in options.mutation && options.mutation.mutationKey ? options : { ...options, mutation: { ...options.mutation, mutationKey } }) : { mutation: { mutationKey }, request: undefined };
  const mutationFn: MutationFunction<Awaited<ReturnType<typeof createTransaction>>, { data: BodyType<CreateTransactionInput> }> = (props) => { const { data } = props ?? {}; return createTransaction(data, requestOptions); };
  return { mutationFn, ...mutationOptions };
};
export type CreateTransactionMutationResult = NonNullable<Awaited<ReturnType<typeof createTransaction>>>;
export type CreateTransactionMutationBody = BodyType<CreateTransactionInput>;
export type CreateTransactionMutationError = ErrorType<unknown>;
export const useCreateTransaction = <TError = ErrorType<unknown>, TContext = unknown>(options?: { mutation?: UseMutationOptions<Awaited<ReturnType<typeof createTransaction>>, TError, { data: BodyType<CreateTransactionInput> }, TContext>; request?: SecondParameter<typeof customFetch>; }): UseMutationResult<Awaited<ReturnType<typeof createTransaction>>, TError, { data: BodyType<CreateTransactionInput> }, TContext> => useMutation(getCreateTransactionMutationOptions(options));

export const getDeleteTransactionUrl = (id: number) => `${API_BASE}/api/transactions/${id}`;
export const deleteTransaction = async (id: number, options?: RequestInit): Promise<void> => customFetch<void>(getDeleteTransactionUrl(id), { ...options, method: "DELETE" });
export const getDeleteTransactionMutationOptions = <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: { mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteTransaction>>, TError, { id: number }, TContext>; request?: SecondParameter<typeof customFetch>; }): UseMutationOptions<Awaited<ReturnType<typeof deleteTransaction>>, TError, { id: number }, TContext> => {
  const mutationKey = ["deleteTransaction"];
  const { mutation: mutationOptions, request: requestOptions } = options ? (options.mutation && "mutationKey" in options.mutation && options.mutation.mutationKey ? options : { ...options, mutation: { ...options.mutation, mutationKey } }) : { mutation: { mutationKey }, request: undefined };
  const mutationFn: MutationFunction<Awaited<ReturnType<typeof deleteTransaction>>, { id: number }> = (props) => { const { id } = props ?? {}; return deleteTransaction(id, requestOptions); };
  return { mutationFn, ...mutationOptions };
};
export type DeleteTransactionMutationResult = NonNullable<Awaited<ReturnType<typeof deleteTransaction>>>;
export type DeleteTransactionMutationError = ErrorType<ErrorResponse>;
export const useDeleteTransaction = <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: { mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteTransaction>>, TError, { id: number }, TContext>; request?: SecondParameter<typeof customFetch>; }): UseMutationResult<Awaited<ReturnType<typeof deleteTransaction>>, TError, { id: number }, TContext> => useMutation(getDeleteTransactionMutationOptions(options));

export const getGetCategoriesUrl = () => `${API_BASE}/api/categories`;
export const getCategories = async (options?: RequestInit): Promise<Category[]> => customFetch<Category[]>(getGetCategoriesUrl(), { ...options, method: "GET" });
export const getGetCategoriesQueryKey = () => [`/api/categories`] as const;
export const getGetCategoriesQueryOptions = <TData = Awaited<ReturnType<typeof getCategories>>, TError = ErrorType<unknown>>(options?: { query?: UseQueryOptions<Awaited<ReturnType<typeof getCategories>>, TError, TData>; request?: SecondParameter<typeof customFetch>; }) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getGetCategoriesQueryKey();
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getCategories>>> = ({ signal }) => getCategories({ signal, ...requestOptions });
  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<Awaited<ReturnType<typeof getCategories>>, TError, TData> & { queryKey: QueryKey };
};
export type GetCategoriesQueryResult = NonNullable<Awaited<ReturnType<typeof getCategories>>>;
export type GetCategoriesQueryError = ErrorType<unknown>;
export function useGetCategories<TData = Awaited<ReturnType<typeof getCategories>>, TError = ErrorType<unknown>>(options?: { query?: UseQueryOptions<Awaited<ReturnType<typeof getCategories>>, TError, TData>; request?: SecondParameter<typeof customFetch>; }): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getGetCategoriesQueryOptions(options);
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & { queryKey: QueryKey };
  return { ...query, queryKey: queryOptions.queryKey };
}

export const getCreateCategoryUrl = () => `${API_BASE}/api/categories`;
export const createCategory = async (createCategoryInput: CreateCategoryInput, options?: RequestInit): Promise<Category> => customFetch<Category>(getCreateCategoryUrl(), { ...options, method: "POST", headers: { "Content-Type": "application/json", ...options?.headers }, body: JSON.stringify(createCategoryInput) });
export const getCreateCategoryMutationOptions = <TError = ErrorType<unknown>, TContext = unknown>(options?: { mutation?: UseMutationOptions<Awaited<ReturnType<typeof createCategory>>, TError, { data: BodyType<CreateCategoryInput> }, TContext>; request?: SecondParameter<typeof customFetch>; }): UseMutationOptions<Awaited<ReturnType<typeof createCategory>>, TError, { data: BodyType<CreateCategoryInput> }, TContext> => {
  const mutationKey = ["createCategory"];
  const { mutation: mutationOptions, request: requestOptions } = options ? (options.mutation && "mutationKey" in options.mutation && options.mutation.mutationKey ? options : { ...options, mutation: { ...options.mutation, mutationKey } }) : { mutation: { mutationKey }, request: undefined };
  const mutationFn: MutationFunction<Awaited<ReturnType<typeof createCategory>>, { data: BodyType<CreateCategoryInput> }> = (props) => { const { data } = props ?? {}; return createCategory(data, requestOptions); };
  return { mutationFn, ...mutationOptions };
};
export type CreateCategoryMutationResult = NonNullable<Awaited<ReturnType<typeof createCategory>>>;
export type CreateCategoryMutationBody = BodyType<CreateCategoryInput>;
export type CreateCategoryMutationError = ErrorType<unknown>;
export const useCreateCategory = <TError = ErrorType<unknown>, TContext = unknown>(options?: { mutation?: UseMutationOptions<Awaited<ReturnType<typeof createCategory>>, TError, { data: BodyType<CreateCategoryInput> }, TContext>; request?: SecondParameter<typeof customFetch>; }): UseMutationResult<Awaited<ReturnType<typeof createCategory>>, TError, { data: BodyType<CreateCategoryInput> }, TContext> => useMutation(getCreateCategoryMutationOptions(options));

export const getGetReceiptsUrl = () => `${API_BASE}/api/receipts`;
export const getReceipts = async (options?: RequestInit): Promise<Receipt[]> => customFetch<Receipt[]>(getGetReceiptsUrl(), { ...options, method: "GET" });
export const getGetReceiptsQueryKey = () => [`/api/receipts`] as const;
export const getGetReceiptsQueryOptions = <TData = Awaited<ReturnType<typeof getReceipts>>, TError = ErrorType<unknown>>(options?: { query?: UseQueryOptions<Awaited<ReturnType<typeof getReceipts>>, TError, TData>; request?: SecondParameter<typeof customFetch>; }) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getGetReceiptsQueryKey();
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getReceipts>>> = ({ signal }) => getReceipts({ signal, ...requestOptions });
  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<Awaited<ReturnType<typeof getReceipts>>, TError, TData> & { queryKey: QueryKey };
};
export type GetReceiptsQueryResult = NonNullable<Awaited<ReturnType<typeof getReceipts>>>;
export type GetReceiptsQueryError = ErrorType<unknown>;
export function useGetReceipts<TData = Awaited<ReturnType<typeof getReceipts>>, TError = ErrorType<unknown>>(options?: { query?: UseQueryOptions<Awaited<ReturnType<typeof getReceipts>>, TError, TData>; request?: SecondParameter<typeof customFetch>; }): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getGetReceiptsQueryOptions(options);
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & { queryKey: QueryKey };
  return { ...query, queryKey: queryOptions.queryKey };
}

export const getUploadReceiptUrl = () => `${API_BASE}/api/receipts`;
export const uploadReceipt = async (uploadReceiptInput: UploadReceiptInput, options?: RequestInit): Promise<Receipt> => customFetch<Receipt>(getUploadReceiptUrl(), { ...options, method: "POST", headers: { "Content-Type": "application/json", ...options?.headers }, body: JSON.stringify(uploadReceiptInput) });
export const getUploadReceiptMutationOptions = <TError = ErrorType<unknown>, TContext = unknown>(options?: { mutation?: UseMutationOptions<Awaited<ReturnType<typeof uploadReceipt>>, TError, { data: BodyType<UploadReceiptInput> }, TContext>; request?: SecondParameter<typeof customFetch>; }): UseMutationOptions<Awaited<ReturnType<typeof uploadReceipt>>, TError, { data: BodyType<UploadReceiptInput> }, TContext> => {
  const mutationKey = ["uploadReceipt"];
  const { mutation: mutationOptions, request: requestOptions } = options ? (options.mutation && "mutationKey" in options.mutation && options.mutation.mutationKey ? options : { ...options, mutation: { ...options.mutation, mutationKey } }) : { mutation: { mutationKey }, request: undefined };
  const mutationFn: MutationFunction<Awaited<ReturnType<typeof uploadReceipt>>, { data: BodyType<UploadReceiptInput> }> = (props) => { const { data } = props ?? {}; return uploadReceipt(data, requestOptions); };
  return { mutationFn, ...mutationOptions };
};
export type UploadReceiptMutationResult = NonNullable<Awaited<ReturnType<typeof uploadReceipt>>>;
export type UploadReceiptMutationBody = BodyType<UploadReceiptInput>;
export type UploadReceiptMutationError = ErrorType<unknown>;
export const useUploadReceipt = <TError = ErrorType<unknown>, TContext = unknown>(options?: { mutation?: UseMutationOptions<Awaited<ReturnType<typeof uploadReceipt>>, TError, { data: BodyType<UploadReceiptInput> }, TContext>; request?: SecondParameter<typeof customFetch>; }): UseMutationResult<Awaited<ReturnType<typeof uploadReceipt>>, TError, { data: BodyType<UploadReceiptInput> }, TContext> => useMutation(getUploadReceiptMutationOptions(options));

export const getGetTaxEstimateUrl = (params?: GetTaxEstimateParams) => {
  const normalizedParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => { if (value !== undefined) normalizedParams.append(key, value === null ? "null" : value.toString()); });
  const stringifiedParams = normalizedParams.toString();
  const path = stringifiedParams.length > 0 ? `/api/tax?${stringifiedParams}` : `/api/tax`;
  return `${API_BASE}${path}`;
};
export const getTaxEstimate = async (params?: GetTaxEstimateParams, options?: RequestInit): Promise<TaxEstimate> => customFetch<TaxEstimate>(getGetTaxEstimateUrl(params), { ...options, method: "GET" });
export const getGetTaxEstimateQueryKey = (params?: GetTaxEstimateParams) => [`/api/tax`, ...(params ? [params] : [])] as const;
export const getGetTaxEstimateQueryOptions = <TData = Awaited<ReturnType<typeof getTaxEstimate>>, TError = ErrorType<unknown>>(params?: GetTaxEstimateParams, options?: { query?: UseQueryOptions<Awaited<ReturnType<typeof getTaxEstimate>>, TError, TData>; request?: SecondParameter<typeof customFetch>; }) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getGetTaxEstimateQueryKey(params);
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getTaxEstimate>>> = ({ signal }) => getTaxEstimate(params, { signal, ...requestOptions });
  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<Awaited<ReturnType<typeof getTaxEstimate>>, TError, TData> & { queryKey: QueryKey };
};
export type GetTaxEstimateQueryResult = NonNullable<Awaited<ReturnType<typeof getTaxEstimate>>>;
export type GetTaxEstimateQueryError = ErrorType<unknown>;
export function useGetTaxEstimate<TData = Awaited<ReturnType<typeof getTaxEstimate>>, TError = ErrorType<unknown>>(params?: GetTaxEstimateParams, options?: { query?: UseQueryOptions<Awaited<ReturnType<typeof getTaxEstimate>>, TError, TData>; request?: SecondParameter<typeof customFetch>; }): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getGetTaxEstimateQueryOptions(params, options);
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & { queryKey: QueryKey };
  return { ...query, queryKey: queryOptions.queryKey };
}

export const getGetTaxSummaryUrl = (params?: GetTaxSummaryParams) => {
  const normalizedParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => { if (value !== undefined) normalizedParams.append(key, value === null ? "null" : value.toString()); });
  const stringifiedParams = normalizedParams.toString();
  const path = stringifiedParams.length > 0 ? `/api/tax/summary?${stringifiedParams}` : `/api/tax/summary`;
  return `${API_BASE}${path}`;
};
export const getTaxSummary = async (params?: GetTaxSummaryParams, options?: RequestInit): Promise<TaxSummary> => customFetch<TaxSummary>(getGetTaxSummaryUrl(params), { ...options, method: "GET" });
export const getGetTaxSummaryQueryKey = (params?: GetTaxSummaryParams) => [`/api/tax/summary`, ...(params ? [params] : [])] as const;
export const getGetTaxSummaryQueryOptions = <TData = Awaited<ReturnType<typeof getTaxSummary>>, TError = ErrorType<unknown>>(params?: GetTaxSummaryParams, options?: { query?: UseQueryOptions<Awaited<ReturnType<typeof getTaxSummary>>, TError, TData>; request?: SecondParameter<typeof customFetch>; }) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getGetTaxSummaryQueryKey(params);
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getTaxSummary>>> = ({ signal }) => getTaxSummary(params, { signal, ...requestOptions });
  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<Awaited<ReturnType<typeof getTaxSummary>>, TError, TData> & { queryKey: QueryKey };
};
export type GetTaxSummaryQueryResult = NonNullable<Awaited<ReturnType<typeof getTaxSummary>>>;
export type GetTaxSummaryQueryError = ErrorType<unknown>;
export function useGetTaxSummary<TData = Awaited<ReturnType<typeof getTaxSummary>>, TError = ErrorType<unknown>>(params?: GetTaxSummaryParams, options?: { query?: UseQueryOptions<Awaited<ReturnType<typeof getTaxSummary>>, TError, TData>; request?: SecondParameter<typeof customFetch>; }): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getGetTaxSummaryQueryOptions(params, options);
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & { queryKey: QueryKey };
  return { ...query, queryKey: queryOptions.queryKey };
}
