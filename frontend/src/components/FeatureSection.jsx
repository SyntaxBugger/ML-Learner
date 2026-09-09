// Each object describes one learning stage shown in the feature list.
const stages = [
  { number: "01", title: "Understand your data", text: "Find patterns, empty cells, and unusual values before asking a model to learn.", icon: "↗" },
  { number: "02", title: "Teach and compare models", text: "Try different ways to learn and see which one fits your examples best.", icon: "⌁" },
  { number: "03", title: "Understand the results", text: "Turn scores and charts into a clear story you can explain to someone else.", icon: "◌" },
];

export default function FeatureSection() {
  return (
    <section className="features-section" id="stages">
      <div className="features-intro">
        <p className="eyebrow">Designed for the curious</p>
        <h2>Every result is<br /><span>a lesson.</span></h2>
        <p>ML Experiment Lab turns machine learning into a series of small questions: What does this mean? Why does it matter? What should we do next?</p>
      </div>
      <div className="feature-list">
        {/* The same JSX structure is reused for all three stage objects. */}
        {stages.map((stage) => (
          <article className="feature-item" key={stage.number}>
            <span className="feature-number">{stage.number}</span>
            <div><h3>{stage.title}</h3><p>{stage.text}</p></div>
            <span className="feature-icon" aria-hidden="true">{stage.icon}</span>
          </article>
        ))}
      </div>
      {/* These are example values for the future experiment dashboard. */}
      <div className="metrics-strip">
        <div><span className="metric-label">Accuracy</span><strong>94.2%</strong><small>How often was it right?</small></div>
        <div><span className="metric-label">F1 Score</span><strong>0.91</strong><small>How well does it balance catching positives and avoiding false alarms?</small></div>
        <div><span className="metric-label">R²</span><strong>0.87</strong><small>How closely do its number guesses follow the real values?</small></div>
        <div><span className="metric-label">MAE</span><strong>2.4</strong><small>How far off, on average?</small></div>
      </div>
    </section>
  );
}