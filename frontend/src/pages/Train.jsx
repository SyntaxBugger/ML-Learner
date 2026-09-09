import { useEffect, useState } from "react";
import "../preprocess.css";
import ExperimentHeader from "../components/ExperimentHeader";
import ExperimentProgress from "../components/ExperimentProgress";

const PLAN_KEY = "ml-lab-preprocess-plan";
const TRAIN_KEY = "ml-lab-training-plan";
const EMPTY_DATASET = { columns: [], numerical_columns: [], categorical_columns: [], rows: 0, filename: "" };

const MODEL_OPTIONS = {
  regression: [
    ["linear_regression", "Linear Regression", "Finds a simple line that follows the data."],
    ["decision_tree_regressor", "Decision Tree Regressor", "Asks a series of questions to make a number guess."],
    ["random_forest_regressor", "Random Forest Regressor", "Combines many decision trees for one number guess."],
  ],
  classification: [
    ["logistic_regression", "Logistic Regression", "Estimates how likely an example is to belong to each category."],
    ["decision_tree_classifier", "Decision Tree Classifier", "Asks a series of questions to choose a category."],
    ["random_forest_classifier", "Random Forest Classifier", "Combines many decision trees to choose a category."],
  ],
};

export default function Train() {
  const [dataset, setDataset] = useState(EMPTY_DATASET);
  const [plan, setPlan] = useState({ selectedTarget: "", selectedFeatures: [], trainingPercentage: 80 });
  const [problemType, setProblemType] = useState("regression");
  const [modelType, setModelType] = useState("linear_regression");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const savedPlan = JSON.parse(sessionStorage.getItem(PLAN_KEY) || "null");
      if (savedPlan) setPlan(savedPlan);
    } catch {
      setError("The preprocessing plan could not be read. Please return to Step 03.");
    }

    async function loadDataset() {
      try {
        const response = await fetch("http://localhost:5000/api/dataset/preprocess");
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Could not load the uploaded dataset.");
        setDataset(payload);
      } catch (fetchError) {
        setError(fetchError.message || "Could not connect to the backend.");
      } finally {
        setLoading(false);
      }
    }
    loadDataset();
  }, []);

  useEffect(() => {
    const suggestedType = getSuggestedProblemType(dataset, plan.selectedTarget);
    setProblemType(suggestedType);
  }, [dataset, plan.selectedTarget]);

  useEffect(() => {
    setModelType(MODEL_OPTIONS[problemType][0][0]);
  }, [problemType]);

  async function handleTrain() {
    setTraining(true);
    setError("");
    setResult(null);
    sessionStorage.setItem(TRAIN_KEY, JSON.stringify({ problemType, modelType }));
    try {
      const response = await fetch("http://localhost:5000/api/model/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: plan.selectedTarget,
          features: plan.selectedFeatures,
          training_percentage: plan.trainingPercentage,
          problem_type: problemType,
          model_type: modelType,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "The model could not be trained.");
      setResult(payload);
    } catch (trainError) {
      setError(trainError.message || "Could not connect to the backend.");
    } finally {
      setTraining(false);
    }
  }

  if (loading) return <TrainShell><StateMessage label="LOADING" text="Getting your learning plan ready..." /></TrainShell>;
  if (error && !dataset.columns.length) return <TrainShell><StateMessage label="ERROR" text={error} /></TrainShell>;
  if (!plan.selectedTarget || !plan.selectedFeatures.length) {
    return <TrainShell><StateMessage label="STEP 03 FIRST" text="Choose a target and at least one feature in Step 03 before training the model." /><button className="continue-button" type="button" onClick={() => { window.location.hash = "#preprocess"; }}>Back to Preprocess <span aria-hidden="true">-&gt;</span></button></TrainShell>;
  }

  const models = MODEL_OPTIONS[problemType];
  const trainingRows = Math.round(dataset.rows * plan.trainingPercentage / 100);
  const testingRows = dataset.rows - trainingRows;
  const selectedModel = models.find(([key]) => key === modelType) || models[0];

  return (
    <TrainShell>
      <header className="preprocess-heading">
        <div><p className="section-label">STEP 04 / TRAIN</p><h1>Let the model<br /><em>learn.</em></h1></div>
        <button type="button" className="explore-back" onClick={() => { window.location.hash = "#preprocess"; }}>Back to preprocess</button>
      </header>
      <p className="preprocess-intro">Training is where a model studies examples from the training data and learns patterns that can help it make predictions. It learns a relationship between inputs and answers; it does not receive a magical answer.</p>

      <MachineLearningBasics dataset={dataset} />

      <LessonBlock title="What are we trying to predict?" explanation="Regression predicts a number, such as a price or temperature. Classification predicts a label, such as spam or not spam. The target column gives us a clue, but this choice is still yours.">
        <div className="problem-choice-grid">{[["regression", "Regression", "Predict a numerical value, like a selling price."], ["classification", "Classification", "Predict a category or label, like pass or fail."]].map(([key, title, text]) => <button type="button" key={key} className={problemType === key ? "problem-choice active" : "problem-choice"} onClick={() => setProblemType(key)}><strong>{title}</strong><span>{text}</span></button>)}</div>
        <ProgressiveLesson
          label="The simple difference"
          example={problemType === "regression" ? `A model could use ${plan.selectedFeatures[0] || "a feature"} to predict a selling price such as 24086.65.` : `A model could use ${plan.selectedFeatures[0] || "a feature"} to choose a label such as Electronics.`}
          why="Choosing the right kind of answer helps us choose a model that knows what sort of prediction to make."
          detail="A number can have many possible values, while a category is chosen from a set of labels. A target's data type can suggest a problem type, but it does not guarantee the correct choice."
        />
        <p className="preprocess-note">Suggestion only: the target looks like <strong>{getSuggestedProblemType(dataset, plan.selectedTarget)}</strong> based on its data type and number of unique values. You can change it.</p>
      </LessonBlock>

      <LessonBlock title="Which information will the model use?" explanation="The model learns from the selected features and tries to predict the selected target. The target must not also be an input, because then the model would already be receiving the answer.">
        <div className="train-data-summary"><SummaryValue label="Target" value={plan.selectedTarget} /><SummaryValue label="Features" value={`${plan.selectedFeatures.length} selected`} /><SummaryValue label="Training rows" value={trainingRows} /><SummaryValue label="Testing rows" value={testingRows} /></div>
        <div className="selected-feature-list">{plan.selectedFeatures.map((feature) => <span key={feature}>{feature}{dataset.numerical_columns.includes(feature) ? " / number" : dataset.categorical_columns.includes(feature) ? " / category" : ""}</span>)}</div>
        <FeaturesTargetLesson target={plan.selectedTarget} features={plan.selectedFeatures} />
      </LessonBlock>

      <LessonBlock title="Which model should we use?" explanation="Different models learn patterns in different ways. There is no single model that is always best, so we start with a clear choice and learn what it does.">
        <div className="model-options">{models.map(([key, title, description]) => <button type="button" key={key} className={modelType === key ? "model-option active" : "model-option"} onClick={() => setModelType(key)}><strong>{title}</strong><span>{description}</span></button>)}</div>
        <ModelLesson modelType={modelType} />
      </LessonBlock>

      <LessonBlock title="What happens when training begins?" explanation="The model looks at examples where the correct answer is already known. It makes guesses, compares them with the known answers, and adjusts its internal settings to learn a useful pattern. Algorithms can work internally in different ways, so this is a simplified overview.">
        <ol className="training-steps"><li>The dataset is prepared.</li><li>The selected features are given to the model.</li><li>The model compares guesses with known target values.</li><li>The model adjusts its internal settings.</li><li>The process repeats until it has learned a pattern.</li></ol>
        <div className="training-preview"><SummaryValue label="Dataset" value={dataset.filename || "Uploaded dataset"} /><SummaryValue label="Model" value={selectedModel[1]} /><SummaryValue label="Target" value={plan.selectedTarget} /><SummaryValue label="Rows" value={`${trainingRows} train / ${testingRows} test`} /></div>
        <ProgressiveLesson
          label="A small example"
          example="If the real selling price is 5.0 but the model guesses 4.2, the difference tells the model that its current pattern is not accurate enough."
          why="The model needs known answers during practice so it can improve instead of making random guesses."
          detail="The difference between a guess and the known answer is often called error. Internal parameters are values the model adjusts while learning. Different algorithms adjust them differently."
        />
      </LessonBlock>

      <CategoricalLesson columns={dataset.categorical_columns} />
      <NumericalLesson columns={dataset.numerical_columns} />

      <LessonBlock title="Training data and test data" explanation="Training data is the set of examples the model is allowed to learn from. Test data is kept separate and used later to check whether the model can make predictions on examples it has not seen.">
        <div className="training-compare"><div><strong>Training data</strong><span>Practice questions the model can study.</span></div><div><strong>Test data</strong><span>A new exam used later to check whether the pattern is useful.</span></div></div>
        <ProgressiveLesson label="Remember this" example={`This plan uses ${trainingRows} training rows and ${testingRows} test rows.`} why="Testing on the same rows used for training can be misleading. A model may remember familiar examples without learning a pattern that works on new ones." detail="Keeping test data separate gives us a fairer later check. Evaluation belongs to Step 05, so no score is calculated here." />
      </LessonBlock>

      <LessonBlock title="Train the model" explanation="This sends your choices to Python. The backend uses a pipeline that can fill simple missing values and turn categories into one-hot columns without changing the uploaded CSV.">
        {error && <div className="train-error">{error}</div>}
        <button className="continue-button" type="button" disabled={training} onClick={handleTrain}>{training ? "Training..." : "Train Model"} {!training && <span aria-hidden="true">-&gt;</span>}</button>
      </LessonBlock>

          {result && <TrainingResult result={result} onContinue={() => { window.location.hash = "#validate"; }} />}
      <EducationalSummary />
    </TrainShell>
  );
}

function TrainShell({ children }) { return <div className="experiment-page preprocess-page train-page"><ExperimentHeader /><ExperimentProgress activeStep={3} /><main className="preprocess-main">{children}</main></div>; }
function StateMessage({ label, text }) { return <div className="explore-state"><div className="state-badge">{label}</div><p>{text}</p></div>; }
function LessonBlock({ title, explanation, children }) { return <section className="preprocess-section"><p className="section-label">LESSON</p><h2>{title}</h2><p className="preprocess-explanation">{explanation}</p>{children}</section>; }
function SummaryValue({ label, value }) { return <div><span>{label}</span><strong>{value}</strong></div>; }
function ProgressiveLesson({ label, example, why, detail }) {
  return <div className="progressive-lesson"><div><span className="lesson-tag">BEGINNER IDEA</span><strong>{label}</strong></div><div className="teaching-card"><span>REAL DATA EXAMPLE</span><p>{example}</p></div><div className="teaching-card"><span>WHY IT MATTERS</span><p>{why}</p></div><details><summary>More technical detail</summary><p>{detail}</p></details></div>;
}
function MachineLearningBasics({ dataset }) {
  const firstFeature = dataset.columns.find((column) => column !== "Selling_Price") || "a column";
  const target = dataset.columns.includes("Selling_Price") ? "Selling_Price" : "the target";
  return <LessonBlock title="What is machine learning?" explanation="Machine learning is a way of teaching a computer to recognize patterns from examples instead of writing every rule by hand.">
    <div className="basics-definition-grid"><SummaryValue label="Dataset" value="A table of examples" /><SummaryValue label="Row" value="One example" /><SummaryValue label="Column" value="One kind of information" /><SummaryValue label="Feature" value="An input clue" /><SummaryValue label="Target" value="The answer to predict" /><SummaryValue label="Model" value="A learned pattern" /><SummaryValue label="Prediction" value="A model's guess" /><SummaryValue label="Training" value="Learning from examples" /></div>
    <ProgressiveLesson label="Think of it like practice" example={`In this dataset, one row describes a product. The model can study ${firstFeature} and other columns to predict ${target}.`} why="The computer is not given a list of rules for every product. It studies many examples and looks for useful relationships between the clues and the answer." detail="A model is a mathematical pattern or set of rules learned from training data. A prediction is the output it produces for a new or held-out example." />
  </LessonBlock>;
}
function FeaturesTargetLesson({ target, features }) {
  return <div className="feature-flow-lesson"><span className="lesson-tag">FEATURES -&gt; MODEL -&gt; PREDICTION</span><div className="feature-flow"><span>{features.slice(0, 3).join(" + ") || "Selected features"}</span><strong>-&gt; Model -&gt;</strong><span>Predicted {target}</span></div><ProgressiveLesson label="Inputs and answer" example={`${features[0] || "A feature"} is an input clue. ${target} is the answer the model is trying to predict.`} why="Giving the target to the model as an input would be like giving a student the answer sheet before an exam." detail="Features are the input variables and the target is the output variable. Keeping them separate makes this a real prediction problem." /></div>;
}
function ModelLesson({ modelType }) {
  const details = { linear_regression: ["Linear Regression", "Tries to describe a relationship using a straight-line style equation."], decision_tree_regressor: ["Decision Tree", "Makes decisions by asking a sequence of questions about the features."], random_forest_regressor: ["Random Forest", "Combines many decision trees to make one more reliable number guess."], logistic_regression: ["Logistic Regression", "Estimates how likely an example is to belong to each class, or category."], decision_tree_classifier: ["Decision Tree", "Asks a sequence of questions to choose a category."], random_forest_classifier: ["Random Forest", "Combines many decision trees to choose a category."], }; const [name, description] = details[modelType]; return <ProgressiveLesson label={name} example={description} why="Different models make different assumptions about patterns. Trying more than one can teach us which kind of pattern fits the data." detail="A model is not a set of hand-written rules. It is a pattern learned from the selected training examples." />;
}
function CategoricalLesson({ columns }) { const column = columns[0] || "Category"; return <LessonBlock title="What are categorical values?" explanation="Categorical data contains labels or groups rather than ordinary measurements. Examples include product category, brand, or transmission type."><div className="encoding-demo"><div><span className="demo-column-label">Example: {column}</span>{["Petrol", "Diesel", "CNG"].map((value, index) => <div className="encoding-row" key={value}><span>{value}</span><strong>-&gt; {index}</strong></div>)}</div><p>Simple numbers are only labels here. Petrol -&gt; 0, Diesel -&gt; 1, and CNG -&gt; 2 does not mean CNG is greater than Diesel.</p></div><ProgressiveLesson label="One-hot encoding" example="One-hot encoding could create Fuel_Type_Petrol, Fuel_Type_Diesel, and Fuel_Type_CNG columns, each containing a yes/no value." why="Many models cannot use words directly, so encoding gives them a numerical representation without pretending the categories have a natural order." detail="The training pipeline uses one-hot encoding for selected word columns. It creates separate indicator columns and can ignore a category it has not seen before." /></LessonBlock>; }
function NumericalLesson({ columns }) { const examples = columns.length >= 3 ? columns.slice(0, 3) : ["Year", "Kms_Driven", "Present_Price"]; return <LessonBlock title="Why do numerical features sometimes need scaling?" explanation="Numerical features contain measurable quantities such as price, distance, or stock. Their values can use very different ranges, even when all are useful."><div className="scaling-example">{examples.map((label, index) => <div key={label}><strong>{label}</strong><span>{[2015, 50000, 5.5][index]}</span></div>)}</div><ProgressiveLesson label="Same data, friendlier ranges" example={`${examples[0]} may be around 2015, while ${examples[1]} may be 50000 and ${examples[2]} may be 5.5.`} why="Distance-based algorithms can be affected by feature magnitude. Scaling can help them compare features more fairly. Tree-based models are usually less sensitive to scale." detail="Standardization usually changes a feature so its average is close to 0 and its standard deviation, a measure of spread, is close to 1. This page explains scaling but does not apply it yet." /></LessonBlock>; }
function EducationalSummary() { return <section className="preprocess-section educational-summary"><p className="section-label">WHAT TO REMEMBER</p><h2>The big picture.</h2><div className="summary-item complete">✓ A dataset contains examples.</div><div className="summary-item complete">✓ Features are the inputs; the target is the answer.</div><div className="summary-item complete">✓ Training teaches a model patterns from examples.</div><div className="summary-item complete">✓ Different problems need different model types.</div><div className="summary-item complete">✓ Categories may need encoding, and some numbers may need scaling.</div><div className="summary-item complete">✓ Test data must stay separate from training data.</div><div className="summary-item complete">✓ Training alone does not prove that a model performs well.</div><p className="preprocess-note">In Step 05, we will evaluate the trained model and check how well its predictions perform on unseen data.</p></section>; }
function TrainingResult({ result, onContinue }) {
  return <section className="preprocess-section training-result"><p className="section-label">TRAINING COMPLETE</p><h2>The model has learned a first pattern.</h2><p className="preprocess-explanation">The model has learned from the training data. In the next step, we will check how well it performs on data it has not seen.</p><div className="train-data-summary"><SummaryValue label="Model" value={formatModelName(result.model_type)} /><SummaryValue label="Problem" value={result.problem_type} /><SummaryValue label="Training rows" value={result.training_rows} /><SummaryValue label="Testing rows" value={result.testing_rows} /></div><p className="preprocess-note">Target: <strong>{result.target}</strong> | Features: <strong>{result.features.join(", ")}</strong></p><div className="prediction-preview"><h3>Small prediction preview</h3>{result.prediction_preview.map((prediction, index) => <div key={`${prediction.actual}-${index}`}><span>Actual: {prediction.actual}</span><strong>Guess: {prediction.prediction}</strong></div>)}</div><button className="continue-button" type="button" onClick={onContinue}>Continue to Validate <span aria-hidden="true">-&gt;</span></button></section>;
}
function formatModelName(modelType) { return modelType.split("_").map((part) => part[0].toUpperCase() + part.slice(1)).join(" "); }
function getSuggestedProblemType(dataset, target) { if (!target) return "regression"; return dataset.categorical_columns.includes(target) ? "classification" : "regression"; }
