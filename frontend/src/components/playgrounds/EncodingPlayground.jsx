import { useState } from "react";

const SAMPLE_CARS = [
  { id: 1, car: "Swift", fuel: "Petrol", color: "Red" },
  { id: 2, car: "Innova", fuel: "Diesel", color: "Blue" },
  { id: 3, car: "WagonR", fuel: "CNG", color: "White" },
  { id: 4, car: "City", fuel: "Petrol", color: "Blue" },
  { id: 5, car: "Fortuner", fuel: "Diesel", color: "Black" },
];

export default function EncodingPlayground() {
  const [method, setMethod] = useState("onehot"); // "raw" | "label" | "onehot"
  const [selectedColumn, setSelectedColumn] = useState("fuel"); // "fuel" | "color"

  // Distinct values
  const distinctFuels = ["Petrol", "Diesel", "CNG"];
  const distinctColors = ["Red", "Blue", "White", "Black"];
  const distincts = selectedColumn === "fuel" ? distinctFuels : distinctColors;

  return (
    <div className="playground-card">
      <div className="playground-header">
        <div className="playground-title-group">
          <span className="playground-tag">INTERACTIVE PLAYGROUND</span>
          <h4>Category Translator: Words to Numbers Simulator</h4>
        </div>

        <div className="playground-controls">
          <button
            type="button"
            className={`preset-btn ${method === "raw" ? "active" : ""}`}
            onClick={() => setMethod("raw")}
          >
            1. Raw Text Words
          </button>
          <button
            type="button"
            className={`preset-btn ${method === "label" ? "active" : ""}`}
            onClick={() => setMethod("label")}
          >
            2. Label Encoding (0, 1, 2)
          </button>
          <button
            type="button"
            className={`preset-btn ${method === "onehot" ? "active" : ""}`}
            onClick={() => setMethod("onehot")}
          >
            3. One-Hot Encoding (Binary Switches)
          </button>
        </div>
      </div>

      <p className="playground-prompt">
        Computers cannot multiply by words like <em>"Diesel"</em>. They require numbers. Toggle between <strong>Label Encoding</strong> and <strong>One-Hot Encoding</strong> to see why data scientists prefer One-Hot for categories without natural rank.
      </p>

      {/* Column selector */}
      <div className="slider-control-card" style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <strong style={{ fontSize: "13.5px", color: "var(--muted)", fontFamily: "var(--font-mono)" }}>COLUMN TO ENCODE:</strong>
          <button
            type="button"
            className={`selector-button ${selectedColumn === "fuel" ? "active" : ""}`}
            onClick={() => setSelectedColumn("fuel")}
          >
            Fuel Type (3 choices)
          </button>
          <button
            type="button"
            className={`selector-button ${selectedColumn === "color" ? "active" : ""}`}
            onClick={() => setSelectedColumn("color")}
          >
            Exterior Color (4 choices)
          </button>
        </div>
      </div>

      {/* Dynamic Table Preview */}
      <div className="chart-panel" style={{ margin: "16px 0" }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Row ID</th>
                <th>Car Model</th>
                {method === "raw" && <th>{selectedColumn === "fuel" ? "Fuel Type" : "Color"} (Text)</th>}
                {method === "label" && <th>{selectedColumn === "fuel" ? "Fuel_Encoded (Integer)" : "Color_Encoded (Integer)"}</th>}
                {method === "onehot" && (
                  distincts.map((val) => (
                    <th key={val} style={{ color: "var(--lime)" }}>
                      is_{val}
                    </th>
                  ))
                )}
                <th>What the Machine Sees</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_CARS.map((row) => {
                const rawVal = row[selectedColumn];
                const labelIndex = distincts.indexOf(rawVal);

                return (
                  <tr key={row.id}>
                    <td>#{row.id}</td>
                    <td><strong>{row.car}</strong></td>
                    {method === "raw" && <td><span style={{ color: "var(--coral)" }}>"{rawVal}"</span></td>}
                    {method === "label" && (
                      <td>
                        <strong style={{ color: "var(--coral)", fontFamily: "var(--font-mono)" }}>{labelIndex}</strong>
                        <small style={{ color: "var(--muted)", marginLeft: "8px" }}>({rawVal})</small>
                      </td>
                    )}
                    {method === "onehot" && (
                      distincts.map((val) => (
                        <td key={val}>
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontWeight: "bold",
                              color: rawVal === val ? "var(--lime)" : "#4e5a50",
                              background: rawVal === val ? "rgba(215, 243, 107, 0.15)" : "transparent",
                              padding: "2px 8px",
                              borderRadius: "3px",
                            }}
                          >
                            {rawVal === val ? "1" : "0"}
                          </span>
                        </td>
                      ))
                    )}
                    <td>
                      {method === "raw" && (
                        <span style={{ color: "var(--coral)", fontSize: "13px", fontFamily: "var(--font-mono)" }}>
                          ❌ Cannot compute (string)
                        </span>
                      )}
                      {method === "label" && (
                        <span style={{ color: "var(--coral)", fontSize: "13px", fontFamily: "var(--font-mono)" }}>
                          ⚠️ Assumes {distincts[labelIndex]} = {labelIndex}
                        </span>
                      )}
                      {method === "onehot" && (
                        <span style={{ color: "var(--lime)", fontSize: "13px", fontFamily: "var(--font-mono)" }}>
                          ✅ Light switch: active on {rawVal}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Detective Explanation */}
      <div className={`live-insight-banner ${method === "label" ? "verdict-outlier" : ""}`}>
        <div className="insight-icon">
          {method === "raw" ? "⛔" : method === "label" ? "⚠️" : "💡"}
        </div>
        <div className="insight-content">
          <strong>
            {method === "raw" && "Raw Text Words: Incompatible with Machine Learning"}
            {method === "label" && "Label Encoding: The False Ranking Trap!"}
            {method === "onehot" && "One-Hot Encoding: Fair, Independent Binary Columns"}
          </strong>
          <p>
            {method === "raw" &&
              "Algorithms perform matrix multiplication and distance calculations. They cannot do algebra on words like 'Diesel' or 'Red'. They must be encoded."}
            {method === "label" &&
              `If we set Petrol=0, Diesel=1, and CNG=2, a regression or neural network algorithm treats 2 as numerically larger than 1! It might assume CNG is 'twice as much car' as Diesel, creating completely fictional mathematical patterns.`}
            {method === "onehot" &&
              `Each category gets its own independent column containing only 1 (True) or 0 (False). Now, no category is 'greater' or 'less' than any other! This is why One-Hot Encoding is the standard choice for categories without natural order.`}
          </p>
        </div>
      </div>
    </div>
  );
}
