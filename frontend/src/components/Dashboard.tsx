import React from "react";
import {
  useActiveTrip,
  useTripSummary,
  useExpenses,
  useTrips,
  useSetActiveTrip,
} from "../hooks/useQueries";
import { formatCurrency } from "../utils/exchangeRates";
import { formatDate } from "../utils/formatters";
import { CATEGORIES } from "../constants";
import { EmptyState } from "./shared/EmptyState";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Plane,
  AlertTriangle,
  Plus,
  Package,
  Check,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface DashboardProps {
  onAddExpense: () => void;
  onCreateTrip: () => void;
  expensesEnabled: boolean;
  onGoToSettings: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onAddExpense,
  onCreateTrip,
  expensesEnabled,
  onGoToSettings,
}) => {
  const { data: activeTrip } = useActiveTrip();
  const { data: summary } = useTripSummary(activeTrip?.id);
  const { data: expenses } = useExpenses(activeTrip?.id);
  const { data: trips } = useTrips();
  const setActiveTripMutation = useSetActiveTrip();

  const handleTripSelect = (tripId: bigint) => {
    setActiveTripMutation.mutate(tripId, {
      onError: () => toast.error("Failed to switch trip"),
    });
  };

  if (!activeTrip) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>My Trips</CardTitle>
            <CardAction>
              <Button onClick={onCreateTrip} size="sm">
                <Plus className="w-4 h-4" />
                Create Trip
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={<Plane className="w-12 h-12" />}
              title="No Trips Yet"
              description="Create your first trip to start tracking expenses"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const percentUsed = summary?.percentUsed || 0;

  const recentExpenses = expenses?.slice(0, 5) || [];

  return (
    <div className="space-y-4 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle>My Trips</CardTitle>
          <CardAction>
            <Button onClick={onCreateTrip} size="sm">
              <Plus className="w-4 h-4" />
              Create Trip
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trips?.map((trip) => (
              <button
                key={trip.id.toString()}
                onClick={() => handleTripSelect(trip.id)}
                className={cn(
                  "text-left p-4 rounded-lg border-2 transition-colors",
                  activeTrip?.id === trip.id
                    ? "border-primary bg-accent"
                    : "border-border hover:bg-muted",
                )}
              >
                <div className="flex items-center justify-between mb-2 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Plane className="w-5 h-5 text-primary shrink-0" />
                    <h3 className="font-semibold truncate">{trip.name}</h3>
                  </div>
                  {activeTrip?.id === trip.id && (
                    <Check className="w-5 h-5 text-primary shrink-0" />
                  )}
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    Budget:{" "}
                    <span className="font-mono">
                      {formatCurrency(trip.budgetLimit, trip.primaryCurrency)}
                    </span>
                  </p>
                  <p>
                    Currency:{" "}
                    <span className="font-medium">{trip.primaryCurrency}</span>
                  </p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{activeTrip.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="space-y-1 pt-4">
                <p className="text-sm text-muted-foreground font-medium">
                  Budget
                </p>
                <p className="text-xl font-mono font-semibold truncate">
                  {formatCurrency(
                    activeTrip.budgetLimit,
                    activeTrip.primaryCurrency,
                  )}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-1 pt-4">
                <p className="text-sm text-muted-foreground font-medium">
                  Spent
                </p>
                <p className="text-xl font-mono font-semibold truncate">
                  {formatCurrency(
                    summary?.totalSpent || 0,
                    activeTrip.primaryCurrency,
                  )}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-1 pt-4">
                <p className="text-sm text-muted-foreground font-medium">
                  Remaining
                </p>
                <p
                  className={cn(
                    "text-xl font-mono font-semibold truncate",
                    summary && summary.remaining < 0
                      ? "text-destructive"
                      : "text-chart-2",
                  )}
                >
                  {formatCurrency(
                    summary?.remaining || activeTrip.budgetLimit,
                    activeTrip.primaryCurrency,
                  )}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground font-medium">
                Budget Used
              </span>
              <span className="font-mono font-semibold">
                {percentUsed.toFixed(1)}%
              </span>
            </div>
            <Progress
              value={Math.min(percentUsed, 100)}
              className="bg-secondary"
            />
          </div>

          {percentUsed > 100 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <p>
                  You've exceeded your budget by{" "}
                  <span className="font-mono">
                    {formatCurrency(
                      Math.abs(summary?.remaining || 0),
                      activeTrip.primaryCurrency,
                    )}
                  </span>
                </p>
              </AlertDescription>
            </Alert>
          )}
          {percentUsed > 80 && percentUsed <= 100 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <p>
                  You've used{" "}
                  <span className="font-mono">{percentUsed.toFixed(1)}%</span>{" "}
                  of your budget
                </p>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {summary && summary.expensesByCategory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.expensesByCategory.map(([category, amount]) => {
                const categoryData = CATEGORIES.find((c) => c.id === category);
                const percentage =
                  (Number(amount) / Number(summary.totalSpent)) * 100;
                const Icon = categoryData?.icon;

                return (
                  <div key={category} className="space-y-2">
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-3">
                        {Icon && typeof Icon === "function" ? (
                          <Icon
                            className="w-5 h-5 shrink-0"
                            style={{ color: categoryData?.color }}
                          />
                        ) : (
                          <Package className="w-5 h-5 shrink-0" />
                        )}
                        <span className="text-sm font-medium">
                          {categoryData?.label || category}
                        </span>
                      </div>
                      <span className="text-sm font-mono font-semibold">
                        {formatCurrency(
                          Number(amount),
                          activeTrip.primaryCurrency,
                        )}
                      </span>
                    </div>
                    <Progress
                      value={percentage}
                      className="bg-secondary [&>[data-slot=progress-indicator]]:bg-[var(--category-color)]"
                      style={
                        {
                          "--category-color":
                            categoryData?.color ?? "var(--primary)",
                        } as React.CSSProperties
                      }
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
          <CardAction>
            {expensesEnabled ? (
              <Button onClick={onAddExpense} size="sm">
                <Plus className="w-4 h-4" />
                Add Expense
              </Button>
            ) : (
              <Button onClick={onGoToSettings} variant="outline" size="sm">
                <Settings className="w-4 h-4" />
                Setup API Key
              </Button>
            )}
          </CardAction>
        </CardHeader>
        <CardContent>
          {!expensesEnabled && recentExpenses.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-3">
                Configure your API key in Settings to enable expense tracking.
              </p>
              <Button onClick={onGoToSettings} size="sm">
                <Settings className="w-4 h-4" />
                Go to Settings
              </Button>
            </div>
          ) : recentExpenses.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">
              No expenses yet. Add your first expense to start tracking!
            </p>
          ) : (
            <div className="space-y-2">
              {recentExpenses.map((expense) => {
                const categoryData = CATEGORIES.find(
                  (c) => c.id === expense.category,
                );
                const Icon = categoryData?.icon;
                return (
                  <div
                    key={expense.id.toString()}
                    className="flex items-start gap-3 p-3 rounded-lg border"
                  >
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
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <p className="font-semibold">
                            {categoryData?.label || expense.category}
                          </p>
                          {expense.note && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {expense.note}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(expense.date)}
                          </p>
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
                            <p className="text-xs text-muted-foreground font-mono">
                              {formatCurrency(
                                Number(expense.amount),
                                expense.localCurrency,
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
