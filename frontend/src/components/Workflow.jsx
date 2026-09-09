// Keeping the workflow content in an array makes the repeated UI easy to edit.
const steps = [
  ["01", "Dataset", "Bring your examples"], ["02", "Explore", "Understand the clues"], ["03", "Preprocess", "Make the data ready"],
  ["04", "Train", "Let the model learn"], ["05", "Validate", "Test new examples"], ["06", "Evaluate", "Understand its answers"],
];

export default function Workflow() {
  return (
    <section className="workflow-section" id="workflow">
      <div className="section-heading"><p className="eyebrow">The path through the lab</p><h2>From first upload<br /><span>to confident insight.</span></h2></div>
      <div className="workflow-track">
        {/* map creates one workflow item for every row in the steps array. */}
        {steps.map(([number, title, description], index) => (
          <div className="workflow-step" key={title}>
            <div className="step-node">{number}</div>
            <strong>{title}</strong>
            <span>{description}</span>
            {/* Do not draw a connector after the final step. */}
            {index < steps.length - 1 && <div className="step-connector" aria-hidden="true" />}
          </div>
        ))}
      </div>
    </section>
  );
}