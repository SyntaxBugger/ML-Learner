import { useState } from "react";

const SAMPLE_RAW_DATA = [
  { id: 1, name: "Car A", age: 3, price: 12000, fuel: "Petrol" },
  { id: 2, name: "Car B", age: null, price: 9500, fuel: "Diesel" }, // missing age
  { id: 3, name: "Car C", age: 5, price: null, fuel: "Petrol" },   // missing price
  { id: 4, name: "Car D", age: 2, price: 15000, fuel: null },     // missing fuel
  { id: 5, name: "Car E", age: 8, price: 6000, fuel: "Petrol" },
  { id: 6, name: "Car F", age: 4, price: 11000, fuel: "Diesel" },
];

export default function MissingValuePlayground() {
  const [strategy, setStrategy] = useState("raw"); // "raw" | "drop" | "mean" | "median"

  // Calculate statistics for imputation
  const knownAges = SAMPLE_RAW_DATA.filter((r) => r.age !== null).map((r) => r.age);
  const knownPrices = SAMPLE_RAW_DATA.filter((r) => r.price !== null).map((r) => r.price);

  const meanAge = Math.round(knownAges.reduce((a, b) => a + b, 0) / knownAges.length);
  const meanPrice = Math.round(knownPrices.reduce((a, b) => a + b, 0) / knownPrices.length);

  const sortedAges = [...knownAges].sort((a, b) => a - b);
  const medianAge = sortedAges[Math.floor(sortedAges.length / 2)];

  const sortedPrices = [...knownPrices].sort((a, b) => a - b);
  const medianPrice = sortedPrices[Math.floor(sortedPrices.length / 2)];

  const modeFuel = "Petrol"; // most common in sample

  // Compute processed data based on selected strategy
  const processedData = SAMPLE_RAW_DATA.filter((row) => {
    if (strategy === "drop") {
      return row.age !== null && row.price !== null && row.fuel !== null;
    }
    return true;
  }).map((row) => {
    if (strategy === "raw") return { ...row };

    const newAge = row.age === null ? (strategy === "mean" ? meanAge : medianAge) : row.age;
    const newPrice = row.price === null ? (strategy === "mean" ? meanPrice : medianPrice) : row.price;
    const newFuel = row.fuel === null ? modeFuel : row.fuel;

    return {
      ...row,
      age: newAge,
      price: newPrice,
      fuel: newFuel,
      wasAgeImputed: row.age === null,
      wasPriceImputed: row.price === null,
      wasFuelImputed: row.fuel === null,
    };
  });

  return (
    <div className="playground-card">
      <div className="playground-header">
        <div className="playground-title-group">
          <span className="playground-tag">INTERACTIVE PLAYGROUND</span>
          <h4>The Missing Data Dilemma: Drop vs. Impute Simulator</h4>
        </div>

        <div className="playground-controls">
          <button
            type="button"
            className={`preset-btn ${strategy === "raw" ? "active" : ""}`}
            onClick={() => setStrategy("raw")}
          >
            1. Raw Data (With NaNs)
          </button>
          <button
            type="button"
            className={`preset-btn ${strategy === "drop" ? "active" : ""}`}
            onClick={() => setStrategy("drop")}
          >
            2. Drop Rows
          </button>
          <button
            type="button"
            className={`preset-btn ${strategy === "mean" ? "active" : ""}`}
            onClick={() => setStrategy("mean")}
          >
            3. Impute with Mean
          </button>
          <button
            type="button"
            className={`preset-btn ${strategy === "median" ? "active" : ""}`}
            onClick={() => setStrategy("median")}
          >
            4. Impute with Median
          </button>
        </div>
      </div>

      <p className="playground-prompt">
        Notice what happens to the table below when you toggle between strategies. Watch how <strong>Drop</strong> removes half the rows, while <strong>Imputation</strong> intelligently fills missing values without discarding valid information!
      </p>

      {/* Interactive Table Preview */}
      <div className="chart-panel" style={{ margin: "16px 0" }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Row ID</th>
                <th>Car Name</th>
                <th>Age (Years)</th>
                <th>Price ($)</th>
                <th>Fuel Type</th>
                <th>Data Status</th>
              </tr>
            </thead>
            <tbody>
              {processedData.map((row) => {
                const hadMissing =
                  row.wasAgeImputed || row.wasPriceImputed || row.wasFuelImputed ||
                  row.age === null || row.price === null || row.fuel === null;

                return (
                  <tr key={row.id}>
                    <td>#{row.id}</td>
                    <td><strong>{row.name}</strong></td>
                    <td>
                      {row.age === null ? (
                        <span className="nan-badge">NaN (Missing)</span>
                      ) : row.wasAgeImputed ? (
                        <span className="imputed-val">{row.age} (filled)</span>
                      ) : (
                        row.age
                      )}
                    </td>
                    <td>
                      {row.price === null ? (
                        <span className="nan-badge">NaN (Missing)</span>
                      ) : row.wasPriceImputed ? (
                        <span className="imputed-val">${row.price.toLocaleString()} (filled)</span>
                      ) : (
                        `$${row.price.toLocaleString()}`
                      )}
                    </td>
                    <td>
                      {row.fuel === null ? (
                        <span className="nan-badge">NaN (Missing)</span>
                      ) : row.wasFuelImputed ? (
                        <span className="imputed-val">{row.fuel} (mode)</span>
                      ) : (
                        row.fuel
                      )}
                    </td>
                    <td>
                      {strategy === "drop" ? (
                        <span style={{ color: "var(--lime)", fontSize: "13px", fontFamily: "var(--font-mono)" }}>✅ 100% Complete</span>
                      ) : hadMissing ? (
                        strategy === "raw" ? (
                          <span style={{ color: "var(--coral)", fontSize: "13px", fontFamily: "var(--font-mono)" }}>⚠️ Incomplete</span>
                        ) : (
                          <span style={{ color: "var(--lime)", fontSize: "13px", fontFamily: "var(--font-mono)" }}>✨ Repaired</span>
                        )
                      ) : (
                        <span style={{ color: "var(--muted)", fontSize: "13px", fontFamily: "var(--font-mono)" }}>Complete</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dynamic Detective Analysis Banner */}
      <div className="live-insight-banner">
        <div className="insight-icon">
          {strategy === "raw" ? "❓" : strategy === "drop" ? "🗑️" : "🧪"}
        </div>
        <div className="insight-content">
          <strong>
            {strategy === "raw" && "Raw State: Models Cannot Process NaNs"}
            {strategy === "drop" && `Drop Strategy: Rows Reduced from 6 down to ${processedData.length}!`}
            {strategy === "mean" && `Mean Imputation: Replaced missing numbers with average (Age: ${meanAge}, Price: $${meanPrice})`}
            {strategy === "median" && `Median Imputation: Replaced missing numbers with middle value (Age: ${medianAge}, Price: $${medianPrice})`}
          </strong>
          <p>
            {strategy === "raw" &&
              "Most machine learning algorithms will throw an error or crash if fed empty cells. Before training, you must decide how to handle them."}
            {strategy === "drop" &&
              `Notice that 3 entire rows were discarded! Car B had a valid Price ($9,500), but was thrown in the trash just because Age was missing. Dropping rows is simple, but risks severe data loss.`}
            {strategy === "mean" &&
              `All 6 rows are preserved! The missing Age was filled with the average (${meanAge} yrs), and missing Price with the average ($${meanPrice}). This keeps your dataset large and usable.`}
            {strategy === "median" &&
              `Median is often preferred over Mean if your dataset contains extreme outliers (like a $200k sports car), because the median will not be distorted by the outlier.`}
          </p>
        </div>
      </div>
    </div>
  );
}
