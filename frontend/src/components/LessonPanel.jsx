import LessonSection from "./LessonSection";
import ConceptCard from "./ConceptCard";
import ExampleSection from "./ExampleSection";

// LessonPanel is the educational half of Step 01.
export default function LessonPanel() {
  return (
    <section className="lesson-panel" aria-labelledby="lesson-title">
      <LessonSection
        label="STEP 01 / DATASET"
        title={<>Before the model learns,<br /><em>we need to understand the data.</em></>}
        text="A model learns by looking for useful patterns in examples. First, we look at the examples ourselves so we know what the model will see and whether anything needs fixing."
      />

      <section className="dataset-lesson" aria-labelledby="dataset-definition">
        <p className="section-label">WHAT IS A DATASET?</p>
        <h2 id="dataset-definition">A dataset is where<br />the learning begins.</h2>
        <p className="definition-copy">A dataset is a table of examples. Each row is one thing we are studying, and each column tells us something about it.</p>
        <div className="concept-grid">
          <ConceptCard title="ROWS" text="Each row is one example, such as one website or one car." />
          <ConceptCard title="FEATURES" text="Features are the clues we give the model, such as URL length or price." />
          <ConceptCard title="TARGET" text="The target is the answer we want the model to learn to predict." />
          <ConceptCard title="MISSING VALUES" text="Some cells are empty. We need to decide what to do with them before learning begins." />
        </div>
      </section>

      <ExampleSection />
    </section>
  );
}