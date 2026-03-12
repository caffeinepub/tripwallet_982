import React, { useState, useEffect } from "react";
import {
  useActiveTrip,
  useAddExpense,
  useUpdateExpense,
  useExpenses,
  useExchangeRates,
  useAvailableCurrencies,
} from "../hooks/useQueries";
import { CATEGORIES } from "../constants";
import { convertCurrency, formatCurrency } from "../utils/exchangeRates";
import {
  getTodayLocalDate,
  localDateStringToNanoseconds,
  nanosecondsToLocalDateString,
} from "../utils/formatters";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpenseModalProps {
  expenseId?: bigint;
  onClose: () => void;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  expenseId,
  onClose,
}) => {
  const { data: activeTrip } = useActiveTrip();
  const { data: expenses } = useExpenses(activeTrip?.id);
  const { data: rates } = useExchangeRates();
  const { currencies } = useAvailableCurrencies();
  const addExpense = useAddExpense();
  const updateExpense = useUpdateExpense();

  const existingExpense = expenses?.find((e) => e.id === expenseId);

  const [amount, setAmount] = useState(
    existingExpense ? String(existingExpense.amount) : "",
  );
  const [currency, setCurrency] = useState(
    existingExpense?.localCurrency || activeTrip?.primaryCurrency || "USD",
  );
  const [category, setCategory] = useState(existingExpense?.category || "food");
  const [note, setNote] = useState(existingExpense?.note || "");
  const [date, setDate] = useState(
    existingExpense
      ? nanosecondsToLocalDateString(existingExpense.date)
      : getTodayLocalDate(),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync form state when expense data becomes available (for edit mode)
  useEffect(() => {
    if (expenseId !== undefined && expenses) {
      const expense = expenses.find((e) => e.id === expenseId);
      if (expense) {
        setAmount(String(expense.amount));
        setCurrency(expense.localCurrency);
        setCategory(expense.category);
        setNote(expense.note || "");
        setDate(nanosecondsToLocalDateString(expense.date));
      }
    }
  }, [expenseId, expenses]);

  const ratesMap: Record<string, number> = {};
  rates?.forEach((r) => {
    ratesMap[r.code] = Number(r.rate);
  });

  const convertedAmount =
    amount && activeTrip
      ? convertCurrency(
          Number(amount),
          currency,
          activeTrip.primaryCurrency,
          ratesMap,
        )
      : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null); // Clear any previous errors

    if (!activeTrip || !amount) {
      setErrorMessage(
        "Missing required information. Please ensure you have an active trip and amount.",
      );
      return;
    }

    try {
      const dateNano = localDateStringToNanoseconds(date);

      if (expenseId !== undefined) {
        await updateExpense.mutateAsync({
          id: expenseId,
          amount: Number(amount),
          localCurrency: currency,
          category,
          note,
          date: dateNano,
        });
      } else {
        await addExpense.mutateAsync({
          tripId: activeTrip.id,
          amount: Number(amount),
          localCurrency: currency,
          category,
          note,
          date: dateNano,
        });
      }
      onClose();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      setErrorMessage(`Failed to save expense: ${errorMsg}`);
    }
  };

  if (!activeTrip) return null;

  return (
    <Dialog
      open={true}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {expenseId !== undefined ? "Edit Expense" : "Add Expense"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="amount" className="mb-2">
              Amount
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              className="font-mono"
            />
          </div>

          <div>
            <Label htmlFor="currency" className="mb-2">
              Currency
            </Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {currency !== activeTrip.primaryCurrency && amount && (
            <div className="p-3 bg-accent border border-primary/20 rounded-xl flex items-center gap-2 animate-fade-in">
              <Info className="w-4 h-4 text-primary shrink-0" />
              <p className="text-sm text-accent-foreground font-medium">
                ≈{" "}
                <span className="font-mono">
                  {formatCurrency(convertedAmount, activeTrip.primaryCurrency)}
                </span>
              </p>
            </div>
          )}

          <div>
            <Label className="mb-3">Category</Label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={cn(
                      "p-3 rounded-xl border-2 transition-all duration-200",
                      category === cat.id
                        ? "border-primary bg-accent shadow-sm"
                        : "border-border hover:border-input hover:bg-muted",
                    )}
                  >
                    <Icon
                      className="w-6 h-6 mx-auto mb-1 transition-transform duration-200 hover:scale-110"
                      style={{ color: cat.color }}
                    />
                    <div className="text-xs font-medium text-foreground">
                      {cat.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label htmlFor="note" className="mb-2">
              Note (Optional)
            </Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="What was this for?"
              className="resize-none"
            />
          </div>

          <div>
            <Label htmlFor="date" className="mb-2">
              Date
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {errorMessage && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
              <p className="text-sm text-destructive font-medium">
                {errorMessage}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" onClick={onClose} variant="outline">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addExpense.isPending || updateExpense.isPending}
            >
              {(addExpense.isPending || updateExpense.isPending) && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {expenseId !== undefined ? "Update" : "Add"} Expense
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
