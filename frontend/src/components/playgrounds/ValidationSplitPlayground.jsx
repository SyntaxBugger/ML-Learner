import { useState, useMemo } from "react";

export default function ValidationSplitPlayground() {
  const [splitRatio, setSplitRatio] = useState(80); // 80% train, 20% val
  const totalRows = 300;

  const { trainRows, valRows, status, badgeColor, explanation } = useMemo(() => {
    const tr = Math.round((totalRows * splitRatio) / 100);
    const vr = totalRows - tr;

    let stat;
    let color;
    let expl;

    if (splitRatio < 65) {
      stat = "UNDERPOWERED TRAINING (Too Little Practice)";
      color = "var(--coral, #ff775f)";
      expl = `With only ${tr} rows to study, the model does not see enough examples of rare car features or price combinations. It is prone to underfitting.`;
    } else if (splitRatio > 88) {
      stat = "FRAGILE VALIDATION (Unreliable Scorecard)";
      color = "var(--coral, #ff775f)";
      expl = `With only ${vr} rows in the validation test, just 2 or 3 weird cars can swing your accuracy or RMSE drastically. You cannot trust this score!`;
    } else {
      stat = "THE INDUSTRY SWEET SPOT (Balanced & Reliable)";
      color = "var(--lime, #d7f36b)";
      expl = `At ${splitRatio}% / ${100 - splitRatio}%, the model has plenty of practice (${tr} rows) while leaving a statistically robust exam (${vr} rows) to prove generalization.`;
    }

    return {
      trainRows: tr,
      valRows: vr,
      status: stat,
      badgeColor: color,
      explanation: expl,
    };
  }, [splitRatio]);

  return (
    <div className="playground-card validation-split-playground">
      <div className="playground-header">
        <div className="playground-title-group">
          <span className="playground-tag">INTERACTIVE SIMULATION</span>
          <h4>The Split Dilemma: Why 80/20 is the Magic Standard</h4>
        </div>

        <div className="playground-controls">
          <button
            type="button"
            className={`preset-btn ${splitRatio === 50 ? "active" : ""}`}
            onClick={() => setSplitRatio(50)}
          >
            50/50 (Too Even)
          </button>
          <button
            type="button"
            className={`preset-btn ${splitRatio === 80 ? "active" : ""}`}
            onClick={() => setSplitRatio(80)}
          >
            80/20 (Recommended)
          </button>
          <button
            type="button"
            className={`preset-btn ${splitRatio === 95 ? "active" : ""}`}
            onClick={() => setSplitRatio(95)}
          >
            95/5 (Too Risky)
          </button>
        </div>
      </div>

      <p className="playground-prompt">
        Adjust the training percentage slider below. Discover why ML practitioners almost always choose 
        between <strong>70/30</strong> and <strong>80/20</strong> instead of testing on only 5% of their data!
      </p>

      {/* Slider Control */}
      <div className="slider-control-card">
        <div className="slider-labels">
          <label>
            <strong>Training vs. Validation Partition Ratio:</strong>
          </label>
          <span className="slider-value-display">
            {splitRatio}% Train / {100 - splitRatio}% Val
          </span>
        </div>
        <input
          type="range"
          min="50"
          max="95"
          step="5"
          value={splitRatio}
          onChange={(e) => setSplitRatio(Number(e.target.value))}
          className="playground-range-input correlation-slider"
        />
        <div className="slider-ticks">
          <span>50% (Equal Split)</span>
          <span>70%</span>
          <span>80% (Standard)</span>
          <span>90%</span>
          <span>95% (Extreme)</span>
        </div>
      </div>

      {/* Visual Partition Bar */}
      <div
        style={{
          background: "var(--ink, #151916)",
          border: "1px solid #3c493e",
          borderRadius: "8px",
          padding: "18px",
        }}
      >
        <span
          style={{
            display: "block",
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            color: "var(--muted)",
            marginBottom: "8px",
          }}
        >
          DATASET PARTITION (300 TOTAL ROWS)
        </span>

        {/* Horizontal Split Progress Bar */}
        <div
          style={{
            display: "flex",
            height: "36px",
            borderRadius: "6px",
            overflow: "hidden",
            border: "1px solid #3c493e",
          }}
        >
          <div
            style={{
              width: `${splitRatio}%`,
              background: "linear-gradient(90deg, #2d7a22, #39ff14)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#071018",
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              fontWeight: "700",
              transition: "width 0.3s ease",
            }}
          >
            {splitRatio}% ({trainRows} rows)
          </div>
          <div
            style={{
              width: `${100 - splitRatio}%`,
              background: "linear-gradient(90deg, #b0254c, #ff2d95)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              fontWeight: "700",
              transition: "width 0.3s ease",
            }}
          >
            {100 - splitRatio}% ({valRows} rows)
          </div>
        </div>

        {/* Legend */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "12px",
            fontSize: "13.5px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#39ff14" }} />
            <span style={{ color: "#cbd4cb" }}>
              <strong>Training Set:</strong> The study guide used to teach weights
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ff2d95" }} />
            <span style={{ color: "#cbd4cb" }}>
              <strong>Validation Set:</strong> The unseen exam to test generalization
            </span>
          </div>
        </div>
      </div>

      {/* Diagnosis Callout */}
      <div
        style={{
          marginTop: "16px",
          padding: "16px 18px",
          background: "var(--panel, #202720)",
          borderLeft: `4px solid ${badgeColor}`,
          borderRadius: "0 6px 6px 0",
        }}
      >
        <span
          style={{
            display: "block",
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            color: badgeColor,
            fontWeight: "600",
            marginBottom: "6px",
            letterSpacing: "0.08em",
          }}
        >
          STATUS: {status}
        </span>
        <p style={{ margin: 0, color: "#cbd4cb", fontSize: "14.5px", lineHeight: "1.65" }}>
          {explanation}
        </p>
      </div>
    </div>
  );
}
