import React, { useState } from "react";
import { useCreateTrip, useAvailableCurrencies } from "../hooks/useQueries";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TripModalProps {
  onClose: () => void;
}

export const TripModal: React.FC<TripModalProps> = ({ onClose }) => {
  const createTrip = useCreateTrip();
  const { currencies } = useAvailableCurrencies();

  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [budget, setBudget] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !budget) return;

    try {
      await createTrip.mutateAsync({
        name,
        primaryCurrency: currency,
        budgetLimit: Number(budget),
      });
      // Cache is updated inside mutationFn before this resolves
      onClose();
    } catch (error) {
      // Error handled silently
    }
  };

  return (
    <Dialog
      open={true}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Trip</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="trip-name" className="mb-2">
              Trip Name
            </Label>
            <Input
              id="trip-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Japan 2026"
              required
            />
          </div>

          <div>
            <Label htmlFor="currency" className="mb-2">
              Primary Currency
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

          <div>
            <Label htmlFor="budget" className="mb-2">
              Budget Limit
            </Label>
            <Input
              id="budget"
              type="number"
              step="0.01"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="0.00"
              required
              className="font-mono"
            />
          </div>

          <DialogFooter>
            <Button type="button" onClick={onClose} variant="outline">
              Cancel
            </Button>
            <Button type="submit" disabled={createTrip.isPending}>
              {createTrip.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {createTrip.isPending ? "Creating..." : "Create Trip"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
