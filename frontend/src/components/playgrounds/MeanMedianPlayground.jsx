import { useState, useMemo } from "react";

/**
 * MeanMedianPlayground
 * An interactive simulator demonstrating why Mean vs Median matters,
 * how outliers pull the Mean, and why Median is robust.
 */
export default function MeanMedianPlayground() {
  const defaultValues = [30, 35, 40, 45, 50];
  const [baseValues] = useState(defaultValues);
  const [outlierValue, setOutlierValue] = useState(50);
  const [includeOutlier, setIncludeOutlier] = useState(false);

  // Active numbers being analyzed
  const activeValues = useMemo(() => {
    const list = [...baseValues];
    if (includeOutlier) {
      list.push(outlierValue);
    }
    return list.sort((a, b) => a - b);
  }, [baseValues, includeOutlier, outlierValue]);

  // Calculate statistics
  const stats = useMemo(() => {
    const n = activeValues.length;
    const sum = activeValues.reduce((acc, v) => acc + v, 0);
    const mean = sum / n;

    // Median
    const mid = Math.floor(n / 2);
    const median = n % 2 !== 0 ? activeValues[mid] : (activeValues[mid - 1] + activeValues[mid]) / 2;

    // Standard deviation
    const variance = activeValues.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n;
    const std = Math.sqrt(variance);

    return { mean, median, std, min: activeValues[0], max: activeValues[n - 1] };
  }, [activeValues]);

  // Max scale for visualization (up to 550)
  const maxScale = 520;

  return (
    <div className="playground-card">
      <div className="playground-header">
        <div className="playground-title-group">
          <span className="playground-tag">INTERACTIVE PLAYGROUND</span>
          <h4>The Billionaire in the Room: Mean vs. Median Simulator</h4>
        </div>
        <div className="playground-controls">
          <button
            type="button"
            className={`preset-btn ${!includeOutlier ? "active" : ""}`}
            onClick={() => {
              setIncludeOutlier(false);
              setOutlierValue(50);
            }}
          >
            Balanced Group
          </button>
          <button
            type="button"
            className={`preset-btn ${includeOutlier && outlierValue === 200 ? "active" : ""}`}
            onClick={() => {
              setIncludeOutlier(true);
              setOutlierValue(200);
            }}
          >
            Moderate Outlier (+200k)
          </button>
          <button
            type="button"
            className={`preset-btn ${includeOutlier && outlierValue === 500 ? "active" : ""}`}
            onClick={() => {
              setIncludeOutlier(true);
              setOutlierValue(500);
            }}
          >
            Extreme Outlier (+500k)
          </button>
        </div>
      </div>

      <p className="playground-prompt">
        Imagine 5 coworkers earn between $30k and $50k. Use the slider below to introduce an extreme high earner to the room and watch how the two averages react in real time!
      </p>

      {/* Outlier slider controller */}
      <div className="slider-control-card">
        <div className="slider-labels">
          <label htmlFor="outlier-slider">
            <strong>Introduce New Person's Income:</strong>
          </label>
          <span className="slider-value-display">
            {includeOutlier ? `$${outlierValue}k` : "No extra person added"}
          </span>
        </div>
        <div className="slider-actions-row">
          <input
            id="outlier-slider"
            type="range"
            min="40"
            max="500"
            step="10"
            value={outlierValue}
            onChange={(e) => {
              setOutlierValue(Number(e.target.value));
              setIncludeOutlier(true);
            }}
            className="playground-range-input"
          />
          <button
            type="button"
            className="toggle-outlier-btn"
            onClick={() => setIncludeOutlier(!includeOutlier)}
          >
            {includeOutlier ? "Remove Person" : "Add to Room"}
          </button>
        </div>
      </div>

      {/* Live Visual Number Line Track */}
      <div className="visual-track-container">
        <div className="track-legend">
          <div className="legend-item">
            <span className="dot sample-dot" />
            <span>Data point (Income)</span>
          </div>
          <div className="legend-item">
            <span className="indicator-needle mean-needle" />
            <strong className="mean-color">Mean (Average)</strong>
          </div>
          <div className="legend-item">
            <span className="indicator-needle median-needle" />
            <strong className="median-color">Median (Middle)</strong>
          </div>
        </div>

        <div className="number-line-track">
          {/* Base and Outlier dots */}
          {activeValues.map((val, idx) => {
            const leftPct = Math.min(100, Math.max(0, (val / maxScale) * 100));
            const isOutlierDot = includeOutlier && val === outlierValue && idx === activeValues.length - 1;
            return (
              <div
                key={`${val}-${idx}`}
                className={`track-dot ${isOutlierDot ? "outlier-dot-glow" : ""}`}
                style={{ left: `${leftPct}%` }}
                title={`$${val}k`}
              >
                <span className="dot-tooltip">${val}k</span>
              </div>
            );
          })}

          {/* Mean marker line */}
          <div
            className="track-marker mean-marker"
            style={{ left: `${Math.min(100, (stats.mean / maxScale) * 100)}%` }}
          >
            <div className="marker-pin mean-pin">
              <span>Mean: ${stats.mean.toFixed(1)}k</span>
            </div>
          </div>

          {/* Median marker line */}
          <div
            className="track-marker median-marker"
            style={{ left: `${Math.min(100, (stats.median / maxScale) * 100)}%` }}
          >
            <div className="marker-pin median-pin">
              <span>Median: ${stats.median.toFixed(1)}k</span>
            </div>
          </div>
        </div>

        <div className="track-scale-labels">
          <span>$0k</span>
          <span>$100k</span>
          <span>$200k</span>
          <span>$300k</span>
          <span>$400k</span>
          <span>$500k+</span>
        </div>
      </div>

      {/* Comparative Stat Dials */}
      <div className="stats-comparison-grid">
        <div className="comparison-card mean-card">
          <div className="card-top">
            <span className="stat-label">MEAN (ARITHMETIC AVERAGE)</span>
            <span className="stat-formula">Sum of all ÷ Total count</span>
          </div>
          <div className="stat-big-val mean-color">${stats.mean.toFixed(1)}k</div>
          <p className="stat-takeaway">
            {includeOutlier && outlierValue > 70
              ? `⚡ Pulled up significantly by the $${outlierValue}k earner!`
              : "Balanced: close to typical salaries."}
          </p>
        </div>

        <div className="comparison-card median-card">
          <div className="card-top">
            <span className="stat-label">MEDIAN (TRUE MIDDLE)</span>
            <span className="stat-formula">Value right in the 50% spot</span>
          </div>
          <div className="stat-big-val median-color">${stats.median.toFixed(1)}k</div>
          <p className="stat-takeaway">
            {includeOutlier && outlierValue > 70
              ? "🛡️ Immune to the giant salary! Still shows the real middle."
              : "Splits the group cleanly into top and bottom half."}
          </p>
        </div>

        <div className="comparison-card spread-card">
          <div className="card-top">
            <span className="stat-label">STANDARD DEVIATION</span>
            <span className="stat-formula">Spread around the mean</span>
          </div>
          <div className="stat-big-val std-color">±${stats.std.toFixed(1)}k</div>
          <p className="stat-takeaway">
            {stats.std > 50
              ? "High spread: values vary wildly from the average."
              : "Low spread: values cluster tightly together."}
          </p>
        </div>
      </div>

      {/* Real-Time Live Detective Insight */}
      <div className="live-insight-banner">
        <div className="insight-icon">💡</div>
        <div className="insight-content">
          <strong>The Key Machine Learning Lesson:</strong>
          {includeOutlier && outlierValue > 100 ? (
            <p>
              When an extreme outlier enters (like an income of <strong>${outlierValue}k</strong>), the <strong>Mean</strong> jumps to <strong>${stats.mean.toFixed(1)}k</strong>—giving a false impression that everyone in the room is wealthy! The <strong>Median</strong> remains grounded at <strong>${stats.median.toFixed(1)}k</strong>. This is why data scientists always inspect both!
            </p>
          ) : (
            <p>
              When data has no extreme outliers, the <strong>Mean</strong> (${stats.mean.toFixed(1)}k) and <strong>Median</strong> (${stats.median.toFixed(1)}k) are nearly identical. That tells you the data is evenly balanced (symmetric).
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
