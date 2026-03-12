import React, { useState } from "react";
import {
  useActiveTrip,
  useExpenses,
  useDeleteExpense,
} from "../hooks/useQueries";
import { formatCurrency } from "../utils/exchangeRates";
import { formatDate } from "../utils/formatters";
import { CATEGORIES } from "../constants";
import { EmptyState } from "./shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Coins,
  Edit2,
  Trash2,
  Plus,
  Package,
  Settings,
  Loader2,
} from "lucide-react";

interface ExpenseListPageProps {
  onAddExpense: () => void;
  onEditExpense: (expenseId: bigint) => void;
  expensesEnabled: boolean;
  onGoToSettings: () => void;
}

export const ExpenseListPage: React.FC<ExpenseListPageProps> = ({
  onAddExpense,
  onEditExpense,
  expensesEnabled,
  onGoToSettings,
}) => {
  const { data: activeTrip } = useActiveTrip();
  const { data: expenses } = useExpenses(activeTrip?.id);
  const { mutate: deleteExpense, isPending: isDeletingExpense } =
    useDeleteExpense();
  const [deleteId, setDeleteId] = useState<bigint | null>(null);

  const handleDeleteClick = (id: bigint) => {
    setDeleteId(id);
  };

  const handleConfirmDelete = () => {
    if (deleteId === null) return;
    deleteExpense(deleteId, {
      onSuccess: () => setDeleteId(null),
    });
  };

  if (!activeTrip) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">
          Select a trip to view expenses
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-foreground tracking-tight">
          Expenses
        </h2>
        {expensesEnabled ? (
          <Button onClick={onAddExpense}>
            <Plus className="w-4 h-4" />
            Add Expense
          </Button>
        ) : (
          <Button onClick={onGoToSettings} variant="outline">
            <Settings className="w-4 h-4" />
            Setup API Key
          </Button>
        )}
      </div>

      {!expenses || expenses.length === 0 ? (
        !expensesEnabled ? (
          <EmptyState
            icon={<Settings className="w-12 h-12" />}
            title="API Key Required"
            description="Configure your exchange rate API key in Settings to enable expense tracking"
            action={{
              label: "Go to Settings",
              onClick: onGoToSettings,
            }}
          />
        ) : (
          <EmptyState
            icon={<Coins className="w-12 h-12" />}
            title="No expenses yet"
            description="Start tracking your travel expenses by adding your first expense"
            action={{
              label: "Add Your First Expense",
              onClick: onAddExpense,
            }}
          />
        )
      ) : (
        <div className="space-y-2">
          {expenses.map((expense, index) => {
            const categoryData = CATEGORIES.find(
              (c) => c.id === expense.category,
            );
            const Icon = categoryData?.icon;
            return (
              <Card
                key={expense.id.toString()}
                className="animate-slide-in"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <CardContent className="flex items-start gap-3">
                  <div className="shrink-0 p-2 bg-muted rounded-lg">
                    {Icon && typeof Icon === "function" ? (
                      <Icon
                        className="w-5 h-5"
                        style={{ color: categoryData?.color }}
                      />
                    ) : (
                      <Package className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <h3 className="font-semibold">
                          {categoryData?.label || expense.category}
                        </h3>
                        {expense.note && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {expense.note}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono font-semibold">
                          {formatCurrency(
                            Number(expense.convertedAmount),
                            activeTrip.primaryCurrency,
                          )}
                        </p>
                        {expense.localCurrency !==
                          activeTrip.primaryCurrency && (
                          <p className="text-sm text-muted-foreground font-mono">
                            {formatCurrency(
                              Number(expense.amount),
                              expense.localCurrency,
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <p className="text-sm text-muted-foreground">
                        {formatDate(expense.date)}
                      </p>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditExpense(expense.id)}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(expense.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open && !isDeletingExpense) setDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingExpense}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
              disabled={isDeletingExpense}
            >
              {isDeletingExpense && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {isDeletingExpense ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
