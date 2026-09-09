import { Fragment, useEffect, useState } from "react";
import "../preprocess.css";
import ExperimentHeader from "../components/ExperimentHeader";
import ExperimentProgress from "../components/ExperimentProgress";

const PLAN_KEY = "ml-lab-preprocess-plan";
const TRAIN_KEY = "ml-lab-training-plan";
const EMPTY_DATASET = { rows: 0, columns: [], numerical_columns: [], categorical_columns: [], filename: "" };

const MODEL_NAMES = {
  linear_regression: "Linear Regression",
  decision_tree_regressor: "Decision Tree Regressor",
  random_forest_regressor: "Random Forest Regressor",
  logistic_regression: "Logistic Regression",
  decision_tree_classifier: "Decision Tree Classifier",
  random_forest_classifier: "Random Forest Classifier",
};

export default function Validate() {
  const [dataset, setDataset] = useState(EMPTY_DATASET);
  const [plan, setPlan] = useState({ selectedTarget: "", selectedFeatures: [], trainingPercentage: 80 });
  const [trainingPlan, setTrainingPlan] = useState({ problemType: "regression", modelType: "linear_regression" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      setPlan(JSON.parse(sessionStorage.getItem(PLAN_KEY) || JSON.stringify(plan)));
      setTrainingPlan(JSON.parse(sessionStorage.getItem(TRAIN_KEY) || JSON.stringify(trainingPlan)));
    } catch {
      setError("The training choices could not be read. Please return to Step 04.");
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

  async function runValidation() {
    setRunning(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("http://localhost:5000/api/model/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: plan.selectedTarget,
          features: plan.selectedFeatures,
          training_percentage: plan.trainingPercentage,
          problem_type: trainingPlan.problemType,
          model_type: trainingPlan.modelType,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Validation could not be completed.");
      setResult(payload);
    } catch (validationError) {
      setError(validationError.message || "Could not connect to the backend.");
    } finally {
      setRunning(false);
    }
  }

  if (loading) return <ValidateShell><StateMessage label="LOADING" text="Getting the validation lesson ready..." /></ValidateShell>;
  if (error && !dataset.columns.length) return <ValidateShell><StateMessage label="ERROR" text={error} /></ValidateShell>;
  if (!plan.selectedTarget || !plan.selectedFeatures.length) return <ValidateShell><StateMessage label="STEP 03 FIRST" text="Choose a target and at least one feature before checking the model on unseen data." /><button className="continue-button" type="button" onClick={() => { window.location.hash = "#preprocess"; }}>Back to Preprocess <span aria-hidden="true">-&gt;</span></button></ValidateShell>;

  const trainingRows = Math.round(dataset.rows * plan.trainingPercentage / 100);
  const validationRows = dataset.rows - trainingRows;

  return (
    <ValidateShell>
      <header className="preprocess-heading">
        <div><p className="section-label">STEP 05 / VALIDATE</p><h1>Does the model<br /><em>work on new data?</em></h1></div>
        <button type="button" className="explore-back" onClick={() => { window.location.hash = "#train"; }}>Back to train</button>
      </header>
      <p className="preprocess-intro">Validation checks whether the pattern learned during training still works on examples the model has not seen. Training is practice; validation is a new test.</p>

      <LessonBlock title="What are we checking?" explanation="A model can look impressive on examples it already studied without learning a useful pattern. We keep validation data separate, ask the model to predict it, and compare its guesses with the real answers.">
        <ProgressiveLesson label="Practice versus a new test" example="Training data is like practice questions. Validation data is like a test the model has not seen before." why="A fair check tells us whether the model can use a pattern on new examples, not just remember old ones." detail="If training performance is much better than validation performance, the model may be overfitting: memorizing details instead of learning a pattern. If both are poor, it may be underfitting: the model is too simple or the clues are not useful enough." />
      </LessonBlock>

      <LessonBlock title="How is the data split?" explanation="This plan uses the same split chosen in Step 03. The model learns only from the training portion; the validation portion stays hidden until we ask for predictions.">
        <div className="validation-split"><div className="validation-training" style={{ flexBasis: `${plan.trainingPercentage}%` }}><strong>{plan.trainingPercentage}%</strong><span>Training data<br />{trainingRows} rows</span></div><div className="validation-testing" style={{ flexBasis: `${100 - plan.trainingPercentage}%` }}><strong>{100 - plan.trainingPercentage}%</strong><span>Validation data<br />{validationRows} rows</span></div></div>
        <div className="validation-flow"><span>Dataset</span><b>-&gt;</b><span>Split</span><b>-&gt;</b><span>Learn</span><b>-&gt;</b><span>Predict</span><b>-&gt;</b><span>Compare</span></div>
      </LessonBlock>

      <LessonBlock title="What will the application do?" explanation="The backend repeats the same preparation used during training, fits the selected model on training rows only, predicts the validation rows, and calculates simple metrics that describe the guesses.">
        <div className="validation-plan"><SummaryValue label="Model" value={MODEL_NAMES[trainingPlan.modelType] || trainingPlan.modelType} /><SummaryValue label="Target" value={plan.selectedTarget} /><SummaryValue label="Features" value={`${plan.selectedFeatures.length} selected`} /><SummaryValue label="Dataset" value={dataset.filename || "Uploaded dataset"} /></div>
        <ProgressiveLesson label="One important rule" example="The actual selling price stays hidden from the model while it predicts validation rows. We reveal it only to compare the guess with reality." why="Using validation answers during learning would make the check unfair." detail="The same imputation and one-hot encoding pipeline is fitted on training data and then applied to validation data. This prevents information from the validation set leaking into training." />
      </LessonBlock>

      <LessonBlock title="Run validation" explanation="This starts a fresh, reproducible split with random_state 42. The result is based on your uploaded dataset, selected columns, model, and split percentage.">
        {error && <div className="train-error">{error}</div>}
        <button className="continue-button" type="button" disabled={running} onClick={runValidation}>{running ? "Checking unseen data..." : "Run Validation"} {!running && <span aria-hidden="true">-&gt;</span>}</button>
      </LessonBlock>

      {result && <ValidationResult result={result} />}
      <WhatToLookFor result={result} />
      <EducationalSummary />
      <button className="continue-button" type="button" onClick={() => { window.location.hash = "#evaluate"; }}>Continue to Evaluate <span aria-hidden="true">-&gt;</span></button>
    </ValidateShell>
  );
}

function ValidateShell({ children }) { return <div className="experiment-page preprocess-page validate-page"><ExperimentHeader /><ExperimentProgress activeStep={4} /><main className="preprocess-main">{children}</main></div>; }
function StateMessage({ label, text }) { return <div className="explore-state"><div className="state-badge">{label}</div><p>{text}</p></div>; }
function LessonBlock({ title, explanation, children }) { return <section className="preprocess-section"><p className="section-label">LESSON</p><h2>{title}</h2><p className="preprocess-explanation">{explanation}</p>{children}</section>; }
function SummaryValue({ label, value }) { return <div><span>{label}</span><strong>{value}</strong></div>; }
function ProgressiveLesson({ label, example, why, detail }) { return <div className="progressive-lesson"><div><span className="lesson-tag">BEGINNER IDEA</span><strong>{label}</strong></div><div className="teaching-card"><span>REAL DATA EXAMPLE</span><p>{example}</p></div><div className="teaching-card"><span>WHY IT MATTERS</span><p>{why}</p></div><details><summary>More technical detail</summary><p>{detail}</p></details></div>; }
function ValidationResult({ result }) {
  const metrics = result.validation_metrics;
  const isRegression = result.problem_type === "regression";
  const metricCards = isRegression ? [["MAE", metrics.mae, "Average size of the model's mistake. Lower is generally better."], ["MSE", metrics.mse, "Average squared mistake. Larger errors count more heavily."], ["RMSE", metrics.rmse, "Like MAE, but large mistakes count more heavily. Lower is generally better."], ["R²", metrics.r2, "How much of the target's variation the model explains. Higher is generally better."]] : [["Accuracy", metrics.accuracy, "The share of predictions that were correct."], ["Precision", metrics.precision, "When the model chooses a class, how often it is right."], ["Recall", metrics.recall, "How many real examples of a class the model finds."], ["F1 score", metrics.f1, "A balance between precision and recall."]];
  return <section className="preprocess-section validation-result"><p className="section-label">VALIDATION RESULT</p><h2>How did the model do on unseen data?</h2><div className="metric-cards">{metricCards.map(([label, value, explanation]) => <div className="metric-card" key={label}><span>{label}</span><strong>{formatMetric(value)}</strong><p>{explanation}</p></div>)}</div><p className="preprocess-note">These scores describe the validation examples, not the training examples. They are clues about how useful the learned pattern may be, not proof that the model is perfect.</p><PredictionTable result={result} />{!isRegression && <ConfusionMatrix metrics={metrics} />}</section>;
}
function PredictionTable({ result }) { return <div className="validation-predictions"><h3>Small prediction preview</h3><div className="prediction-table-head"><span>Actual</span><span>Predicted</span><span>{result.problem_type === "regression" ? "Difference" : "Correct?"}</span></div>{result.prediction_preview.map((row, index) => <div className="prediction-table-row" key={`${row.actual}-${index}`}><span>{formatMetric(row.actual)}</span><span>{formatMetric(row.predicted)}</span><strong>{result.problem_type === "regression" ? formatMetric(row.difference) : row.correct ? "Yes" : "No"}</strong></div>)}</div>; }
function ConfusionMatrix({ metrics }) { return <div className="confusion-matrix"><h3>Confusion matrix</h3><p>Each row shows the real class; each column shows the model's chosen class. The numbers count predictions.</p><div className="matrix-grid" style={{ gridTemplateColumns: `repeat(${metrics.labels.length + 1}, minmax(42px, 1fr))` }}><span></span>{metrics.labels.map((label) => <strong key={`head-${label}`}>{label}</strong>)}{metrics.labels.map((label, row) => <Fragment key={`row-${label}`}><strong>{label}</strong>{metrics.confusion_matrix[row].map((value, column) => <span key={`${row}-${column}`}>{value}</span>)}</Fragment>)}</div></div>; }
function WhatToLookFor({ result }) { return <LessonBlock title="What should I look for?" explanation="Validation results need context. We compare the training and validation results to learn what kind of pattern the model found."><div className="validation-look-list"><div><strong>Training much better than validation</strong><span>Possible overfitting: the model may have memorized familiar examples.</span></div><div><strong>Both performances are poor</strong><span>Possible underfitting: the model may be too simple or the features may not help enough.</span></div><div><strong>Results are reasonably similar</strong><span>The model may work more consistently on new examples.</span></div></div>{result && <p className="preprocess-note">{buildResultSummary(result)}</p>}</LessonBlock>; }
function EducationalSummary() { return <section className="preprocess-section educational-summary"><p className="section-label">WHAT TO REMEMBER</p><h2>Validation is a fairness check.</h2><div className="summary-item complete">✓ Training data teaches the model patterns.</div><div className="summary-item complete">✓ Validation data checks predictions on unseen examples.</div><div className="summary-item complete">✓ Metrics are clues about performance, not a promise of perfection.</div><div className="summary-item complete">✓ A strong training result alone is not enough.</div><p className="preprocess-note">Step 06 will bring the experiment together with final evaluation.</p></section>; }
function formatMetric(value) { return typeof value === "number" ? value.toFixed(3) : String(value); }
function buildResultSummary(result) {
  const training = result.training_metrics;
  const validation = result.validation_metrics;
  const gap = result.problem_type === "regression"
    ? training.r2 - validation.r2
    : training.accuracy - validation.accuracy;
  const validationIsWeak = result.problem_type === "regression" ? validation.r2 < 0.2 : validation.accuracy < 0.6;
  if (gap > 0.15) return "Training looks much stronger than validation. This is a possible sign of overfitting: the model may have learned the practice examples too closely.";
  if (validationIsWeak) return "Validation is still weak. This can happen when there is too little data, the features are not useful enough, the model is underfitting, or the model choice does not fit this problem.";
  return "Training and validation are reasonably similar. That is an encouraging sign that the model may be learning a pattern that also works on new examples, but Step 06 will examine performance more carefully.";
}

