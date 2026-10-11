import LessonSection from "./LessonSection";
import ConceptCard from "./ConceptCard";
import ExampleSection from "./ExampleSection";
import BeginnerExplainer from "./playgrounds/BeginnerExplainer";

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

        <div style={{ marginTop: "24px" }}>
          <BeginnerExplainer
            badge="DATA FOUNDATIONS"
            title="What is a Dataset in Machine Learning?"
            analogy="Think of a dataset like a patient file cabinet in a clinic or a car dealership inventory binder. Each physical paper folder inside the drawer is one Row (one car or patient). Every field printed on the inspection form (Age, Mileage, Fuel Type) is a Column (Feature). And the final diagnosis or selling price at the bottom is the Target."
            breakdown={[
              {
                term: "1. Rows (Samples / Observations)",
                text: "One distinct real-world example (e.g. one specific Honda Civic sold in 2014).",
              },
              {
                term: "2. Features (Inputs / Clues)",
                text: "The measurable properties the model uses to make its inferences (e.g. Mileage, Age, Fuel).",
              },
              {
                term: "3. Target (Ground Truth Answer)",
                text: "The exact variable we want the model to learn to predict (e.g. Selling Price).",
              },
              {
                term: "4. Data Types (Numbers vs Categories)",
                text: "Algorithms compute math directly on numbers, but text categories (like Fuel: Petrol) must be converted into numerical codes.",
              },
            ]}
            whyItMatters="Garbage In, Garbage Out (GIGO)! Machine learning algorithms have no common sense—they blindly mirror the patterns in your training data. If your dataset contains corrupted entries, missing values, or skewed samples, your model will make blunders in production."
            deepDive="Mathematically, tabular data is structured as a Design Matrix X of shape (N rows × D features) paired with a ground truth target vector y of shape (N × 1). The learning objective is to optimize a function f such that f(X) ≈ y while generalizing to unseen rows."
          />
        </div>
      </section>

      <ExampleSection />
    </section>
  );
}