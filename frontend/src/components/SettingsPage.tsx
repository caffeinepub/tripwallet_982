import React, { useState } from "react";
import {
  useLastRateUpdate,
  useFetchExchangeRates,
  useApiKey,
  useSetApiKey,
  useDeleteApiKey,
  useExpensesEnabled,
} from "../hooks/useQueries";
import { formatDateTime } from "../utils/formatters";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import {
  CheckCircle2,
  AlertCircle,
  Key,
  Edit2,
  Trash2,
  Shield,
  ShieldOff,
  Loader2,
} from "lucide-react";

const validateApiKey = async (key: string): Promise<boolean> => {
  try {
    const response = await fetch(
      `https://api.fxratesapi.com/latest?api_key=${encodeURIComponent(key)}`,
    );
    if (response.status >= 500 && response.status < 600)
      throw new Error("Invalid API key.");
    const data = await response.json();
    return data.success === true;
  } catch {
    return false;
  }
};

export const SettingsPage: React.FC = () => {
  const { data: lastUpdate } = useLastRateUpdate();
  const { data: apiKey, isLoading: isLoadingApiKey } = useApiKey();
  const { data: expensesEnabled } = useExpensesEnabled();
  const fetchRates = useFetchExchangeRates();
  const setApiKeyMutation = useSetApiKey();
  const { mutate: deleteApiKey, isPending: isDeletingApiKey } =
    useDeleteApiKey();

  const [apiKeyInput, setApiKeyInput] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const hasApiKey = !!apiKey;

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) {
      setValidationError("Please enter an API key");
      return;
    }

    setIsValidating(true);
    setValidationError(null);
    setSuccessMessage(null);

    try {
      const isValid = await validateApiKey(apiKeyInput.trim());

      if (!isValid) {
        setValidationError(
          "Invalid API key. Please check your key and try again.",
        );
        setIsValidating(false);
        return;
      }

      await setApiKeyMutation.mutateAsync(apiKeyInput.trim());

      try {
        await fetchRates.mutateAsync();
        setSuccessMessage(
          "API key saved and exchange rates fetched successfully!",
        );
      } catch {
        setSuccessMessage(
          "API key saved. Exchange rates will be fetched shortly.",
        );
      }

      setApiKeyInput("");
      setIsEditing(false);
    } catch (error) {
      console.error({ error });
      setValidationError("Failed to save API key. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleEditApiKey = () => {
    setIsEditing(true);
    setApiKeyInput("");
    setValidationError(null);
    setSuccessMessage(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setApiKeyInput("");
    setValidationError(null);
  };

  const handleDeleteApiKey = () => {
    deleteApiKey(undefined, {
      onSuccess: () => {
        setSuccessMessage("API key deleted successfully.");
        setShowDeleteConfirm(false);
      },
      onError: () => {
        setValidationError("Failed to delete API key. Please try again.");
      },
    });
  };

  const handleRefreshRates = async () => {
    setIsRefreshing(true);
    setRefreshError(null);
    try {
      await fetchRates.mutateAsync();
      setLastRefresh(new Date());
    } catch {
      setRefreshError(
        "Failed to refresh exchange rates. Please check your API key.",
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-2xl font-semibold text-foreground tracking-tight">
        Settings
      </h2>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Tracking Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 rounded-lg border">
            {expensesEnabled ? (
              <>
                <div className="p-2 bg-chart-2/10 rounded-lg">
                  <Shield className="w-6 h-6 text-chart-2" />
                </div>
                <div>
                  <p className="font-semibold text-chart-2">Expenses Enabled</p>
                  <p className="text-sm text-muted-foreground">
                    You can create and track expenses
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="p-2 bg-accent rounded-lg">
                  <ShieldOff className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-accent-foreground">
                    Expenses Disabled
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Add an API key below to enable expense tracking
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* API Key Management Card */}
      <Card>
        <CardHeader>
          <CardTitle>Exchange Rate API Key</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              TripWallet uses{" "}
              <a
                href="https://fxratesapi.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                fxratesapi.com
              </a>{" "}
              for currency conversion. Get your free API key to enable expense
              tracking.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Note: fxratesapi may sometimes accept invalid keys temporarily,
              but a valid official API key from fxratesapi.com provides more
              stable and reliable service.
            </p>

            {isLoadingApiKey ? (
              <div className="p-4 bg-muted rounded-xl border border-border">
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            ) : hasApiKey && !isEditing ? (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-xl border border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Key className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground font-medium">
                          Current API Key
                        </p>
                        <p className="text-foreground font-mono font-semibold">
                          {apiKey}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleEditApiKey}
                    variant="outline"
                    className="flex-1"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Key
                  </Button>
                  <Button
                    onClick={() => setShowDeleteConfirm(true)}
                    variant="destructive"
                    className="flex-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Key
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {isEditing ? "New API Key" : "API Key"}
                  </label>
                  <Input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="Enter your fxratesapi.com API key"
                    className="font-mono"
                  />
                </div>

                {validationError && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                    <p className="text-sm text-destructive font-medium">
                      {validationError}
                    </p>
                  </div>
                )}

                {successMessage && (
                  <div className="p-3 bg-chart-2/10 border border-chart-2/20 rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-chart-2 shrink-0" />
                    <p className="text-sm text-chart-2 font-medium">
                      {successMessage}
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={handleSaveApiKey}
                    disabled={isValidating || !apiKeyInput.trim()}
                    className="flex-1"
                  >
                    {isValidating && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    {isValidating ? "Validating..." : "Save API Key"}
                  </Button>
                  {isEditing && (
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Exchange Rates Card - Only show when API key is configured */}
      {hasApiKey && (
        <Card>
          <CardHeader>
            <CardTitle>Exchange Rates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-xl border border-border">
                <p className="text-sm text-muted-foreground font-medium mb-1">
                  Last Updated
                </p>
                <p className="text-foreground font-semibold">
                  {lastUpdate && lastUpdate > 0n
                    ? formatDateTime(lastUpdate)
                    : "Never"}
                </p>
                {lastRefresh && (
                  <p className="text-sm text-chart-2 mt-2 flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    Refreshed {lastRefresh.toLocaleTimeString()}
                  </p>
                )}
                {refreshError && (
                  <p className="text-sm text-destructive mt-2 flex items-center gap-1.5 font-medium">
                    <AlertCircle className="w-4 h-4" />
                    {refreshError}
                  </p>
                )}
              </div>

              <Button
                onClick={handleRefreshRates}
                disabled={isRefreshing}
                className="w-full"
              >
                {isRefreshing && <Loader2 className="h-4 w-4 animate-spin" />}
                {isRefreshing ? "Refreshing..." : "Refresh Exchange Rates"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>About TripWallet</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            TripWallet helps you track travel expenses in multiple currencies
            with automatic conversion. All data is stored securely on the
            Internet Computer blockchain.
          </p>
        </CardContent>
      </Card>

      <AlertDialog
        open={showDeleteConfirm}
        onOpenChange={(open) => {
          if (!open && !isDeletingApiKey) setShowDeleteConfirm(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete your API key? This will disable
              expense tracking until you add a new key.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingApiKey}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteApiKey();
              }}
              disabled={isDeletingApiKey}
            >
              {isDeletingApiKey && <Loader2 className="h-4 w-4 animate-spin" />}
              {isDeletingApiKey ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
