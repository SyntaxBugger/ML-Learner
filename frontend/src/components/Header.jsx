// Header is a reusable navigation component for the top of the page.
export default function Header() {
  return (
    // JSX looks like HTML, but it is returned from a JavaScript function.
    <header className="site-header">
      {/* This link returns the visitor to the top of the page. */}
      <a className="brand" href="#top" aria-label="ML Experiment Lab home">
        <span className="brand-mark">ML</span>
        <div>
          <span className="site-title">ML Experiment Lab</span>
          <span className="site-sub">Learn by experimenting</span>
        </div>
      </a>
      {/* These links use matching section IDs to scroll within this page. */}
      <nav className="nav-links" aria-label="Main navigation">
        <a href="#workflow">Workflow</a>
        <a href="#stages">What you will learn</a>
        <a className="nav-button" href="#experiment">Open lab <span aria-hidden="true">-&gt;</span></a>
      </nav>
    </header>
  );
}
