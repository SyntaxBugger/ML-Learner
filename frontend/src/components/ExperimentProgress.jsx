// The labels are data because every step has the same visual structure.
const steps = [
  ["01", "Dataset"],
  ["02", "Explore"],
  ["03", "Preprocess"],
  ["04", "Train"],
  ["05", "Validate"],
  ["06", "Evaluate"],
];

export default function ExperimentProgress({ activeStep = 0 }) {
  return (
    <nav className="experiment-progress" aria-label="Experiment progress">
      {steps.map(([number, title], index) => (
        <div className={`progress-step ${index === activeStep ? "active" : index < activeStep ? "complete" : "locked"}`} key={number}>
          <span className="progress-number">{number}</span>
          <span>{title}</span>
          {index < steps.length - 1 && <span className="progress-line" aria-hidden="true" />}
        </div>
      ))}
    </nav>
  );
}