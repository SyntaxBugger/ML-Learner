// ConceptCard displays one dataset idea. Props keep the component reusable.
export default function ConceptCard({ title, text }) {
  return (
    <article className="concept-card">
      <span className="concept-marker" aria-hidden="true" />
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}