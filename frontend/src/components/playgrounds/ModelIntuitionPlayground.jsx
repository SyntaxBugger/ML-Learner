import { useState, useMemo } from "react";

// Synthetic curved data: true function y = 20 + 2.5*x - 0.035*x^2 + noise
const BASE_POINTS = [
  { x: 10, trueY: 41.5 },
  { x: 18, trueY: 53.7 },
  { x: 26, trueY: 61.3 },
  { x: 35, trueY: 64.6 },
  { x: 44, trueY: 62.1 },
  { x: 53, trueY: 54.4 },
  { x: 62, trueY: 40.5 },
  { x: 72, trueY: 18.8 },
];

export default function ModelIntuitionPlayground() {
  const [complexity, setComplexity] = useState(2); // 1 = Linear, 2 = Balanced Quad, 3 = Overfitted polynomial
  const [noiseLevel, setNoiseLevel] = useState(6); // noise standard deviation

  // Generate noisy points (fixed pseudo-random offsets for determinism)
  const dataPoints = useMemo(() => {
    const offsets = [4.2, -5.1, 3.8, -4.5, 6.2, -5.8, 3.1, -4.0];
    return BASE_POINTS.map((pt, idx) => {
      const noise = (offsets[idx] / 5) * noiseLevel;
      const observedY = Math.max(5, Math.min(85, pt.trueY + noise));
      return {
        x: pt.x,
        y: Math.round(observedY * 10) / 10,
        isTest: idx % 3 === 2, // 33% test set
      };
    });
  }, [noiseLevel]);

  // Compute model prediction curve points based on complexity
  const { curvePath, trainError, testError, diagnosis, diagColor } = useMemo(() => {
    const trainPoints = dataPoints.filter((p) => !p.isTest);
    const testPoints = dataPoints.filter((p) => p.isTest);

    // SVG coordinates: viewBox 0 0 400 200
    // X range: 0 to 80 -> mapped to 30 to 370
    // Y range: 0 to 90 -> mapped to 180 to 20
    const toSvgX = (x) => 30 + (x / 80) * 340;
    const toSvgY = (y) => 180 - (y / 90) * 160;

    let predictFn;
    let diagText;
    let color;

    if (complexity === 1) {
      // Underfitting: simple flat straight line
      // y = 50 (ignoring curvature)
      predictFn = (x) => 53 - 0.1 * x;
      diagText = "UNDERFITTING (Too Simple): The model assumes the world is a straight line. It completely misses the real curve (High Bias).";
      color = "var(--coral, #ff775f)";
    } else if (complexity === 2) {
      // Good Fit: smooth gentle quadratic curve
      predictFn = (x) => 22 + 2.3 * x - 0.032 * x * x;
      diagText = "JUST RIGHT (Good Generalization): Captures the underlying rise and fall without chasing individual noisy dots. Test error is low!";
      color = "var(--lime, #d7f36b)";
    } else {
      // Overfitting: crazy wiggly curve passing right through every training point
      predictFn = (x) => {
        // High-order polynomial wiggle
        const base = 22 + 2.3 * x - 0.032 * x * x;
        const wiggle = Math.sin((x / 8) * Math.PI) * (noiseLevel * 1.8);
        return base + wiggle;
      };
      diagText = "OVERFITTING (Memorizing Noise): The model twists and turns to hit every training dot perfectly. Training error is tiny, but it makes huge mistakes on new test dots (High Variance)!";
      color = "var(--coral, #ff775f)";
    }

    // Calculate Train and Test Mean Absolute Errors
    const calcMae = (pts) => {
      const sum = pts.reduce((acc, p) => acc + Math.abs(p.y - predictFn(p.x)), 0);
      return Math.round((sum / pts.length) * 10) / 10;
    };

    const trErr = calcMae(trainPoints);
    const teErr = calcMae(testPoints);

    // Generate SVG path for the model prediction curve
    const pathSegments = [];
    for (let x = 8; x <= 76; x += 1.5) {
      const y = Math.max(0, Math.min(95, predictFn(x)));
      const sx = toSvgX(x);
      const sy = toSvgY(y);
      if (x === 8) {
        pathSegments.push(`M ${sx} ${sy}`);
      } else {
        pathSegments.push(`L ${sx} ${sy}`);
      }
    }

    return {
      curvePath: pathSegments.join(" "),
      trainError: trErr,
      testError: teErr,
      diagnosis: diagText,
      diagColor: color,
    };
  }, [dataPoints, complexity, noiseLevel]);

  const toSvgX = (x) => 30 + (x / 80) * 340;
  const toSvgY = (y) => 180 - (y / 90) * 160;

  return (
    <div className="playground-card model-playground">
      <div className="playground-header">
        <div className="playground-title-group">
          <span className="playground-tag">INTERACTIVE SIMULATION</span>
          <h4>Model Complexity &amp; The Underfitting vs. Overfitting Dilemma</h4>
        </div>

        <div className="playground-controls">
          <button
            type="button"
            className={`preset-btn ${complexity === 1 ? "active" : ""}`}
            onClick={() => setComplexity(1)}
          >
            1. Underfit (Too Simple)
          </button>
          <button
            type="button"
            className={`preset-btn ${complexity === 2 ? "active" : ""}`}
            onClick={() => setComplexity(2)}
          >
            2. Balanced (Sweet Spot)
          </button>
          <button
            type="button"
            className={`preset-btn ${complexity === 3 ? "active" : ""}`}
            onClick={() => setComplexity(3)}
          >
            3. Overfit (Too Complex)
          </button>
        </div>
      </div>

      <p className="playground-prompt">
        Toggle between model complexity levels and adjust the noise slider below. Observe what happens to 
        the <strong style={{ color: "var(--lime)" }}>Training Error</strong> vs.{" "}
        <strong style={{ color: "var(--coral)" }}>Test Error</strong> when a model tries too hard to memorize noise!
      </p>

      {/* Sliders */}
      <div className="slider-control-card">
        <div className="slider-labels">
          <label>
            <strong>Noise in Real-World Measurements:</strong>
          </label>
          <span className="slider-value-display">±{noiseLevel} units</span>
        </div>
        <input
          type="range"
          min="1"
          max="12"
          step="1"
          value={noiseLevel}
          onChange={(e) => setNoiseLevel(Number(e.target.value))}
          className="playground-range-input correlation-slider"
        />
        <div className="slider-ticks">
          <span>Clean Data (±1)</span>
          <span>Moderate Noise (±6)</span>
          <span>Heavy Noise (±12)</span>
        </div>
      </div>

      {/* Interactive SVG Curve Visualization */}
      <div
        style={{
          background: "var(--ink, #151916)",
          border: "1px solid #3c493e",
          borderRadius: "8px",
          padding: "16px",
          position: "relative",
        }}
      >
        <svg viewBox="0 0 400 200" style={{ width: "100%", height: "220px", display: "block" }}>
          {/* Subtle grid lines */}
          <line x1="30" y1="20" x2="370" y2="20" stroke="#253127" strokeDasharray="3 3" />
          <line x1="30" y1="73" x2="370" y2="73" stroke="#253127" strokeDasharray="3 3" />
          <line x1="30" y1="126" x2="370" y2="126" stroke="#253127" strokeDasharray="3 3" />
          <line x1="30" y1="180" x2="370" y2="180" stroke="#3c493e" />
          <line x1="30" y1="20" x2="30" y2="180" stroke="#3c493e" />

          {/* Model Curve */}
          <path
            d={curvePath}
            fill="none"
            stroke={complexity === 2 ? "var(--lime, #d7f36b)" : "var(--coral, #ff775f)"}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {dataPoints.map((pt, idx) => {
            const sx = toSvgX(pt.x);
            const sy = toSvgY(pt.y);
            return (
              <g key={idx}>
                <circle
                  cx={sx}
                  cy={sy}
                  r={pt.isTest ? 6.5 : 5.5}
                  fill={pt.isTest ? "#ff2d95" : "#39ff14"}
                  stroke="#151916"
                  strokeWidth="2"
                />
                <title>{`${pt.isTest ? "Test Set" : "Training Set"} Point: x=${pt.x}, y=${pt.y}`}</title>
              </g>
            );
          })}

          {/* Legend */}
          <circle cx="50" cy="192" r="4.5" fill="#39ff14" />
          <text x="60" y="196" fill="#cbd4cb" fontSize="12" fontFamily="JetBrains Mono, monospace">
            Training Examples ({dataPoints.filter((p) => !p.isTest).length})
          </text>

          <circle cx="215" cy="192" r="5" fill="#ff2d95" />
          <text x="225" y="196" fill="#cbd4cb" fontSize="12" fontFamily="JetBrains Mono, monospace">
            Unseen Test Points ({dataPoints.filter((p) => p.isTest).length})
          </text>
        </svg>

        {/* Live Metrics Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "14px",
            marginTop: "16px",
            borderTop: "1px solid #2a352c",
            paddingTop: "14px",
          }}
        >
          <div
            style={{
              padding: "12px 14px",
              background: "rgba(57, 255, 20, 0.04)",
              border: "1px solid rgba(57, 255, 20, 0.2)",
              borderRadius: "6px",
            }}
          >
            <span
              style={{
                display: "block",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "var(--muted)",
                marginBottom: "4px",
              }}
            >
              TRAINING ERROR (Practiced Examples)
            </span>
            <strong
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "22px",
                color: "var(--lime, #d7f36b)",
              }}
            >
              ±{trainError} units
            </strong>
            <small style={{ display: "block", color: "var(--muted)", fontSize: "12px", marginTop: "4px" }}>
              {complexity === 3 ? "Looks deceptively perfect!" : "Normal practice discrepancy"}
            </small>
          </div>

          <div
            style={{
              padding: "12px 14px",
              background:
                testError > trainError * 1.5
                  ? "rgba(255, 119, 95, 0.08)"
                  : "rgba(215, 243, 107, 0.04)",
              border:
                testError > trainError * 1.5
                  ? "1px solid rgba(255, 119, 95, 0.3)"
                  : "1px solid rgba(215, 243, 107, 0.2)",
              borderRadius: "6px",
            }}
          >
            <span
              style={{
                display: "block",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "var(--muted)",
                marginBottom: "4px",
              }}
            >
              TEST ERROR (Unseen Questions)
            </span>
            <strong
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "22px",
                color: testError > trainError * 1.5 ? "var(--coral, #ff775f)" : "var(--lime, #d7f36b)",
              }}
            >
              ±{testError} units
            </strong>
            <small style={{ display: "block", color: "var(--muted)", fontSize: "12px", marginTop: "4px" }}>
              {testError > trainError * 1.5 ? "⚠️ Fails on new unseen data!" : "✅ Generalizes smoothly"}
            </small>
          </div>
        </div>
      </div>

      {/* Live Educational Diagnosis Callout */}
      <div
        style={{
          marginTop: "16px",
          padding: "16px 18px",
          background: "var(--panel, #202720)",
          borderLeft: `4px solid ${diagColor}`,
          borderRadius: "0 6px 6px 0",
        }}
      >
        <span
          style={{
            display: "block",
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            color: diagColor,
            fontWeight: "600",
            marginBottom: "6px",
            letterSpacing: "0.08em",
          }}
        >
          DIAGNOSIS:
        </span>
        <p style={{ margin: 0, color: "#cbd4cb", fontSize: "14.5px", lineHeight: "1.65" }}>
          {diagnosis}
        </p>
      </div>
    </div>
  );
}
