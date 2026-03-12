import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<HttpHeader>;
}
export interface Trip {
    id: bigint;
    primaryCurrency: string;
    endDate?: Time;
    name: string;
    createdAt: Time;
    isActive: boolean;
    budgetLimit: number;
    startDate?: Time;
}
export type Time = bigint;
export interface TransformationInput {
    context: Uint8Array;
    response: HttpRequestResult;
}
export interface HttpRequestResult {
    status: bigint;
    body: Uint8Array;
    headers: Array<HttpHeader>;
}
export interface ExchangeRate {
    code: string;
    rate: number;
    lastUpdated: Time;
}
export interface TripSummary {
    expensesByCategory: Array<[string, number]>;
    expenseCount: bigint;
    trip: Trip;
    totalSpent: number;
    percentUsed: number;
    remaining: number;
}
export interface Expense {
    id: bigint;
    localCurrency: string;
    convertedAmount: number;
    date: Time;
    note: string;
    createdAt: Time;
    tripId: bigint;
    conversionRate: number;
    category: string;
    amount: number;
}
export interface HttpHeader {
    value: string;
    name: string;
}
export interface backendInterface {
    addExpense(tripId: bigint, amount: number, localCurrency: string, category: string, note: string, date: Time): Promise<bigint>;
    createTrip(name: string, primaryCurrency: string, budgetLimit: number, startDate: Time | null, endDate: Time | null): Promise<bigint>;
    deleteApiKey(): Promise<boolean>;
    deleteExpense(id: bigint): Promise<boolean>;
    deleteTrip(id: bigint): Promise<boolean>;
    fetchAndStoreExchangeRates(): Promise<boolean>;
    getActiveTrip(): Promise<Trip | null>;
    getAllTrips(): Promise<Array<Trip>>;
    getApiKey(): Promise<string | null>;
    getAvailableCurrencies(): Promise<Array<string>>;
    getExchangeRates(): Promise<Array<ExchangeRate>>;
    getExpense(id: bigint): Promise<Expense | null>;
    getExpensesByCategory(tripId: bigint): Promise<Array<[string, number]>>;
    getExpensesEnabled(): Promise<boolean>;
    getExpensesForTrip(tripId: bigint): Promise<Array<Expense>>;
    getLastRateUpdate(): Promise<Time>;
    getTrip(id: bigint): Promise<Trip | null>;
    getTripSummary(tripId: bigint): Promise<TripSummary>;
    setActiveTrip(id: bigint): Promise<Trip>;
    setApiKey(key: string): Promise<boolean>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateExchangeRates(rates: Array<[string, number]>): Promise<boolean>;
    updateExpense(id: bigint, amount: number, localCurrency: string, category: string, note: string, date: Time): Promise<Expense>;
    updateTrip(id: bigint, name: string, primaryCurrency: string, budgetLimit: number, startDate: Time | null, endDate: Time | null): Promise<Trip>;
}
