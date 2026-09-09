// Hero is the first section visitors see and introduces the product.
export default function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero-copy">
        {/* className connects each JSX element to a CSS rule in App.css. */}
        <p className="eyebrow"><span className="eyebrow-dot" /> An interactive ML workspace</p>
        <h1>Turn data into <em>understanding.</em></h1>
        <p className="hero-text">A guided space for exploring datasets, training models, and learning what the numbers really mean.</p>
        {/* This is currently an anchor, not an event handler: functionality is out of scope. */}
        <a className="primary-button" href="#experiment" id="start">Start Experiment <span aria-hidden="true">-&gt;</span></a>
        <p className="hero-note">No black boxes. Just clear steps and useful feedback.</p>
      </div>
      {/* This visual is built with HTML and CSS, so no chart library is needed yet. */}
      <div className="hero-visual" aria-label="A preview of an experiment dashboard">
        <div className="visual-topline"><span>EXPERIMENT / 001</span><span className="live-label"><i /> ready</span></div>
        <div className="visual-heading"><span>Model performance</span><strong>+12.8%</strong></div>
        <div className="chart" aria-hidden="true"><span className="chart-line" /><span className="chart-point point-one" /><span className="chart-point point-two" /><span className="chart-point point-three" /><span className="chart-point point-four" /></div>
        <div className="metric-grid"><div><span>ACCURACY</span><strong>94.2%</strong></div><div><span>F1 SCORE</span><strong>0.91</strong></div><div><span>DATASET</span><strong>1,248 rows</strong></div></div>
      </div>
    </section>
  );
}