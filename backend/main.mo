import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Nat32 "mo:core/Nat32";
import Nat64 "mo:core/Nat64";
import Int64 "mo:core/Int64";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Float "mo:core/Float";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Char "mo:core/Char";
import OutCall "http-outcalls/outcall";
import Error "mo:core/Error";

actor {
  // ==================== Type Definitions ====================

  type Trip = {
    id : Nat;
    name : Text;
    primaryCurrency : Text;
    budgetLimit : Float;
    isActive : Bool;
    startDate : ?Time.Time;
    endDate : ?Time.Time;
    createdAt : Time.Time;
  };

  type Expense = {
    id : Nat;
    tripId : Nat;
    amount : Float;
    localCurrency : Text;
    category : Text;
    note : Text;
    date : Time.Time;
    convertedAmount : Float;
    conversionRate : Float;
    createdAt : Time.Time;
  };

  type ExchangeRate = {
    code : Text;
    rate : Float;
    lastUpdated : Time.Time;
  };

  type TripSummary = {
    trip : Trip;
    totalSpent : Float;
    remaining : Float;
    percentUsed : Float;
    expenseCount : Nat;
    expensesByCategory : [(Text, Float)];
  };

  type UserData = {
    var trips : Map.Map<Nat, Trip>;
    var expenses : Map.Map<Nat, Expense>;
    var nextTripId : Nat;
    var nextExpenseId : Nat;
    var apiKey : ?Text;
    var expensesEnabled : Bool;
  };

  // ==================== Storage ====================

  var userData : Map.Map<Principal, UserData> = Map.empty<Principal, UserData>();
  var exchangeRates : Map.Map<Text, ExchangeRate> = Map.empty<Text, ExchangeRate>();
  var lastRateUpdate : Time.Time = 0;

  // ==================== Helper Functions ====================

  func requireAuth(caller : Principal) : UserData {
    if (caller.isAnonymous()) {
      Runtime.trap("Authentication required. Please log in.");
    };

    switch (userData.get(caller)) {
      case (null) {
        let newUserData : UserData = {
          var trips = Map.empty<Nat, Trip>();
          var expenses = Map.empty<Nat, Expense>();
          var nextTripId = 0;
          var nextExpenseId = 0;
          var apiKey = null;
          var expensesEnabled = false;
        };
        userData.add(caller, newUserData);
        newUserData;
      };
      case (?data) {
        data;
      };
    };
  };

  func convertCurrency(
    amount : Float,
    fromCurrency : Text,
    toCurrency : Text,
  ) : (Float, Float) {
    if (fromCurrency == toCurrency) {
      return (amount, 1.0);
    };

    let fromRate = switch (exchangeRates.get(fromCurrency)) {
      case (?rate) { rate.rate };
      case (null) { 1.0 };
    };

    let toRate = switch (exchangeRates.get(toCurrency)) {
      case (?rate) { rate.rate };
      case (null) { 1.0 };
    };

    let conversionRate = toRate / fromRate;
    let convertedAmount = amount * conversionRate;

    (convertedAmount, conversionRate);
  };

  func calculateTripTotal(data : UserData, tripId : Nat) : Float {
    var total : Float = 0.0;
    let expenses = data.expenses.values().toArray();
    for (expense in expenses.vals()) {
      if (expense.tripId == tripId) {
        total += expense.convertedAmount;
      };
    };
    total;
  };

  // ==================== Trip Management Operations ====================

  public shared ({ caller }) func createTrip(
    name : Text,
    primaryCurrency : Text,
    budgetLimit : Float,
    startDate : ?Time.Time,
    endDate : ?Time.Time,
  ) : async Nat {
    let data = requireAuth(caller);
    let tripId = data.nextTripId;
    data.nextTripId += 1;

    let trip : Trip = {
      id = tripId;
      name;
      primaryCurrency;
      budgetLimit;
      isActive = false;
      startDate;
      endDate;
      createdAt = Time.now();
    };

    data.trips.add(tripId, trip);

    // Explicitly update userData to trigger persistence
    userData.add(caller, data);

    tripId;
  };

  public query ({ caller }) func getAllTrips() : async [Trip] {
    let data = requireAuth(caller);
    let trips = data.trips.values().toArray();
    let sortedTrips = trips.sort(
      func(a, b) {
        if (a.createdAt > b.createdAt) { #less } else if (a.createdAt < b.createdAt) {
          #greater;
        } else { #equal };
      }
    );
    sortedTrips;
  };

  public query ({ caller }) func getTrip(id : Nat) : async ?Trip {
    let data = requireAuth(caller);
    data.trips.get(id);
  };

  public shared ({ caller }) func updateTrip(
    id : Nat,
    name : Text,
    primaryCurrency : Text,
    budgetLimit : Float,
    startDate : ?Time.Time,
    endDate : ?Time.Time,
  ) : async Trip {
    let data = requireAuth(caller);

    switch (data.trips.get(id)) {
      case (null) { Runtime.trap("Trip not found") };
      case (?trip) {
        let updatedTrip : Trip = {
          id = trip.id;
          name;
          primaryCurrency;
          budgetLimit;
          isActive = trip.isActive;
          startDate;
          endDate;
          createdAt = trip.createdAt;
        };
        data.trips.add(id, updatedTrip);

        // Explicitly update userData to trigger persistence
        userData.add(caller, data);

        updatedTrip;
      };
    };
  };

  public shared ({ caller }) func deleteTrip(id : Nat) : async Bool {
    let data = requireAuth(caller);

    if (not data.trips.containsKey(id)) { Runtime.trap("Trip not found") };

    // Delete trip
    data.trips.remove(id);

    // Delete all expenses for this trip
    let allExpenses = data.expenses.values().toArray();
    for (expense in allExpenses.vals()) {
      if (expense.tripId == id) {
        data.expenses.remove(expense.id);
      };
    };

    // Explicitly update userData to trigger persistence
    userData.add(caller, data);

    true;
  };

  public shared ({ caller }) func setActiveTrip(id : Nat) : async Trip {
    let data = requireAuth(caller);

    switch (data.trips.get(id)) {
      case (null) { Runtime.trap("Trip not found") };
      case (?trip) {
        // Deactivate all trips
        let allTrips = data.trips.values().toArray();
        for (existingTrip in allTrips.vals()) {
          if (existingTrip.isActive) {
            let deactivatedTrip : Trip = {
              id = existingTrip.id;
              name = existingTrip.name;
              primaryCurrency = existingTrip.primaryCurrency;
              budgetLimit = existingTrip.budgetLimit;
              isActive = false;
              startDate = existingTrip.startDate;
              endDate = existingTrip.endDate;
              createdAt = existingTrip.createdAt;
            };
            data.trips.add(existingTrip.id, deactivatedTrip);
          };
        };

        // Activate selected trip
        let activatedTrip : Trip = {
          id = trip.id;
          name = trip.name;
          primaryCurrency = trip.primaryCurrency;
          budgetLimit = trip.budgetLimit;
          isActive = true;
          startDate = trip.startDate;
          endDate = trip.endDate;
          createdAt = trip.createdAt;
        };
        data.trips.add(id, activatedTrip);

        // Explicitly update userData to trigger persistence
        userData.add(caller, data);

        activatedTrip;
      };
    };
  };

  public query ({ caller }) func getActiveTrip() : async ?Trip {
    let data = requireAuth(caller);
    let allTrips = data.trips.values().toArray();
    for (trip in allTrips.vals()) {
      if (trip.isActive) {
        return ?trip;
      };
    };
    null;
  };

  // ==================== Expense Management Operations ====================

  public shared ({ caller }) func addExpense(
    tripId : Nat,
    amount : Float,
    localCurrency : Text,
    category : Text,
    note : Text,
    date : Time.Time,
  ) : async Nat {
    let data = requireAuth(caller);

    // Verify trip exists and get primary currency
    let trip = switch (data.trips.get(tripId)) {
      case (null) {
        Runtime.trap("Trip not found");
      };
      case (?t) {
        t;
      };
    };

    // Convert currency
    let (convertedAmount, conversionRate) = convertCurrency(amount, localCurrency, trip.primaryCurrency);

    let expenseId = data.nextExpenseId;
    data.nextExpenseId += 1;

    let expense : Expense = {
      id = expenseId;
      tripId;
      amount;
      localCurrency;
      category;
      note;
      date;
      convertedAmount;
      conversionRate;
      createdAt = Time.now();
    };

    data.expenses.add(expenseId, expense);

    // Explicitly update userData to trigger persistence
    userData.add(caller, data);

    expenseId;
  };

  public query ({ caller }) func getExpensesForTrip(tripId : Nat) : async [Expense] {
    let data = requireAuth(caller);
    let allExpenses = data.expenses.values().toArray();
    let expenses = allExpenses.filter(func(expense) { expense.tripId == tripId });
    expenses.sort(
      func(a, b) {
        if (a.date > b.date) { #less } else if (a.date < b.date) { #greater } else {
          #equal;
        };
      }
    );
  };

  public query ({ caller }) func getExpense(id : Nat) : async ?Expense {
    let data = requireAuth(caller);
    data.expenses.get(id);
  };

  public shared ({ caller }) func updateExpense(
    id : Nat,
    amount : Float,
    localCurrency : Text,
    category : Text,
    note : Text,
    date : Time.Time,
  ) : async Expense {
    let data = requireAuth(caller);

    switch (data.expenses.get(id)) {
      case (null) { Runtime.trap("Expense not found") };
      case (?expense) {
        // Get trip to find primary currency
        let trip = switch (data.trips.get(expense.tripId)) {
          case (null) { Runtime.trap("Trip not found") };
          case (?t) { t };
        };

        // Recalculate conversion
        let (convertedAmount, conversionRate) = convertCurrency(amount, localCurrency, trip.primaryCurrency);

        let updatedExpense : Expense = {
          id = expense.id;
          tripId = expense.tripId;
          amount;
          localCurrency;
          category;
          note;
          date;
          convertedAmount;
          conversionRate;
          createdAt = expense.createdAt;
        };
        data.expenses.add(id, updatedExpense);

        // Explicitly update userData to trigger persistence
        userData.add(caller, data);

        updatedExpense;
      };
    };
  };

  public shared ({ caller }) func deleteExpense(id : Nat) : async Bool {
    let data = requireAuth(caller);

    if (not data.expenses.containsKey(id)) { Runtime.trap("Expense not found") };

    data.expenses.remove(id);

    // Explicitly update userData to trigger persistence
    userData.add(caller, data);

    true;
  };

  public query ({ caller }) func getExpensesByCategory(tripId : Nat) : async [(Text, Float)] {
    let data = requireAuth(caller);

    // Get all expenses for trip
    let expenses = data.expenses.values().toArray().filter(
      func(expense) { expense.tripId == tripId }
    );

    // Group by category
    var categoryTotals : Map.Map<Text, Float> = Map.empty<Text, Float>();
    for (expense in expenses.vals()) {
      let currentTotal = switch (categoryTotals.get(expense.category)) {
        case (null) { 0.0 };
        case (?total) { total };
      };
      categoryTotals.add(expense.category, currentTotal + expense.convertedAmount);
    };

    categoryTotals.entries().toArray();
  };

  // ==================== Budget & Summary Operations ====================

  public query ({ caller }) func getTripSummary(tripId : Nat) : async TripSummary {
    let data = requireAuth(caller);

    let trip = switch (data.trips.get(tripId)) {
      case (null) { Runtime.trap("Trip not found") };
      case (?t) { t };
    };

    let totalSpent = calculateTripTotal(data, tripId);
    let remaining = trip.budgetLimit - totalSpent;
    let percentUsed = if (trip.budgetLimit > 0.0) {
      (totalSpent / trip.budgetLimit) * 100.0;
    } else {
      0.0;
    };

    let expenses = data.expenses.values().toArray().filter(
      func(expense) { expense.tripId == tripId }
    );

    // Calculate expenses by category
    var categoryTotals : Map.Map<Text, Float> = Map.empty<Text, Float>();
    for (expense in expenses.vals()) {
      let currentTotal = switch (categoryTotals.get(expense.category)) {
        case (null) { 0.0 };
        case (?total) { total };
      };
      categoryTotals.add(expense.category, currentTotal + expense.convertedAmount);
    };

    {
      trip;
      totalSpent;
      remaining;
      percentUsed;
      expenseCount = expenses.size();
      expensesByCategory = categoryTotals.entries().toArray();
    };
  };

  // ==================== Exchange Rate Operations ====================

  public shared ({ caller }) func updateExchangeRates(rates : [(Text, Float)]) : async Bool {
    ignore requireAuth(caller);
    let now = Time.now();

    for ((code, rate) in rates.vals()) {
      let exchangeRate : ExchangeRate = {
        code;
        rate;
        lastUpdated = now;
      };
      exchangeRates.add(code, exchangeRate);
    };

    lastRateUpdate := now;
    true;
  };

  public query func getExchangeRates() : async [ExchangeRate] {
    exchangeRates.values().toArray();
  };

  public query func getLastRateUpdate() : async Time.Time {
    lastRateUpdate;
  };

  // ==================== API Key Management Operations ====================

  public shared ({ caller }) func setApiKey(key : Text) : async Bool {
    let data = requireAuth(caller);
    data.apiKey := ?key;
    userData.add(caller, data);
    true;
  };

  public query ({ caller }) func getApiKey() : async ?Text {
    let data = requireAuth(caller);
    switch (data.apiKey) {
      case (null) { null };
      case (?key) {
        if (key.size() > 8) {
          let len = key.size();
          var prefix = "";
          var suffix = "";
          var i = 0;
          for (char in key.chars()) {
            if (i < 4) {
              prefix #= Text.fromChar(char);
            };
            if (i + 4 >= len) {
              suffix #= Text.fromChar(char);
            };
            i += 1;
          };
          ?(prefix # "..." # suffix);
        } else {
          ?"****";
        };
      };
    };
  };

  public shared ({ caller }) func deleteApiKey() : async Bool {
    let data = requireAuth(caller);
    data.apiKey := null;
    data.expensesEnabled := false;
    userData.add(caller, data);
    true;
  };

  public query ({ caller }) func getExpensesEnabled() : async Bool {
    let data = requireAuth(caller);
    data.expensesEnabled;
  };

  public query func getAvailableCurrencies() : async [Text] {
    let currencies = exchangeRates.keys().toArray();
    currencies.sort();
  };

  // HTTP Transform function
  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // Helper to convert Nat to Float (avoiding deprecated Float.fromInt)
  func natToFloat(n : Nat) : Float {
    Float.fromInt64(Int64.fromNat64(Nat64.fromNat(n)));
  };

  // Simple float parser for exchange rate values
  func parseFloat(text : Text) : ?Float {
    var intPart : Nat = 0;
    var fracPart : Float = 0.0;
    var fracDivisor : Float = 10.0;
    var inFraction = false;
    var isNegative = false;
    var hasDigits = false;

    for (char in text.chars()) {
      if (char == '-' and not hasDigits) {
        isNegative := true;
      } else if (char == '.' and not inFraction) {
        inFraction := true;
      } else if (char >= '0' and char <= '9') {
        hasDigits := true;
        let digit = (char.toNat32() - 48).toNat(); // '0' is 48
        if (inFraction) {
          fracPart += natToFloat(digit) / fracDivisor;
          fracDivisor *= 10.0;
        } else {
          intPart := intPart * 10 + digit;
        };
      };
    };

    if (not hasDigits) {
      return null;
    };

    var result = natToFloat(intPart) + fracPart;
    if (isNegative) {
      result := -result;
    };
    ?result;
  };

  // Simple JSON parser to extract exchange rates
  func parseExchangeRates(jsonText : Text) : [(Text, Float)] {
    var rates : [(Text, Float)] = [];

    // Find "rates":{ in the response
    let ratesMarker = "\"rates\":{";
    var foundRates = false;
    var ratesJson = "";

    let chars = jsonText.chars();
    var buffer = "";
    var inRates = false;
    var braceCount = 0;

    for (char in chars) {
      buffer #= Text.fromChar(char);

      if (not inRates and buffer.size() >= ratesMarker.size()) {
        if (buffer.endsWith(#text ratesMarker)) {
          inRates := true;
          braceCount := 1;
          ratesJson := "";
        };
      };

      if (inRates) {
        if (char == '{') { braceCount += 1 };
        if (char == '}') { braceCount -= 1 };
        if (braceCount == 0) {
          foundRates := true;
          // Don't include the closing brace
        };
        if (braceCount > 0) {
          ratesJson #= Text.fromChar(char);
        };
      };
    };

    if (not foundRates or ratesJson.size() == 0) {
      return [];
    };

    // Parse individual currency rates: "USD":1.0,"EUR":0.85,...
    let pairs = ratesJson.split(#text ",");
    for (pair in pairs) {
      let parts = pair.split(#text ":");
      switch (parts.next()) {
        case (?currencyPart) {
          switch (parts.next()) {
            case (?valuePart) {
              // Extract currency code (remove quotes)
              let currency = currencyPart.replace(#text "\"", "").replace(#text " ", "");
              // Parse value
              let valueClean = valuePart.replace(#text " ", "");
              switch (parseFloat(valueClean)) {
                case (?rate) {
                  if (currency.size() == 3) {
                    // Valid currency code
                    rates := rates.concat([(currency, rate)]);
                  };
                };
                case (null) {};
              };
            };
            case (null) {};
          };
        };
        case (null) {};
      };
    };

    rates;
  };

  public shared ({ caller }) func fetchAndStoreExchangeRates() : async Bool {
    let data = requireAuth(caller);

    let userApiKey = switch (data.apiKey) {
      case (null) {
        Runtime.trap("No API key configured. Please add your API key in Settings.");
      };
      case (?key) { key };
    };

    let url = "https://api.fxratesapi.com/latest?api_key=" # userApiKey;

    try {
      let responseText = await OutCall.httpGetRequest(url, [], transform);

      // Check for success in response
      if (not responseText.contains(#text "\"success\":true")) {
        Runtime.trap("API returned error response. Please check your API key.");
      };

      let rates = parseExchangeRates(responseText);

      if (rates.size() == 0) {
        Runtime.trap("No exchange rates found in response");
      };

      let now = Time.now();
      for ((code, rate) in rates.vals()) {
        let exchangeRate : ExchangeRate = {
          code;
          rate;
          lastUpdated = now;
        };
        exchangeRates.add(code, exchangeRate);
      };

      lastRateUpdate := now;

      // Enable expenses after successful fetch
      data.expensesEnabled := true;
      userData.add(caller, data);

      true;
    } catch (err : Error.Error) {
      Runtime.trap("HTTP request failed: " # err.message());
    };
  };
};
