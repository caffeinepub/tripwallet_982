# TripWallet

## Overview

TripWallet is a travel budget tracking application that enables users to manage expenses across multiple trips with automatic currency conversion. The application provides stress-free tracking of spending in a single reference currency, regardless of where the expense was incurred. Designed for travelers, it automatically converts local currency expenses into a primary trip currency and helps users stay within predefined budget limits.

## Authentication System

- Users must authenticate using Internet Identity before accessing the application
- Login panel displayed as the primary interface on application load
- Single-user mode - each authenticated user has their own isolated data
- All operations require authentication with anonymous principals rejected
- No guest access - authentication mandatory for all features

## User Access

- Each user has full control over their own trips and expenses
- Data is isolated per principal - no cross-user data sharing
- Users can create multiple trips and track expenses for each separately
- One active trip at a time for streamlined expense tracking

## Core Features

### Authentication Flow

- Login panel displayed on application load
- Main application interface accessible only after Internet Identity authentication
- Logout functionality returns user to login panel
- All backend operations check authentication and trap if user is anonymous

### Trip Management

- Create new trips with name, primary currency, and budget limit
- View all trips in grid layout with active trip selection
- Delete trips (cascades to delete all associated expenses)
- Set active trip for quick expense logging
- Switch between trips using trip selector
- Trip details include:
  - Unique trip name (e.g., "Japan 2026")
  - Primary currency (ISO 4217 code: USD, EUR, JPY, etc.)
  - Budget limit in primary currency
  - Active status indicator

### Expense Tracking

- Log expenses with amount, local currency, category, note, and date
- Six expense categories with emoji icons:
  - 🍔 Food (red)
  - 🚕 Transport (amber)
  - 🏨 Accommodation (purple)
  - 🎭 Entertainment (pink)
  - 🛍️ Shopping (green)
  - 📦 Other (gray)
- Automatic currency conversion from local currency to trip currency
- Conversion rate stored with expense for historical accuracy
- Edit existing expenses (recalculates conversion)
- Delete expenses with confirmation
- View expenses sorted by date (newest first)

### Budget Dashboard

- Real-time budget overview showing:
  - Total budget limit
  - Total spent (sum of converted expenses)
  - Remaining budget
  - Budget usage percentage
- Visual progress bar with color coding:
  - Green (0-80%): healthy budget usage
  - Amber (80-100%): approaching limit warning
  - Red (>100%): over-budget alert
- Category breakdown showing spending per category with icons and progress bars
- Recent expenses list (last 5 expenses)
- Quick "Add Expense" button for fast entry

### Exchange Rate Management

- Support for 100+ currencies via fxratesapi.com API
- Users must provide their own API key from fxratesapi.com
- API key stored securely per user in backend canister
- Backend makes HTTP outcalls directly to fetch exchange rates
- All rates relative to USD as base currency
- Exchange rate features:
  - Users must configure API key in Settings before using expense tracking
  - Automatic validation of API key on first fetch
  - Manual refresh button in settings
  - Last update timestamp display
  - Expenses enabled only after successful API key validation
- Rates stored in backend for consistency across all users
- Historical expenses retain original conversion rates

### Settings & Data Management

- API key management:
  - Add/update fxratesapi.com API key
  - View masked API key (shows first 4 and last 4 characters)
  - Delete API key (disables expense tracking)
  - Test API key with exchange rate fetch
- Exchange rate management:
  - View last update timestamp
  - Manual refresh button (requires valid API key)
- Application information
- All data persisted on Internet Computer

## Backend Data Storage

### Data Models

**Trip:**

- ID (Nat)
- Name (Text)
- Primary Currency (Text - ISO 4217 code)
- Budget Limit (Float)
- Active Status (Bool - only one active at a time)
- Created timestamp (Time.Time)

**Expense:**

- ID (Nat)
- Trip ID (Nat - reference to parent trip)
- Amount (Float - in local currency)
- Local Currency (Text)
- Category (Text - food, transport, etc.)
- Note (Text - description)
- Date (Time.Time - when expense occurred)
- Converted Amount (Float - in trip's primary currency)
- Conversion Rate (Float - rate used for conversion)
- Created timestamp (Time.Time)

**Exchange Rate:**

- Code (Text - currency ISO code)
- Rate (Float - exchange rate relative to USD)
- Last Updated (Time.Time)

**UserData (per Principal):**

- Trips (Map<Nat, Trip> - user's trips)
- Expenses (Map<Nat, Expense> - user's expenses)
- Next Trip ID (Nat - auto-incrementing counter)
- Next Expense ID (Nat - auto-incrementing counter)
- API Key (?Text - user's fxratesapi.com API key)
- Expenses Enabled (Bool - true after successful API key validation)

**Trip Summary (computed):**

- Trip details
- Total Spent (Float - sum of converted expenses)
- Remaining (Float - budget limit - total spent)
- Percent Used (Float)
- Expense Count (Nat)
- Expenses by Category ([(Text, Float)])

### Storage Implementation

- Uses OrderedMap for efficient data storage and retrieval
- Transient OrderedMap instance for map operations
- Persistent storage for all trips, expenses, and exchange rates
- Auto-incrementing ID counters for each data type
- Principal-based user data isolation

## Backend Operations

### Authentication Operations

- `requireAuth(caller)`: Private function to validate authentication and retrieve user data
- All operations check authentication before execution
- Traps if principal is anonymous

### Trip Management Operations

- `createTrip(name, primaryCurrency, budgetLimit)`: Create new trip, returns trip ID
- `getAllTrips()`: Query operation returning array of all trips
- `getTrip(id)`: Query operation returning specific trip or null
- `updateTrip(id, name, primaryCurrency, budgetLimit)`: Update trip, returns updated trip
- `deleteTrip(id)`: Remove trip and associated expenses, returns boolean success
- `setActiveTrip(id)`: Set trip as active (deactivates others), returns trip
- `getActiveTrip()`: Query operation returning currently active trip or null

### Expense Management Operations

- `addExpense(tripId, amount, localCurrency, category, note, date)`: Create expense with auto-conversion, returns expense ID
- `getExpensesForTrip(tripId)`: Query operation returning array of expenses
- `getExpense(id)`: Query operation returning specific expense or null
- `updateExpense(id, amount, localCurrency, category, note, date)`: Update expense and recalculate conversion, returns updated expense
- `deleteExpense(id)`: Remove expense, returns boolean success
- `getExpensesByCategory(tripId)`: Query operation returning category totals

### Budget & Summary Operations

- `getTripSummary(tripId)`: Query operation returning comprehensive trip summary with spending breakdown

### API Key Management Operations

- `setApiKey(key)`: Store user's fxratesapi.com API key, returns boolean success
- `getApiKey()`: Query operation returning masked API key (first 4 and last 4 characters only)
- `deleteApiKey()`: Remove API key and disable expense tracking, returns boolean success
- `getExpensesEnabled()`: Query operation returning whether expenses are enabled (requires successful API key validation)

### Exchange Rate Operations

- `fetchAndStoreExchangeRates()`: Validates API key, makes HTTP outcall to fxratesapi.com, parses response, stores exchange rates with current timestamp, and enables expense tracking on success
- `getExchangeRates()`: Query operation returning all stored exchange rates
- `getLastRateUpdate()`: Query operation returning timestamp of last rate update

### Helper Functions

- `convertCurrency(amount, fromCurrency, toCurrency)`: Converts amount between currencies using stored rates, returns converted amount and conversion rate
- `calculateTripTotal(data, tripId)`: Calculates total spent for trip by summing converted expenses

## User Interface

### Layout Structure

Main application layout with fixed vertical sidebar navigation (desktop) and mobile menu.

**Desktop (md and above):**

- Fixed left sidebar (w-72) with:
  - App branding header with logo and tagline
  - Active trip display showing trip name, currency, and budget
  - Vertical navigation menu with 4 tabs:
    - Dashboard (🏠) - Budget overview
    - Expenses (💰) - Full expense list
    - Trips (✈️) - Trip management
    - Settings (⚙️) - Exchange rates and app info
  - Sign out button at bottom
- Content area with left margin to accommodate sidebar

**Mobile (below md):**

- Top header bar with app branding, active trip badge, and menu toggle
- Current tab indicator below header
- Slide-in menu overlay from right side
- Full-width content area

### Authentication Interface

- Login screen with Internet Identity button
- Centered card layout with app branding
- Travel-themed design with plane emoji
- Clean, welcoming design
- Powered by Internet Computer footer

### Dashboard View

- Trip selector showing all trips with active indicator
- Three-column budget statistics:
  - Budget limit
  - Total spent
  - Remaining budget
- Budget usage progress bar with color coding
- Budget warnings (amber/red alerts)
- Spending by category breakdown with icons and bars
- Recent expenses list (last 5)
- Quick "Add Expense" button

### Expense List View

- Page title with "Add Expense" button
- Expense cards showing:
  - Category icon and label
  - Note/description
  - Converted amount in trip currency
  - Original amount if different currency
  - Date
  - Edit and Delete buttons
- Empty state if no expenses

### Trip Management View

- Grid layout of trip cards (2 columns on desktop)
- Each card displays:
  - Trip name with active badge if applicable
  - Currency and budget information
  - Delete button
- "Create Trip" button in header
- Empty state with "Create Your First Trip" button when no trips exist

### Settings View

- API Key Management section:
  - Add/Update API key input field
  - Masked API key display (first 4 and last 4 characters)
  - Delete API key button
  - Save/Test API key button (validates by fetching rates)
- Exchange Rates section:
  - Last updated timestamp
  - Refresh button (requires valid API key)
  - API information
- App information section

### Interactive Elements

- Modal overlays for forms (backdrop dismissal)
- Loading states with disabled buttons
- Confirmation dialogs for destructive actions
- Real-time data updates using React Query
- Hover effects on interactive elements

## Frontend Components

### Expense Modal

- Add/edit expense form with:
  - Amount input (number)
  - Currency selector (popular currencies)
  - Live conversion preview
  - Category selector (6 category buttons with icons)
  - Note textarea
  - Date picker
  - Cancel and Save buttons

### Trip Modal

- Create trip form with:
  - Trip name input
  - Primary currency selector
  - Budget limit input
  - Cancel and Create buttons

### LoadingScreen

Loading indicator shown during authentication.

- Animated loading dots
- "Please wait a moment" message

## Design System

The app uses custom travel-\* color classes defined in the Tailwind config for consistent theming.

### Color Palette

- Primary: Amber (#F59E0B) - brand color for buttons, highlights, active states
- Navy: (#1E3A8A, #2563EB, #3B82F6) - text hierarchy, headers, dark elements
- Success: Sage Green (#10B981, #047857) - under budget indicators, positive states
- Warning: Amber (#F59E0B) - 80-100% budget usage warnings
- Danger: Red (#EF4444) - over budget alerts, delete actions
- Background: Warm gradient from amber-50 to stone-50
- Cards: White with travel-stone-200 borders
- Text: travel-navy-900 (headers), travel-navy-600 (body), travel-navy-500 (secondary)

### Typography

- Font family: System sans-serif (default Tailwind stack)
- Display/Headers: font-semibold (600) to font-bold (700)
- Body text: font-light (300) for better readability
- Emphasized text: font-medium (500)
- Currency amounts: font-mono font-semibold for prominence
- Size scales: text-xs (labels) to text-3xl (page titles)

### Spacing

- Consistent gap utilities: gap-2, gap-3, gap-4, gap-6
- Padding scales: p-3, p-4, p-5, p-6
- Margin classes: mb-2, mb-3, mb-4, mb-6 for vertical rhythm

### UI Components

- Cards: rounded-xl, shadow-soft, white background, border-travel-stone-200
- Buttons: rounded-lg, primary amber (travel-amber-500), hover states
- Inputs: rounded-md, border-travel-stone-300, focus:ring-travel-amber-500
- Progress bars: rounded-full, color gradient (green/amber/red), shadow-inner container
- Modals: fixed overlay with backdrop-blur, centered, rounded-xl, shadow-xl
- Category icons: sized appropriately with predefined category colors

### Category Colors

Current category color assignments:

- Food: #EF4444 (red)
- Transport: #F59E0B (amber)
- Accommodation: #8B5CF6 (purple)
- Entertainment: #EC4899 (pink)
- Shopping: #10B981 (green)
- Other: #6B7280 (gray)

## Mobile Responsive Design

- Full responsive layout using Tailwind breakpoints
- Grid layouts adapt to single column on mobile
- Tab navigation responsive on small screens
- Modal dialogs adapt to mobile screen sizes
- Touch-friendly button sizes
- Readable text scaling
- Cards stack vertically on mobile
- Forms optimize for mobile input

## State Management

- React hooks (useState) for local component state
- React Query (TanStack Query) for server state:
  - Automatic caching and refetching
  - Loading and error states
  - Mutation handling with optimistic updates
  - Query invalidation on mutations
- ic-use-internet-identity for authentication state
- No global state management needed

## Data Flow

- Frontend makes async calls to backend canister
- React Query manages loading, error, and success states
- Mutations trigger automatic refetch of affected queries
- Time conversions between JavaScript and Motoko timestamps
- BigInt handling for Motoko Nat types
- Currency conversion using stored exchange rates
- Exchange rates fetched from external API using user-provided API key
