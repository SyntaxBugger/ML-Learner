// This header belongs to the experiment workspace, not the landing page.
export default function ExperimentHeader() {
  return (
    <header className="experiment-header">
      {/* The hash link returns the user to the existing landing page. */}
      <a className="experiment-brand" href="#top">
        <span className="brand-mark">ML</span>
        <span>ML Experiment Lab</span>
      </a>
      <span className="experiment-id">EXPERIMENT / 001</span>
      <a className="exit-lab" href="#top">Exit lab <span aria-hidden="true">-&gt;</span></a>
    </header>
  );
}