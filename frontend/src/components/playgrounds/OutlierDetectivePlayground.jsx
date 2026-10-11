import { useState } from "react";

/**
 * OutlierDetectivePlayground
 * An interactive simulator demonstrating Tukey's IQR (Interquartile Range)
 * boxplot method and how data scientists detect anomalies.
 */
export default function OutlierDetectivePlayground() {
  // Typical demo distribution: e.g. ages of car buyers
  const q1 = 26;
  const median = 38;
  const q3 = 52;
  const iqr = q3 - q1; // 26
  const lowerFence = Math.max(0, q1 - 1.5 * iqr); // 0
  const upperFence = q3 + 1.5 * iqr; // 91

  const [testValue, setTestValue] = useState(42);

  // Status check
  const isOutlier = testValue > upperFence || testValue < lowerFence;
  const isInsideBox = testValue >= q1 && testValue <= q3;

  // Coordinate mapping for SVG boxplot (scale: 0 to 130 maps to width 30 to 390)
  const maxVal = 130;
  const toSvgX = (val) => 30 + (Math.min(maxVal, Math.max(0, val)) / maxVal) * 360;

  return (
    <div className="playground-card">
      <div className="playground-header">
        <div className="playground-title-group">
          <span className="playground-tag">INTERACTIVE PLAYGROUND</span>
          <h4>Outlier Detective: How Does the Math Spot Anomalies?</h4>
        </div>

        <div className="playground-controls">
          <button
            type="button"
            className={`preset-btn ${testValue === 38 ? "active" : ""}`}
            onClick={() => setTestValue(38)}
          >
            Normal (Median: 38)
          </button>
          <button
            type="button"
            className={`preset-btn ${testValue === 75 ? "active" : ""}`}
            onClick={() => setTestValue(75)}
          >
            Edge of Normal (75)
          </button>
          <button
            type="button"
            className={`preset-btn ${testValue === 115 ? "active" : ""}`}
            onClick={() => setTestValue(115)}
          >
            Extreme Outlier (115)
          </button>
        </div>
      </div>

      <p className="playground-prompt">
        Computers don't guess what is "unusual"—they use the <strong>IQR (Interquartile Range) Fence</strong> rule. Test any number with the slider below to see whether the detective flags it as an outlier!
      </p>

      {/* Slider Control */}
      <div className="slider-control-card">
        <div className="slider-labels">
          <label htmlFor="test-val-slider">
            <strong>Test Value:</strong>
          </label>
          <span
            className="slider-value-display"
            style={{ color: isOutlier ? "var(--coral)" : "var(--lime)" }}
          >
            {testValue} {isOutlier ? "🚨 OUTLIER" : "✅ NORMAL"}
          </span>
        </div>
        <input
          id="test-val-slider"
          type="range"
          min="10"
          max="125"
          step="1"
          value={testValue}
          onChange={(e) => setTestValue(Number(e.target.value))}
          className="playground-range-input"
        />
        <div className="slider-ticks">
          <span>10 (Young)</span>
          <span>Q1: 26</span>
          <span>Median: 38</span>
          <span>Q3: 52</span>
          <span>Fence: 91</span>
          <span>125+ (Rare)</span>
        </div>
      </div>

      {/* Interactive Boxplot SVG */}
      <div className="boxplot-canvas-card">
        <div className="boxplot-header">
          <span className="chart-label">VISUAL BOXPLOT &amp; FENCE DETECTOR</span>
          <span className="iqr-summary">IQR = (Q3 − Q1) = {iqr} | Upper Fence = {upperFence}</span>
        </div>

        <div className="svg-wrapper">
          <svg viewBox="0 0 420 160" className="boxplot-svg" aria-label="Interactive boxplot">
            {/* Background baseline */}
            <line x1="30" y1="80" x2="390" y2="80" stroke="#2c372e" strokeWidth="2" />

            {/* Left Whisker */}
            <line x1={toSvgX(lowerFence)} y1="80" x2={toSvgX(q1)} y2="80" stroke="#7e887e" strokeWidth="2" />
            <line x1={toSvgX(lowerFence)} y1="65" x2={toSvgX(lowerFence)} y2="95" stroke="#7e887e" strokeWidth="2" />

            {/* The IQR Box (Middle 50%) */}
            <rect
              x={toSvgX(q1)}
              y="50"
              width={toSvgX(q3) - toSvgX(q1)}
              height="60"
              fill="rgba(215, 243, 107, 0.12)"
              stroke="var(--lime)"
              strokeWidth="2"
              rx="4"
            />

            {/* Median Line */}
            <line
              x1={toSvgX(median)}
              y1="50"
              x2={toSvgX(median)}
              y2="110"
              stroke="var(--lime)"
              strokeWidth="3"
            />

            {/* Right Whisker */}
            <line x1={toSvgX(q3)} y1="80" x2={toSvgX(upperFence)} y2="80" stroke="#7e887e" strokeWidth="2" />

            {/* Upper Fence boundary line */}
            <line
              x1={toSvgX(upperFence)}
              y1="40"
              x2={toSvgX(upperFence)}
              y2="120"
              stroke="var(--coral)"
              strokeWidth="2"
              strokeDasharray="4 3"
            />
            <text x={toSvgX(upperFence) - 20} y="32" fill="var(--coral)" fontSize="12" fontFamily="JetBrains Mono, monospace">
              Fence ({upperFence})
            </text>

            {/* Interactive Test Marker */}
            <circle
              cx={toSvgX(testValue)}
              cy="80"
              r="7"
              fill={isOutlier ? "var(--coral)" : "var(--lime)"}
              stroke="#0f1410"
              strokeWidth="2"
              className="test-point-pulse"
            />
            <text
              x={toSvgX(testValue)}
              y={isOutlier ? 138 : 138}
              textAnchor="middle"
              fill={isOutlier ? "var(--coral)" : "var(--paper)"}
              fontSize="13"
              fontWeight="bold"
              fontFamily="JetBrains Mono, monospace"
            >
              ▲ You: {testValue}
            </text>

            {/* Box labels */}
            <text x={toSvgX(q1)} y="125" textAnchor="middle" fill="#7e887e" fontSize="11" fontFamily="JetBrains Mono, monospace">
              Q1 ({q1})
            </text>
            <text x={toSvgX(median)} y="125" textAnchor="middle" fill="var(--lime)" fontSize="11" fontFamily="JetBrains Mono, monospace">
              Median ({median})
            </text>
            <text x={toSvgX(q3)} y="125" textAnchor="middle" fill="#7e887e" fontSize="11" fontFamily="JetBrains Mono, monospace">
              Q3 ({q3})
            </text>
          </svg>
        </div>

        {/* Live Detective Status Banner */}
        <div className={`detective-verdict-box ${isOutlier ? "verdict-outlier" : "verdict-normal"}`}>
          <div className="verdict-icon">{isOutlier ? "🚨" : isInsideBox ? "🎯" : "✅"}</div>
          <div className="verdict-text">
            <strong>
              {isOutlier
                ? `Value ${testValue} is an Outlier!`
                : isInsideBox
                ? `Value ${testValue} sits inside the Middle 50% Box!`
                : `Value ${testValue} is Normal (within expected spread).`}
            </strong>
            <p>
              {isOutlier
                ? `Because ${testValue} is beyond the upper fence (${upperFence}), statistical models flag it for human inspection. It could be a typo (like entering 115 instead of 15) or a real but rare record.`
                : isInsideBox
                ? `Values between Q1 (${q1}) and Q3 (${q3}) represent the core typical members of the dataset. Models learn strongest from this dense region.`
                : `Even though ${testValue} is higher than the average, it is still below the ${upperFence} boundary. This is considered normal natural variation.`}
            </p>
          </div>
        </div>
      </div>

      {/* Detective's 3-Step Decision Tree */}
      <div className="detective-steps-grid">
        <div className="detective-card">
          <span className="card-kicker">STEP 1: INVESTIGATE</span>
          <h5>Is it a mistake?</h5>
          <p>Typos happen: entering an age of 250, a price of -5, or a sensor glitching. If it is impossible, fix or remove it.</p>
        </div>
        <div className="detective-card">
          <span className="card-kicker">STEP 2: CHECK REALITY</span>
          <h5>Is it a rare truth?</h5>
          <p>A mansion worth $20M in a city is rare, but real. Deleting genuine records can make your model blind to high-value cases.</p>
        </div>
        <div className="detective-card">
          <span className="card-kicker">STEP 3: CHOOSE MODEL</span>
          <h5>Does our model care?</h5>
          <p>Linear models can get skewed by outliers. Tree-based models (Decision Trees, Random Forests) handle outliers naturally!</p>
        </div>
      </div>
    </div>
  );
}
