import { useState, useMemo } from "react";

export default function MetricExplorerPlayground() {
  const [mode, setMode] = useState("classification"); // 'classification' or 'regression'

  // Classification Paradox state:
  const totalEmails = 1000;
  const [attackCount, setAttackCount] = useState(10); // 1% attacks
  const [catchRate, setCatchRate] = useState(0); // 0% caught by dumb model

  // Regression Outlier state:
  const [outlierError, setOutlierError] = useState(25); // huge mistake on 1 prediction

  // Classification Calculations
  const classStats = useMemo(() => {
    const safeCount = totalEmails - attackCount;
    // Model predicts "Safe" for everything if catchRate == 0
    const truePositives = Math.round((attackCount * catchRate) / 100);
    const falseNegatives = attackCount - truePositives;
    const falsePositives = Math.round(safeCount * 0.02 * (catchRate > 0 ? 1 : 0)); // small false alarms if active
    const trueNegatives = safeCount - falsePositives;

    const correct = truePositives + trueNegatives;
    const accuracy = Math.round((correct / totalEmails) * 1000) / 10;

    const precision =
      truePositives + falsePositives > 0
        ? Math.round((truePositives / (truePositives + falsePositives)) * 100)
        : 0;

    const recall =
      attackCount > 0 ? Math.round((truePositives / attackCount) * 100) : 0;

    const f1 =
      precision + recall > 0
        ? Math.round(((2 * (precision * recall)) / (precision + recall)) * 10) / 10
        : 0;

    return {
      safeCount,
      truePositives,
      falseNegatives,
      falsePositives,
      trueNegatives,
      accuracy,
      precision,
      recall,
      f1,
    };
  }, [totalEmails, attackCount, catchRate]);

  // Regression Calculations (5 predictions)
  const regStats = useMemo(() => {
    const errors = [1.2, 1.8, 1.5, 2.1, outlierError];
    const mae = Math.round((errors.reduce((a, b) => a + b, 0) / errors.length) * 10) / 10;
    const mse =
      Math.round(
        (errors.reduce((a, b) => a + b * b, 0) / errors.length) * 10
      ) / 10;
    const rmse = Math.round(Math.sqrt(mse) * 10) / 10;

    return { errors, mae, rmse };
  }, [outlierError]);

  return (
    <div className="playground-card metric-explorer-playground">
      <div className="playground-header">
        <div className="playground-title-group">
          <span className="playground-tag">INTERACTIVE SIMULATION</span>
          <h4>Metric Decoders: Why One Number is Never Enough</h4>
        </div>

        <div className="playground-controls">
          <button
            type="button"
            className={`preset-btn ${mode === "classification" ? "active" : ""}`}
            onClick={() => setMode("classification")}
          >
            The Accuracy Paradox (Classification)
          </button>
          <button
            type="button"
            className={`preset-btn ${mode === "regression" ? "active" : ""}`}
            onClick={() => setMode("regression")}
          >
            MAE vs. RMSE Outlier Sensitivity (Regression)
          </button>
        </div>
      </div>

      {mode === "classification" ? (
        <div>
          <p className="playground-prompt">
            <strong>The Beginner Trap:</strong> Imagine 990 safe emails and 10 phishing attacks. A lazy model 
            that simply labels EVERY email as &quot;Safe&quot; achieves <strong>{classStats.accuracy}% Accuracy</strong>, 
            yet it lets <strong>100% of hackers</strong> through! Slide the controls below to see why 
            <strong> Precision, Recall &amp; F1-score</strong> are essential.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
            <div className="slider-control-card" style={{ marginBottom: 0 }}>
              <div className="slider-labels">
                <label>
                  <strong>Actual Attacks in 1,000 Emails:</strong>
                </label>
                <span className="slider-value-display">{attackCount} attacks</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={attackCount}
                onChange={(e) => setAttackCount(Number(e.target.value))}
                className="playground-range-input correlation-slider"
              />
            </div>

            <div className="slider-control-card" style={{ marginBottom: 0 }}>
              <div className="slider-labels">
                <label>
                  <strong>Model Effort (% Attacks Caught):</strong>
                </label>
                <span className="slider-value-display">{catchRate}% caught</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={catchRate}
                onChange={(e) => setCatchRate(Number(e.target.value))}
                className="playground-range-input correlation-slider"
              />
            </div>
          </div>

          {/* Metric Comparison Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "10px",
              marginTop: "16px",
            }}
          >
            <div
              style={{
                padding: "14px",
                background: "var(--ink, #151916)",
                border: "1px solid #3c493e",
                borderRadius: "6px",
              }}
            >
              <span style={{ display: "block", color: "var(--muted)", fontSize: "11.5px", fontFamily: "var(--font-mono)" }}>
                ACCURACY
              </span>
              <strong style={{ fontSize: "24px", color: "var(--lime)", fontFamily: "var(--font-mono)" }}>
                {classStats.accuracy}%
              </strong>
              <small style={{ display: "block", color: "var(--muted)", fontSize: "11.5px", marginTop: "4px" }}>
                {catchRate === 0 ? "⚠️ Deceptively high!" : "Overall correct"}
              </small>
            </div>

            <div
              style={{
                padding: "14px",
                background: "var(--ink, #151916)",
                border: "1px solid #3c493e",
                borderRadius: "6px",
              }}
            >
              <span style={{ display: "block", color: "var(--muted)", fontSize: "11.5px", fontFamily: "var(--font-mono)" }}>
                PRECISION
              </span>
              <strong style={{ fontSize: "24px", color: classStats.precision > 50 ? "var(--lime)" : "var(--coral)", fontFamily: "var(--font-mono)" }}>
                {classStats.precision}%
              </strong>
              <small style={{ display: "block", color: "var(--muted)", fontSize: "11.5px", marginTop: "4px" }}>
                Confidence in alarms
              </small>
            </div>

            <div
              style={{
                padding: "14px",
                background: "var(--ink, #151916)",
                border: "1px solid #3c493e",
                borderRadius: "6px",
              }}
            >
              <span style={{ display: "block", color: "var(--muted)", fontSize: "11.5px", fontFamily: "var(--font-mono)" }}>
                RECALL
              </span>
              <strong style={{ fontSize: "24px", color: classStats.recall > 50 ? "var(--lime)" : "var(--coral)", fontFamily: "var(--font-mono)" }}>
                {classStats.recall}%
              </strong>
              <small style={{ display: "block", color: "var(--muted)", fontSize: "11.5px", marginTop: "4px" }}>
                {catchRate === 0 ? "🚨 0% caught!" : "Share of caught threats"}
              </small>
            </div>

            <div
              style={{
                padding: "14px",
                background: "var(--ink, #151916)",
                border: "1px solid #3c493e",
                borderRadius: "6px",
              }}
            >
              <span style={{ display: "block", color: "var(--muted)", fontSize: "11.5px", fontFamily: "var(--font-mono)" }}>
                F1 SCORE
              </span>
              <strong style={{ fontSize: "24px", color: classStats.f1 > 50 ? "var(--lime)" : "var(--coral)", fontFamily: "var(--font-mono)" }}>
                {classStats.f1}%
              </strong>
              <small style={{ display: "block", color: "var(--muted)", fontSize: "11.5px", marginTop: "4px" }}>
                Harmonic true balance
              </small>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <p className="playground-prompt">
            <strong>MAE vs. RMSE:</strong> Both measure prediction error in continuous units. But because 
            <strong> RMSE squares mistakes before taking the root</strong>, a single catastrophic blunder 
            punishes the RMSE score drastically while MAE only increases slightly!
          </p>

          <div className="slider-control-card">
            <div className="slider-labels">
              <label>
                <strong>Inject an Outlier Blunder on 1 Prediction:</strong>
              </label>
              <span className="slider-value-display">Off by ±{outlierError} units</span>
            </div>
            <input
              type="range"
              min="2"
              max="50"
              step="2"
              value={outlierError}
              onChange={(e) => setOutlierError(Number(e.target.value))}
              className="playground-range-input correlation-slider"
            />
            <div className="slider-ticks">
              <span>Small error (±2)</span>
              <span>Moderate error (±25)</span>
              <span>Catastrophic error (±50)</span>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "14px",
              marginTop: "16px",
            }}
          >
            <div
              style={{
                padding: "16px",
                background: "var(--ink)",
                border: "1px solid #3c493e",
                borderRadius: "6px",
              }}
            >
              <span style={{ display: "block", color: "var(--muted)", fontSize: "12px", fontFamily: "var(--font-mono)" }}>
                MAE (MEAN ABSOLUTE ERROR)
              </span>
              <strong style={{ fontSize: "28px", color: "var(--lime)", fontFamily: "var(--font-mono)" }}>
                ±{regStats.mae}
              </strong>
              <p style={{ margin: "6px 0 0", color: "#cbd4cb", fontSize: "13.5px" }}>
                Treats every error linearly. A $50 mistake is weighted equally as ten $5 mistakes.
              </p>
            </div>

            <div
              style={{
                padding: "16px",
                background: "var(--ink)",
                border: "1px solid #3c493e",
                borderRadius: "6px",
              }}
            >
              <span style={{ display: "block", color: "var(--muted)", fontSize: "12px", fontFamily: "var(--font-mono)" }}>
                RMSE (ROOT MEAN SQUARED ERROR)
              </span>
              <strong style={{ fontSize: "28px", color: "var(--coral)", fontFamily: "var(--font-mono)" }}>
                ±{regStats.rmse}
              </strong>
              <p style={{ margin: "6px 0 0", color: "#cbd4cb", fontSize: "13.5px" }}>
                Severely punishes the big blunder! In critical systems (like aircraft or medical dosing), RMSE is your best protector.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
