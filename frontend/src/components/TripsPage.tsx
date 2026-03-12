import React, { useState } from "react";
import { useTrips, useDeleteTrip } from "../hooks/useQueries";
import { formatCurrency } from "../utils/exchangeRates";
import { formatDate } from "../utils/formatters";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "./shared/EmptyState";
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
import { Badge } from "@/components/ui/badge";
import { Plus, Plane, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface TripsPageProps {
  onCreateTrip: () => void;
}

export const TripsPage: React.FC<TripsPageProps> = ({ onCreateTrip }) => {
  const { data: trips } = useTrips();
  const { mutate: deleteTrip, isPending: isDeletingTrip } = useDeleteTrip();
  const [deleteId, setDeleteId] = useState<bigint | null>(null);

  const handleDeleteClick = (id: bigint) => {
    setDeleteId(id);
  };

  const handleConfirmDelete = () => {
    if (deleteId === null) return;
    deleteTrip(deleteId, {
      onSuccess: () => {
        toast.success("Trip deleted");
        setDeleteId(null);
      },
      onError: () => toast.error("Failed to delete trip"),
    });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-foreground tracking-tight">
          My Trips
        </h2>
        <Button onClick={onCreateTrip}>
          <Plus className="w-4 h-4" />
          Create Trip
        </Button>
      </div>

      {!trips || trips.length === 0 ? (
        <EmptyState
          icon={<Plane className="w-12 h-12" />}
          title="No trips yet"
          description="Create your first trip to start tracking your travel expenses"
          action={{
            label: "Create Your First Trip",
            onClick: onCreateTrip,
          }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {trips.map((trip, index) => (
            <Card
              key={trip.id.toString()}
              className="group animate-slide-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardHeader>
                <CardTitle>{trip.name}</CardTitle>
                {trip.isActive && (
                  <Badge variant="default" className="w-fit">
                    Active Trip
                  </Badge>
                )}
                <CardAction>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClick(trip.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Currency:</span>
                  <span className="font-semibold">{trip.primaryCurrency}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Budget:</span>
                  <span className="font-mono font-semibold">
                    {formatCurrency(trip.budgetLimit, trip.primaryCurrency)}
                  </span>
                </div>
                {trip.startDate !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Start:</span>
                    <span>{formatDate(trip.startDate)}</span>
                  </div>
                )}
                {trip.endDate !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">End:</span>
                    <span>{formatDate(trip.endDate)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open && !isDeletingTrip) setDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Trip</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This will delete the trip and all its expenses. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingTrip}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
              disabled={isDeletingTrip}
            >
              {isDeletingTrip && <Loader2 className="h-4 w-4 animate-spin" />}
              {isDeletingTrip ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
