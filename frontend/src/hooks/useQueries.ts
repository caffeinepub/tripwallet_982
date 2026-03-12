import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";
import type { Trip, Expense, TripSummary, ExchangeRate } from "../backend";
import { POPULAR_CURRENCIES } from "../constants";

// ==================== Trip Hooks ====================

export function useTrips() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString() ?? "anonymous";

  return useQuery<Trip[]>({
    queryKey: ["trips", principal],
    queryFn: async () => {
      if (!actor) {
        return [];
      }
      const trips = await actor.getAllTrips();
      return trips;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useActiveTrip() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString() ?? "anonymous";

  return useQuery<Trip | null>({
    queryKey: ["activeTrip", principal],
    queryFn: async () => {
      if (!actor) return null;
      const result = await actor.getActiveTrip();
      return result || null;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateTrip() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<
    bigint,
    Error,
    {
      name: string;
      primaryCurrency: string;
      budgetLimit: number;
      startDate?: bigint;
      endDate?: bigint;
    }
  >({
    mutationFn: async (data) => {
      if (!actor) throw new Error("Actor not available");
      const tripId = await actor.createTrip(
        data.name,
        data.primaryCurrency,
        data.budgetLimit,
        data.startDate !== undefined ? data.startDate : null,
        data.endDate !== undefined ? data.endDate : null,
      );

      // Set the new trip as active
      await actor.setActiveTrip(tripId);

      return tripId;
    },
    onSuccess: () => {
      // Invalidate queries to trigger refetch with correct principal-scoped keys
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["activeTrip"] });
    },
  });
}

export function useUpdateTrip() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<
    Trip,
    Error,
    {
      id: bigint;
      name: string;
      primaryCurrency: string;
      budgetLimit: number;
      startDate?: bigint;
      endDate?: bigint;
    }
  >({
    mutationFn: async (data) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateTrip(
        data.id,
        data.name,
        data.primaryCurrency,
        data.budgetLimit,
        data.startDate !== undefined ? data.startDate : null,
        data.endDate !== undefined ? data.endDate : null,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["activeTrip"] });
      queryClient.invalidateQueries({ queryKey: ["tripSummary"] });
    },
  });
}

export function useDeleteTrip() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, bigint>({
    mutationFn: async (id) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteTrip(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["activeTrip"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["tripSummary"] });
    },
  });
}

export function useSetActiveTrip() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString() ?? "anonymous";

  return useMutation<
    Trip,
    Error,
    bigint,
    { previousTrips?: Trip[]; previousActiveTrip?: Trip | null }
  >({
    mutationFn: async (id) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setActiveTrip(id);
    },
    onMutate: async (newActiveTripId) => {
      await queryClient.cancelQueries({ queryKey: ["trips", principal] });
      await queryClient.cancelQueries({ queryKey: ["activeTrip", principal] });

      const previousTrips = queryClient.getQueryData<Trip[]>([
        "trips",
        principal,
      ]);
      const previousActiveTrip = queryClient.getQueryData<Trip | null>([
        "activeTrip",
        principal,
      ]);

      const newActiveTrip =
        previousTrips?.find((t) => t.id === newActiveTripId) ?? null;

      if (previousTrips) {
        queryClient.setQueryData<Trip[]>(
          ["trips", principal],
          previousTrips.map((t) => ({
            ...t,
            isActive: t.id === newActiveTripId,
          })),
        );
      }

      if (newActiveTrip) {
        queryClient.setQueryData<Trip | null>(["activeTrip", principal], {
          ...newActiveTrip,
          isActive: true,
        });
      }

      return { previousTrips, previousActiveTrip };
    },
    onError: (_err, _id, context) => {
      if (context?.previousTrips) {
        queryClient.setQueryData(["trips", principal], context.previousTrips);
      }
      if (context?.previousActiveTrip !== undefined) {
        queryClient.setQueryData(
          ["activeTrip", principal],
          context.previousActiveTrip,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["activeTrip"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["tripSummary"] });
    },
  });
}

// ==================== Expense Hooks ====================

export function useExpenses(tripId: bigint | null | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<Expense[]>({
    queryKey: ["expenses", tripId?.toString()],
    queryFn: async () => {
      if (!actor || tripId === null || tripId === undefined) {
        return [];
      }

      const expenses = await actor.getExpensesForTrip(tripId);

      return expenses;
    },
    enabled: !!actor && !isFetching && tripId !== null && tripId !== undefined,
  });
}

export function useAddExpense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<
    bigint,
    Error,
    {
      tripId: bigint;
      amount: number;
      localCurrency: string;
      category: string;
      note: string;
      date: bigint;
    }
  >({
    mutationFn: async (data) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addExpense(
        data.tripId,
        data.amount,
        data.localCurrency,
        data.category,
        data.note,
        data.date,
      );
    },
    onSuccess: (expenseId, variables) => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["tripSummary"] });
      queryClient.invalidateQueries({ queryKey: ["expensesByCategory"] });

      // Manually refetch to ensure it happens
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["expenses"] });
        queryClient.refetchQueries({ queryKey: ["tripSummary"] });
      }, 100);
    },
  });
}

export function useUpdateExpense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<
    Expense,
    Error,
    {
      id: bigint;
      amount: number;
      localCurrency: string;
      category: string;
      note: string;
      date: bigint;
    }
  >({
    mutationFn: async (data) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateExpense(
        data.id,
        data.amount,
        data.localCurrency,
        data.category,
        data.note,
        data.date,
      );
    },
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["tripSummary"] });
      queryClient.invalidateQueries({ queryKey: ["expensesByCategory"] });
    },
  });
}

export function useDeleteExpense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, bigint>({
    mutationFn: async (id) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteExpense(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["tripSummary"] });
      queryClient.invalidateQueries({ queryKey: ["expensesByCategory"] });
    },
  });
}

export function useExpensesByCategory(tripId: bigint | null | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<[string, number][]>({
    queryKey: ["expensesByCategory", tripId?.toString()],
    queryFn: async () => {
      if (!actor || tripId === null || tripId === undefined) return [];
      return actor.getExpensesByCategory(tripId);
    },
    enabled: !!actor && !isFetching && tripId !== null && tripId !== undefined,
  });
}

// ==================== Summary Hooks ====================

export function useTripSummary(tripId: bigint | null | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<TripSummary | null>({
    queryKey: ["tripSummary", tripId?.toString()],
    queryFn: async () => {
      if (!actor || tripId === null || tripId === undefined) {
        return null;
      }
      const summary = await actor.getTripSummary(tripId);
      return summary;
    },
    enabled: !!actor && !isFetching && tripId !== null && tripId !== undefined,
  });
}

// ==================== Exchange Rate Hooks ====================

export function useExchangeRates() {
  const { actor, isFetching } = useActor();

  return useQuery<ExchangeRate[]>({
    queryKey: ["exchangeRates"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getExchangeRates();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateExchangeRates() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, Record<string, number>>({
    mutationFn: async (rates) => {
      if (!actor) throw new Error("Actor not available");
      const ratesArray = Object.entries(rates);
      return actor.updateExchangeRates(ratesArray);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exchangeRates"] });
    },
  });
}

export function useLastRateUpdate() {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ["lastRateUpdate"],
    queryFn: async () => {
      if (!actor) return 0n;
      return actor.getLastRateUpdate();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useFetchExchangeRates() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, void>({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.fetchAndStoreExchangeRates();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exchangeRates"] });
      queryClient.invalidateQueries({ queryKey: ["lastRateUpdate"] });
      queryClient.invalidateQueries({ queryKey: ["expensesEnabled"] });
      queryClient.invalidateQueries({ queryKey: ["availableCurrencies"] });
    },
  });
}

// ==================== API Key Hooks ====================

export function useApiKey() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString() ?? "anonymous";

  return useQuery<string | null>({
    queryKey: ["apiKey", principal],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getApiKey();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetApiKey() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, string>({
    mutationFn: async (key: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setApiKey(key);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apiKey"] });
    },
  });
}

export function useDeleteApiKey() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, void>({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteApiKey();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apiKey"] });
      queryClient.invalidateQueries({ queryKey: ["expensesEnabled"] });
    },
  });
}

export function useExpensesEnabled() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString() ?? "anonymous";

  return useQuery<boolean>({
    queryKey: ["expensesEnabled", principal],
    queryFn: async () => {
      if (!actor) return false;
      return actor.getExpensesEnabled();
    },
    enabled: !!actor && !isFetching,
  });
}

// ==================== Currency Hooks ====================

// Priority order for common currencies (shown first in dropdown)
const PRIORITY_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "AUD",
  "CAD",
  "CHF",
  "CNY",
  "INR",
  "MXN",
];

export function useAvailableCurrencies() {
  const { actor, isFetching } = useActor();

  const query = useQuery<string[]>({
    queryKey: ["availableCurrencies"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAvailableCurrencies();
    },
    enabled: !!actor && !isFetching,
  });

  // Sort currencies with priority ones first, then alphabetically
  const sortCurrencies = (currencies: string[]): string[] => {
    return [...currencies].sort((a, b) => {
      const aIdx = PRIORITY_CURRENCIES.indexOf(a);
      const bIdx = PRIORITY_CURRENCIES.indexOf(b);

      // Both are priority currencies - sort by priority order
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      // Only a is priority - a comes first
      if (aIdx !== -1) return -1;
      // Only b is priority - b comes first
      if (bIdx !== -1) return 1;
      // Neither is priority - sort alphabetically
      return a.localeCompare(b);
    });
  };

  // Use fetched currencies if available, otherwise fall back to static list
  const currencies =
    query.data && query.data.length > 0
      ? sortCurrencies(query.data)
      : POPULAR_CURRENCIES;

  return {
    currencies,
    isLoading: query.isLoading,
    isFromApi: query.data && query.data.length > 0,
  };
}
