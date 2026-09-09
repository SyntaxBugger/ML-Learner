// LessonSection gives the opening explanation a reusable structure.
// Its props let another lesson provide a different label, title, or text later.
export default function LessonSection({ label, title, text }) {
  return (
    <div className="lesson-introduction">
      <p className="eyebrow"><span className="eyebrow-dot" /> {label}</p>
      <h1 id="lesson-title">{title}</h1>
      <p className="lesson-copy">{text}</p>
      <aside className="why-matters">
        <span className="why-icon" aria-hidden="true">?</span>
        <div><h2>Why this matters</h2><p>A model can only learn from the examples we give it. If the data is confusing or incomplete, its answers may be confusing too.</p></div>
      </aside>
    </div>
  );
}