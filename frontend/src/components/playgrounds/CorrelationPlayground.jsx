import { useState, useMemo } from "react";

// Pre-generated deterministic pseudo-random points for consistent rendering
const BASE_POINTS = [
  [-1.8, 0.2], [-1.5, -0.4], [-1.2, 0.8], [-1.0, -0.7], [-0.8, 0.3],
  [-0.6, -0.2], [-0.5, 0.9], [-0.3, -0.5], [-0.2, 0.4], [-0.1, -0.9],
  [0.0, 0.1], [0.1, -0.3], [0.2, 0.7], [0.3, -0.6], [0.4, 0.2],
  [0.6, -0.4], [0.7, 0.8], [0.9, -0.1], [1.1, 0.5], [1.3, -0.8],
  [1.4, 0.3], [1.6, -0.2], [1.8, 0.6], [-1.3, -0.1], [0.5, 0.5],
  [-0.9, -0.3], [0.8, -0.5], [1.2, 0.1], [-0.4, 0.6], [1.5, -0.6]
];

export default function CorrelationPlayground() {
  const [r, setR] = useState(0.85);
  const [showCausationExplainer, setShowCausationExplainer] = useState(false);

  // Calculate transformed points for correlation r:
  // y = r * x + sqrt(1 - r^2) * noise
  const scatterPoints = useMemo(() => {
    const rVal = Math.max(-1, Math.min(1, r));
    const noiseFactor = Math.sqrt(Math.max(0, 1 - rVal * rVal));

    return BASE_POINTS.map(([x, noise]) => {
      const y = rVal * x + noiseFactor * noise;
      // Map x from [-2.5, 2.5] to SVG width [20, 280]
      const svgX = 150 + (x / 2.2) * 115;
      // Map y from [-2.5, 2.5] to SVG height [260, 20] (inverted)
      const svgY = 140 - (y / 2.2) * 110;
      return { x: svgX, y: svgY };
    });
  }, [r]);

  // Determine qualitative classification
  const direction = r > 0.05 ? "Positive" : r < -0.05 ? "Negative" : "Near Zero";
  const absR = Math.abs(r);
  const strength =
    absR >= 0.8
      ? "Strong"
      : absR >= 0.5
      ? "Moderate"
      : absR >= 0.2
      ? "Weak"
      : "No relationship";

  const getExampleScenario = () => {
    if (r >= 0.7) {
      return {
        title: "Study Hours vs. Test Scores (+0.85)",
        desc: "As the number of study hours goes up, the test score tends to go up too.",
        type: "positive",
      };
    }
    if (r >= 0.2) {
      return {
        title: "Height vs. Shoe Size (+0.45)",
        desc: "Taller people usually have larger shoes, but there is still plenty of natural variation.",
        type: "positive",
      };
    }
    if (r >= -0.2) {
      return {
        title: "Cups of Coffee vs. Lottery Luck (0.00)",
        desc: "Drinking more coffee does not help you win the lottery. Points are scattered randomly like stars in the sky.",
        type: "neutral",
      };
    }
    if (r >= -0.7) {
      return {
        title: "Car Mileage vs. Resale Price (-0.50)",
        desc: "As the miles on the odometer go up, the car's market value tends to go down.",
        type: "negative",
      };
    }
    return {
      title: "Car Speed vs. Travel Time (-0.90)",
      desc: "As driving speed increases, the total minutes required to reach your destination drops sharply.",
      type: "negative",
    };
  };

  const scenario = getExampleScenario();

  return (
    <div className="playground-card">
      <div className="playground-header">
        <div className="playground-title-group">
          <span className="playground-tag">INTERACTIVE PLAYGROUND</span>
          <h4>Correlation Slider: Do Two Variables Move Together?</h4>
        </div>

        <div className="playground-controls">
          <button
            type="button"
            className={`preset-btn ${r === 0.9 ? "active" : ""}`}
            onClick={() => setR(0.9)}
          >
            Strong Positive (+0.9)
          </button>
          <button
            type="button"
            className={`preset-btn ${r === 0 ? "active" : ""}`}
            onClick={() => setR(0)}
          >
            Zero (0.0)
          </button>
          <button
            type="button"
            className={`preset-btn ${r === -0.9 ? "active" : ""}`}
            onClick={() => setR(-0.9)}
          >
            Strong Negative (-0.9)
          </button>
        </div>
      </div>

      <p className="playground-prompt">
        Drag the correlation slider anywhere from <strong>-1.00</strong> (slanted downhill) to <strong>+1.00</strong> (slanted uphill). Notice how the scatter points and trendline react!
      </p>

      {/* Main interactive area: Chart + Realtime Analysis */}
      <div className="correlation-interactive-grid">
        {/* SVG Scatter Plot */}
        <div className="scatter-canvas-card">
          <div className="scatter-card-header">
            <span className="chart-label">LIVE SCATTER PLOT</span>
            <span className="r-badge" style={{ color: r >= 0 ? "var(--lime)" : "var(--coral)" }}>
              r = {r >= 0 ? `+${r.toFixed(2)}` : r.toFixed(2)}
            </span>
          </div>

          <div className="svg-wrapper">
            <svg viewBox="0 0 300 280" className="scatter-svg" aria-label="Dynamic scatter plot">
              {/* Grid Lines */}
              <line x1="20" y1="140" x2="280" y2="140" stroke="#2a352c" strokeDasharray="3 3" />
              <line x1="150" y1="20" x2="150" y2="260" stroke="#2a352c" strokeDasharray="3 3" />

              {/* Dynamic Trend Line */}
              {absR > 0.1 && (
                <line
                  x1="30"
                  y1={140 - ((-1.2 * r) / 2.2) * 110}
                  x2="270"
                  y2={140 - ((1.2 * r) / 2.2) * 110}
                  stroke={r > 0 ? "var(--lime)" : "var(--coral)"}
                  strokeWidth="2.5"
                  strokeOpacity="0.75"
                />
              )}

              {/* Data points */}
              {scatterPoints.map((pt, idx) => (
                <circle
                  key={idx}
                  cx={pt.x}
                  cy={pt.y}
                  r="4.5"
                  className="scatter-circle"
                  fill={r > 0 ? "var(--lime)" : r < 0 ? "var(--coral)" : "var(--paper)"}
                  opacity="0.85"
                />
              ))}

              {/* Axis labels */}
              <text x="270" y="155" fill="#7e887e" fontSize="12" fontFamily="JetBrains Mono, monospace">Feature X →</text>
              <text x="155" y="28" fill="#7e887e" fontSize="12" fontFamily="JetBrains Mono, monospace">↑ Feature Y</text>
            </svg>
          </div>

          <div className="scatter-hint">
            <span>Points form a line when correlation is strong, and a cloud when correlation is near 0.</span>
          </div>
        </div>

        {/* Right column: Slider & Meaning */}
        <div className="correlation-info-column">
          <div className="slider-control-card">
            <div className="slider-labels">
              <label htmlFor="correlation-slider">
                <strong>Adjust Correlation Coefficient (r):</strong>
              </label>
              <strong
                className="slider-value-display"
                style={{ color: r >= 0 ? "var(--lime)" : "var(--coral)" }}
              >
                {r >= 0 ? `+${r.toFixed(2)}` : r.toFixed(2)}
              </strong>
            </div>
            <input
              id="correlation-slider"
              type="range"
              min="-1.0"
              max="1.0"
              step="0.05"
              value={r}
              onChange={(e) => setR(parseFloat(e.target.value))}
              className="playground-range-input correlation-slider"
            />
            <div className="slider-ticks">
              <span>-1.0 (Inverse)</span>
              <span>0.0 (None)</span>
              <span>+1.0 (Direct)</span>
            </div>
          </div>

          <div className="scenario-card">
            <span className="card-kicker">REAL-WORLD ANALOGY:</span>
            <h5>{scenario.title}</h5>
            <p>{scenario.desc}</p>
          </div>

          <div className="metrics-quick-summary">
            <div className="summary-pill">
              <span>Direction:</span>
              <strong className={direction === "Positive" ? "text-lime" : direction === "Negative" ? "text-coral" : ""}>
                {direction}
              </strong>
            </div>
            <div className="summary-pill">
              <span>Strength:</span>
              <strong>{strength}</strong>
            </div>
            <div className="summary-pill">
              <span>Pattern:</span>
              <strong>{absR > 0.6 ? "Clear Line" : absR > 0.3 ? "Loose Trend" : "Random Cloud"}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Note: Correlation != Causation */}
      <div className="causation-alert-card">
        <div className="causation-header" onClick={() => setShowCausationExplainer(!showCausationExplainer)}>
          <div className="causation-title">
            <span className="alert-badge">GOLDEN RULE</span>
            <strong>Correlation does NOT mean Causation!</strong>
          </div>
          <button type="button" className="text-toggle-btn">
            {showCausationExplainer ? "Hide example ▲" : "Why? Read classic example ▼"}
          </button>
        </div>

        {showCausationExplainer && (
          <div className="causation-body fade-in">
            <p>
              Just because two variables move together does <strong>not</strong> mean one causes the other.
            </p>
            <div className="causation-example-box">
              <span className="example-tag">THE CLASSIC ICE CREAM TRAP:</span>
              <p>
                In the summer, <strong>Ice Cream Sales</strong> and <strong>Shark Attacks</strong> both increase at the same time. Their correlation is high (+0.80)!
                Does eating ice cream attract sharks? Of course not! A hidden third variable—<strong>hot sunny weather</strong>—causes more people to buy ice cream and more people to swim in the ocean.
              </p>
            </div>
            <p className="causation-takeaway">
              In Machine Learning, correlated features can be fantastic clues for making predictions, but never assume one feature is the cause of another without real domain experiments!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
