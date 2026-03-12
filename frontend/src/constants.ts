import {
  UtensilsCrossed,
  Car,
  Hotel,
  Ticket,
  ShoppingBag,
  Package,
  Home,
  Coins,
  Plane,
  Settings,
} from "lucide-react";

export const CATEGORIES = [
  { id: "food", label: "Food", icon: UtensilsCrossed, color: "#EF4444" },
  { id: "transport", label: "Transport", icon: Car, color: "#F59E0B" },
  {
    id: "accommodation",
    label: "Accommodation",
    icon: Hotel,
    color: "#8B5CF6",
  },
  {
    id: "entertainment",
    label: "Entertainment",
    icon: Ticket,
    color: "#EC4899",
  },
  { id: "shopping", label: "Shopping", icon: ShoppingBag, color: "#10B981" },
  { id: "other", label: "Other", icon: Package, color: "#6B7280" },
];

export type TabId = "dashboard" | "expenses" | "trips" | "settings";

export const TABS = [
  { id: "dashboard" as TabId, label: "Dashboard", icon: Home },
  { id: "expenses" as TabId, label: "Expenses", icon: Coins },
  { id: "trips" as TabId, label: "Trips", icon: Plane },
  { id: "settings" as TabId, label: "Settings", icon: Settings },
];

export const POPULAR_CURRENCIES = [
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
  "SGD",
  "HKD",
  "KRW",
  "THB",
  "NZD",
  "AED",
  "ZAR",
  "SEK",
  "NOK",
  "DKK",
  "PLN",
  "CZK",
  "HUF",
  "TRY",
  "BRL",
  "ARS",
  "COP",
  "PEN",
  "CLP",
  "PHP",
  "MYR",
  "IDR",
  "VND",
  "TWD",
];
