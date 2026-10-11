import { useState } from "react";

export default function ScalingPlayground() {
  const [scalingType, setScalingType] = useState("standard"); // "raw" | "minmax" | "standard"
  const [testAge, setTestAge] = useState(35);
  const [testIncome, setTestIncome] = useState(75000);

  // Distribution boundaries for demo
  // Age: min 20, max 60, mean 40, std 10
  const ageMin = 20;
  const ageMax = 60;
  const ageMean = 40;
  const ageStd = 10;

  // Income: min 20000, max 120000, mean 70000, std 25000
  const incMin = 20000;
  const incMax = 120000;
  const incMean = 70000;
  const incStd = 25000;

  // Calculate scaled values
  // Min-Max: (x - min) / (max - min)
  const ageMinMax = (testAge - ageMin) / (ageMax - ageMin);
  const incMinMax = (testIncome - incMin) / (incMax - incMin);

  // Standard: (x - mean) / std
  const ageStdScale = (testAge - ageMean) / ageStd;
  const incStdScale = (testIncome - incMean) / incStd;

  return (
    <div className="playground-card">
      <div className="playground-header">
        <div className="playground-title-group">
          <span className="playground-tag">INTERACTIVE PLAYGROUND</span>
          <h4>The Elephant &amp; The Mouse: Feature Scaling Simulator</h4>
        </div>

        <div className="playground-controls">
          <button
            type="button"
            className={`preset-btn ${scalingType === "raw" ? "active" : ""}`}
            onClick={() => setScalingType("raw")}
          >
            1. Raw (Unscaled)
          </button>
          <button
            type="button"
            className={`preset-btn ${scalingType === "minmax" ? "active" : ""}`}
            onClick={() => setScalingType("minmax")}
          >
            2. Min-Max [0 to 1]
          </button>
          <button
            type="button"
            className={`preset-btn ${scalingType === "standard" ? "active" : ""}`}
            onClick={() => setScalingType("standard")}
          >
            3. Standardized (Z-Score)
          </button>
        </div>
      </div>

      <p className="playground-prompt">
        When one feature uses giant numbers (like <strong>Income: $75,000</strong>) and another uses small numbers (like <strong>Age: 35</strong>), distance-based models get blinded by the giant number! Toggle scaling to bring both clues onto a fair playing field.
      </p>

      {/* Sliders for Test Values */}
      <div className="slider-control-card">
        <div className="slider-labels">
          <label htmlFor="age-input-slider">
            <strong>Applicant Age:</strong> {testAge} years
          </label>
          <label htmlFor="income-input-slider">
            <strong>Annual Income:</strong> ${testIncome.toLocaleString()}
          </label>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "10px" }}>
          <div>
            <span style={{ fontSize: "13px", fontFamily: "var(--font-mono)", color: "var(--muted)" }}>Adjust Age (20 - 60 yrs):</span>
            <input
              id="age-input-slider"
              type="range"
              min="20"
              max="60"
              value={testAge}
              onChange={(e) => setTestAge(Number(e.target.value))}
              className="playground-range-input"
              style={{ width: "100%", marginTop: "6px" }}
            />
          </div>
          <div>
            <span style={{ fontSize: "13px", fontFamily: "var(--font-mono)", color: "var(--muted)" }}>Adjust Income ($20k - $120k):</span>
            <input
              id="income-input-slider"
              type="range"
              min="20000"
              max="120000"
              step="5000"
              value={testIncome}
              onChange={(e) => setTestIncome(Number(e.target.value))}
              className="playground-range-input"
              style={{ width: "100%", marginTop: "6px" }}
            />
          </div>
        </div>
      </div>

      {/* Visual Comparison Bars */}
      <div className="scaling-comparison-container" style={{ margin: "20px 0", padding: "18px", background: "#141a15", border: "1px solid #2a352c", borderRadius: "6px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
          <span className="chart-label">HOW THE ALGORITHM SEES BOTH CLUES:</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--lime)" }}>
            {scalingType === "raw" && "❌ Unfair Comparison (Income overpowers Age by 2,000×)"}
            {scalingType === "minmax" && "✅ Fair Comparison: Both bounded between 0.0 and 1.0"}
            {scalingType === "standard" && "✅ Fair Comparison: Centered around 0.0 with unit spread"}
          </span>
        </div>

        {/* Feature 1: Age Bar */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
            <span><strong>Age Value:</strong></span>
            <strong style={{ color: "var(--lime)", fontFamily: "var(--font-mono)" }}>
              {scalingType === "raw" && `${testAge} years`}
              {scalingType === "minmax" && `${ageMinMax.toFixed(2)} (normalized)`}
              {scalingType === "standard" && `${ageStdScale > 0 ? `+${ageStdScale.toFixed(2)}` : ageStdScale.toFixed(2)} σ (Z-score)`}
            </strong>
          </div>
          <div className="bar-track" style={{ height: "14px", background: "#1f2821", borderRadius: "3px" }}>
            <div
              className="bar-fill"
              style={{
                height: "100%",
                width: `${
                  scalingType === "raw"
                    ? (testAge / 120000) * 100 // raw compared against income scale!
                    : scalingType === "minmax"
                    ? ageMinMax * 100
                    : Math.max(5, Math.min(100, (ageStdScale + 2.5) * 20))
                }%`,
                background: "var(--lime)",
                transition: "width 0.25s ease",
              }}
            />
          </div>
          {scalingType === "raw" && (
            <small style={{ color: "var(--coral)", fontSize: "13px", fontFamily: "var(--font-mono)" }}>
              ▲ Almost invisible! On an absolute scale with $75k income, 35 years is less than 0.05% of the bar.
            </small>
          )}
        </div>

        {/* Feature 2: Income Bar */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
            <span><strong>Annual Income Value:</strong></span>
            <strong style={{ color: "var(--coral)", fontFamily: "var(--font-mono)" }}>
              {scalingType === "raw" && `$${testIncome.toLocaleString()}`}
              {scalingType === "minmax" && `${incMinMax.toFixed(2)} (normalized)`}
              {scalingType === "standard" && `${incStdScale > 0 ? `+${incStdScale.toFixed(2)}` : incStdScale.toFixed(2)} σ (Z-score)`}
            </strong>
          </div>
          <div className="bar-track" style={{ height: "14px", background: "#1f2821", borderRadius: "3px" }}>
            <div
              className="bar-fill"
              style={{
                height: "100%",
                width: `${
                  scalingType === "raw"
                    ? (testIncome / 120000) * 100
                    : scalingType === "minmax"
                    ? incMinMax * 100
                    : Math.max(5, Math.min(100, (incStdScale + 2.5) * 20))
                }%`,
                background: "var(--coral)",
                transition: "width 0.25s ease",
              }}
            />
          </div>
        </div>
      </div>

      {/* Live Detective Explanation */}
      <div className="live-insight-banner">
        <div className="insight-icon">⚖️</div>
        <div className="insight-content">
          <strong>
            {scalingType === "raw" && "Raw State: The Scale Illusion"}
            {scalingType === "minmax" && "Min-Max Normalization: Rescaling to [0.0, 1.0]"}
            {scalingType === "standard" && "Standardization (StandardScaler): Mean = 0, Std Dev = 1"}
          </strong>
          <p>
            {scalingType === "raw" &&
              "Algorithms like Linear Regression, Support Vector Machines, and Neural Networks calculate distances and weights. If Income is in the tens of thousands, its gradient updates will completely drown out Age, even if Age is a far more important predictor!"}
            {scalingType === "minmax" &&
              "Min-Max scaling shrinks all values into the strict boundary [0.0, 1.0]. The minimum observed value becomes 0.0, and the maximum becomes 1.0. This guarantees every feature has equal maximum weight."}
            {scalingType === "standard" &&
              "Standardization shifts the average of every column to 0.0 and rescales the spread so standard deviation is 1.0. A score of +1.0 means 'one standard deviation above average'. It is especially resilient and popular for algorithms assuming bell-curve distributions."}
          </p>
        </div>
      </div>
    </div>
  );
}
