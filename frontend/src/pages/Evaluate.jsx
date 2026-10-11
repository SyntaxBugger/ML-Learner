import { useEffect, useState } from "react";
import "../preprocess.css";
import ExperimentHeader from "../components/ExperimentHeader";
import ExperimentProgress from "../components/ExperimentProgress";
import BeginnerExplainer from "../components/playgrounds/BeginnerExplainer";
import MetricExplorerPlayground from "../components/playgrounds/MetricExplorerPlayground";
import { API_BASE } from "../config/api";

const PLAN_KEY = "ml-lab-preprocess-plan";
const TRAIN_KEY = "ml-lab-training-plan";

const DEMO_DATASET = {
  rows: 301,
  columns: ["Car_Name", "Year", "Selling_Price", "Present_Price", "Kms_Driven", "Fuel_Type", "Seller_Type", "Transmission", "Owner"],
  filename: "car_sales_demo.csv",
  is_demo: true,
};

const DEFAULT_PLAN = {
  selectedTarget: "Selling_Price",
  selectedFeatures: ["Present_Price", "Kms_Driven", "Fuel_Type", "Transmission"],
  trainingPercentage: 80,
};

const DEFAULT_TRAIN_PLAN = {
  problemType: "regression",
  modelType: "random_forest_regressor",
};

const NAMES = {
  linear_regression: "Linear Regression",
  decision_tree_regressor: "Decision Tree Regressor",
  random_forest_regressor: "Random Forest Regressor",
  logistic_regression: "Logistic Regression",
  decision_tree_classifier: "Decision Tree Classifier",
  random_forest_classifier: "Random Forest Classifier",
};

export default function Evaluate() {
  const [dataset, setDataset] = useState(DEMO_DATASET);
  const [plan] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(PLAN_KEY) || "null");
      if (saved?.selectedTarget && saved?.selectedFeatures?.length) return saved;
    } catch {
      /* ignore */
    }
    return DEFAULT_PLAN;
  });

  const [trainingPlan] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(TRAIN_KEY) || "null");
      if (saved?.problemType) return saved;
    } catch {
      /* ignore */
    }
    return DEFAULT_TRAIN_PLAN;
  });

  const [tournamentTask, setTournamentTask] = useState(() => trainingPlan.problemType || "regression");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDataset() {
      try {
        const response = await fetch(`${API_BASE}/api/dataset/preprocess`);
        const payload = await response.json();
        if (response.ok && payload.columns?.length) {
          setDataset(payload);
        }
      } catch {
        // Use demo dataset gracefully
      } finally {
        setLoading(false);
      }
    }
    loadDataset();
  }, []);

  async function runEvaluation() {
    setRunning(true);
    setResult(null);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/api/model/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: tournamentTask === "classification" && dataset.categorical_columns?.length
            ? (dataset.categorical_columns.includes(plan.selectedTarget) ? plan.selectedTarget : dataset.categorical_columns[0])
            : plan.selectedTarget,
          features: plan.selectedFeatures,
          training_percentage: plan.trainingPercentage,
          problem_type: tournamentTask,
          random_state: 42,
        }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Evaluation could not be completed.");
      setResult(payload);
    } catch {
      // Provide realistic multi-model benchmark demo matching selected tournament task
      if (tournamentTask === "classification") {
        const simulatedResult = {
          problem_type: "classification",
          best_model: "logistic_regression",
          best_metrics: {
            accuracy: 0.93,
            precision: 0.92,
            recall: 0.94,
            f1: 0.93,
          },
          models: [
            {
              model_type: "logistic_regression",
              accuracy: 0.93,
              precision: 0.92,
              recall: 0.94,
              f1: 0.93,
              training_time_ms: 6,
            },
            {
              model_type: "random_forest_classifier",
              accuracy: 0.92,
              precision: 0.91,
              recall: 0.93,
              f1: 0.92,
              training_time_ms: 52,
            },
            {
              model_type: "decision_tree_classifier",
              accuracy: 0.86,
              precision: 0.85,
              recall: 0.87,
              f1: 0.86,
              training_time_ms: 10,
            },
          ],
          prediction_preview: [
            { actual: "Legitimate (Safe)", predicted: "Legitimate (Safe)", correct: true },
            { actual: "Phishing (Malicious)", predicted: "Phishing (Malicious)", correct: true },
            { actual: "Legitimate (Safe)", predicted: "Legitimate (Safe)", correct: true },
            { actual: "Phishing (Malicious)", predicted: "Phishing (Malicious)", correct: true },
            { actual: "Phishing (Malicious)", predicted: "Legitimate (Safe)", correct: false },
          ],
          test_rows: 61,
          target: "Classification_Target",
          simulated: true,
        };
        setResult(simulatedResult);
      } else {
        const simulatedResult = {
          problem_type: "regression",
          best_model: "random_forest_regressor",
          best_metrics: {
            mae: 1.12,
            rmse: 1.68,
            r2: 0.89,
            accuracy: 0.92,
            f1: 0.91,
          },
          models: [
            {
              model_type: "random_forest_regressor",
              mae: 1.12,
              rmse: 1.68,
              r2: 0.89,
              accuracy: 0.92,
              f1: 0.91,
              training_time_ms: 48,
            },
            {
              model_type: "decision_tree_regressor",
              mae: 1.45,
              rmse: 2.15,
              r2: 0.81,
              accuracy: 0.85,
              f1: 0.84,
              training_time_ms: 12,
            },
            {
              model_type: "linear_regression",
              mae: 1.38,
              rmse: 1.95,
              r2: 0.84,
              accuracy: 0.87,
              f1: 0.86,
              training_time_ms: 8,
            },
          ],
          prediction_preview: [
            { actual: 3.35, predicted: 3.42, absolute_error: 0.07, correct: true },
            { actual: 4.75, predicted: 4.61, absolute_error: 0.14, correct: true },
            { actual: 7.25, predicted: 7.05, absolute_error: 0.20, correct: true },
            { actual: 2.85, predicted: 2.92, absolute_error: 0.07, correct: true },
            { actual: 19.75, predicted: 18.90, absolute_error: 0.85, correct: true },
          ],
          test_rows: 61,
          target: plan.selectedTarget,
          simulated: true,
        };
        setResult(simulatedResult);
      }
    } finally {
      setRunning(false);
    }
  }

  if (loading) {
    return (
      <EvaluateShell>
        <div className="explore-state">
          <div className="state-badge">LOADING</div>
          <p>Setting up your evaluation benchmark...</p>
        </div>
      </EvaluateShell>
    );
  }

  const trainingRows = Math.round((dataset.rows * plan.trainingPercentage) / 100);
  const testRows = dataset.rows - trainingRows;

  return (
    <EvaluateShell>
      <header className="preprocess-heading">
        <div>
          <p className="section-label">STEP 06 / EVALUATE</p>
          <h1>
            Evaluate &amp; Compare
            <br />
            <em>candidate models.</em>
          </h1>
        </div>
        <button
          type="button"
          className="explore-back"
          onClick={() => {
            window.location.hash = "#validate";
          }}
        >
          Back to Validate
        </button>
      </header>

      <p className="preprocess-intro">
        In the real world, data scientists never train just one model and call it a day. We pit multiple candidate 
        algorithms against each other on the exact same test dataset under identical conditions to crown the champion.
      </p>

      {/* SECTION 1: Evaluation Principles */}
      <section className="preprocess-section">
        <p className="section-label">CORE FOUNDATION</p>
        <h2>What Does Proper Evaluation Involve?</h2>
        <p className="preprocess-explanation">
          Evaluation is the ultimate reality check. It involves comparing candidate models on objective 
          statistical criteria rather than guessing which model &quot;feels&quot; fancier.
        </p>

        <BeginnerExplainer
          badge="BENCHMARKING PRINCIPLE"
          title="The Head-to-Head Tournament"
          analogy="Imagine hiring a translator. You wouldn't just hire someone because their resume looks complicated. You hand three applicants the exact same Japanese novel chapter, give them 1 hour, and compare the accuracy and readability of their translations side by side. That identical standardized exam is model evaluation!"
          breakdown={[
            {
              term: "1. Identical Test Conditions",
              text: "Every candidate model (Linear Regression, Decision Tree, Random Forest) is tested on the exact same test rows.",
            },
            {
              term: "2. Standardized Metrics",
              text: "We compute RMSE and MAE for regression, or F1-score and Accuracy for classification across all candidates.",
            },
            {
              term: "3. Simplicity vs Performance (Occam's Razor)",
              text: "If a simple Linear model achieves 95% accuracy and a complex deep tree gets 95.2%, we usually choose the simple model because it is faster and easier to understand.",
            },
            {
              term: "4. Deployment Readiness",
              text: "Once a model wins the tournament, it is ready for deployment to predict real-world data.",
            },
          ]}
          whyItMatters="More complex models are not automatically better! Complex algorithms can overfit, take longer to compute, and act as inscrutable 'black boxes'. Evaluation provides hard mathematical evidence before choosing."
          deepDive="Evaluation uses the test set as the final out-of-sample benchmark. In enterprise ML pipelines, this is often extended to K-Fold Cross Validation (K=5 or 10) to confirm that the model's superiority is statistically significant and not just a fluke of one train/test split."
        />
      </section>

      {/* SECTION 2: Metric Decoders Playground */}
      <section className="preprocess-section">
        <p className="section-label">INTERACTIVE PLAYGROUND</p>
        <h2>Interactive: Deconstructing Metric Trade-offs</h2>
        <p className="preprocess-explanation">
          Discover why accuracy can be a deceptive trap in classification and why RMSE is more sensitive to outliers than MAE.
        </p>

        <MetricExplorerPlayground />
      </section>

      {/* SECTION 3: Tournament Benchmark Execution */}
      <section className="preprocess-section">
        <p className="section-label">TOURNAMENT EXECUTION</p>
        <h2>Compare Candidate Models Head-to-Head</h2>
        <p className="preprocess-explanation">
          Triggers Python to train and benchmark candidate models under identical preprocessing and split constraints.
        </p>

        <div className="problem-choice-grid" style={{ marginBottom: "18px" }}>
          <button
            type="button"
            className={tournamentTask === "regression" ? "problem-choice active" : "problem-choice"}
            onClick={() => {
              setTournamentTask("regression");
              setResult(null);
            }}
          >
            <strong>📈 Regression Tournament</strong>
            <span>Linear Regression vs Decision Tree Regressor vs Random Forest Regressor</span>
          </button>
          <button
            type="button"
            className={tournamentTask === "classification" ? "problem-choice active" : "problem-choice"}
            onClick={() => {
              setTournamentTask("classification");
              setResult(null);
            }}
          >
            <strong>🏷️ Classification Tournament</strong>
            <span>Logistic Regression vs Decision Tree Classifier vs Random Forest Classifier</span>
          </button>
        </div>

        <div className="validation-plan">
          <SummaryValue label="Tournament Task" value={tournamentTask.toUpperCase()} />
          <SummaryValue label="Candidate Models" value={tournamentTask === "classification" ? "Logistic Reg, Dec Tree, Random Forest" : "Linear Reg, Dec Tree, Random Forest"} />
          <SummaryValue label="Training Examples" value={`${trainingRows} rows`} />
          <SummaryValue label="Held-Out Exam" value={`${testRows} test rows`} />
        </div>

        {error && <div className="train-error" style={{ marginTop: "16px" }}>{error}</div>}

        <div style={{ marginTop: "22px" }}>
          <button
            className="continue-button"
            type="button"
            disabled={running}
            onClick={runEvaluation}
            style={{ padding: "16px 28px", fontSize: "16px" }}
          >
            {running ? "Benchmarking Candidate Models..." : `Run ${tournamentTask === "classification" ? "Classification" : "Regression"} Tournament`}
            {!running && <span aria-hidden="true"> 🏆</span>}
          </button>
        </div>

        {result && (
          <div style={{ marginTop: "28px" }}>
            <EvaluationResult result={result} />
            <Interpretation result={result} />
            <FinalCard result={result} />
          </div>
        )}
      </section>
    </EvaluateShell>
  );
}

function EvaluateShell({ children }) {
  return (
    <div className="experiment-page preprocess-page evaluate-page">
      <ExperimentHeader />
      <ExperimentProgress activeStep={5} />
      <main className="preprocess-main">{children}</main>
    </div>
  );
}

function SummaryValue({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatMetric(value) {
  return typeof value === "number" ? value.toFixed(3) : String(value);
}

function EvaluationResult({ result }) {
  const regression = result.problem_type === "regression";
  const mainMetric = regression ? "rmse" : "f1";

  return (
    <div
      className="evaluation-result"
      style={{
        border: "1px solid var(--lime)",
        padding: "24px",
        background: "rgba(215, 243, 107, 0.03)",
        borderRadius: "8px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <p className="section-label" style={{ color: "var(--lime)", margin: "0 0 6px" }}>
            TOURNAMENT LEADERBOARD
          </p>
          <h2 style={{ margin: 0, fontSize: "24px" }}>Candidate Model Benchmark</h2>
        </div>
        {result.simulated && (
          <span
            style={{
              padding: "4px 10px",
              background: "rgba(255, 119, 95, 0.15)",
              color: "var(--coral)",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              borderRadius: "4px",
            }}
          >
            Simulation Preview
          </span>
        )}
      </div>

      <div className="evaluation-table" style={{ marginTop: "18px" }}>
        <div className="evaluation-row evaluation-head">
          <span>Candidate Model</span>
          <span>Primary Score ({regression ? "RMSE ↓" : "F1 Score ↑"})</span>
          <span>Secondary Metrics</span>
          <span>Fit Time</span>
        </div>
        {result.models.map((model) => {
          const isBest = model.model_type === result.best_model;
          return (
            <div
              className={`evaluation-row ${isBest ? "recommended" : ""}`}
              key={model.model_type}
            >
              <strong>
                {NAMES[model.model_type] || model.model_type}
                {isBest && " 🥇 Recommended"}
              </strong>
              <span>
                {regression
                  ? `RMSE ${formatMetric(model.rmse)}`
                  : `F1 ${formatMetric(model.f1)}`}
              </span>
              <span>
                {regression
                  ? `MAE ${formatMetric(model.mae)} / R² ${formatMetric(model.r2)}`
                  : `Accuracy ${formatMetric(model.accuracy)}`}
              </span>
              <span style={{ fontFamily: "var(--font-mono)" }}>{model.training_time_ms} ms</span>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: "24px" }}>
        <MetricChart result={result} regression={regression} />
      </div>

      <div style={{ marginTop: "24px" }}>
        <PredictionTable result={result} regression={regression} mainMetric={mainMetric} />
      </div>
    </div>
  );
}

function MetricChart({ result, regression }) {
  const metric = regression ? "rmse" : "f1";
  const values = result.models.map((model) => model[metric]);
  const maximum = Math.max(...values, 0.0001);

  return (
    <div className="metric-chart" style={{ padding: "18px" }}>
      <h3 style={{ fontSize: "16px" }}>
        {regression ? "RMSE Benchmark (Shorter bar is better!)" : "F1 Benchmark (Longer bar is better!)"}
      </h3>
      {result.models.map((model) => (
        <div className="metric-bar-row" key={model.model_type}>
          <span style={{ fontSize: "13.5px" }}>{NAMES[model.model_type] || model.model_type}</span>
          <div className="metric-bar-track">
            <div
              className={model.model_type === result.best_model ? "metric-bar best" : "metric-bar"}
              style={{ width: `${(model[metric] / maximum) * 100}%` }}
            />
          </div>
          <strong style={{ fontSize: "13.5px" }}>{formatMetric(model[metric])}</strong>
        </div>
      ))}
    </div>
  );
}

function PredictionTable({ result, regression }) {
  return (
    <div className="validation-predictions">
      <h3 style={{ fontSize: "16px" }}>Sample Prediction Verification from Winning Model</h3>
      <div className="prediction-table-head">
        <span>Actual Truth</span>
        <span>Predicted Value</span>
        <span>{regression ? "Absolute Error" : "Correct?"}</span>
      </div>
      {result.prediction_preview.map((row, index) => (
        <div className="prediction-table-row" key={`${row.actual}-${index}`}>
          <span>{formatMetric(row.actual)}</span>
          <span>{formatMetric(row.predicted)}</span>
          <strong style={{ color: "var(--lime)" }}>
            {regression ? `±${formatMetric(row.absolute_error)}` : row.correct ? "✅ Correct" : "❌ Incorrect"}
          </strong>
        </div>
      ))}
    </div>
  );
}

function Interpretation({ result }) {
  const best = result.best_metrics;
  const regression = result.problem_type === "regression";
  const summarySentence = regression
    ? `The winning model (${NAMES[result.best_model]}) achieved an MAE of ${formatMetric(best.mae)} and an RMSE of ${formatMetric(best.rmse)}, explaining ${(best.r2 * 100).toFixed(1)}% of price variance.`
    : `The winning model (${NAMES[result.best_model]}) achieved ${formatMetric(best.accuracy * 100)}% accuracy with a balanced F1 score of ${formatMetric(best.f1)}.`;

  return (
    <section className="preprocess-section" style={{ marginTop: "24px" }}>
      <p className="section-label">INTERPRETATION</p>
      <h2>What Does This Mean for Real-World Use?</h2>
      <p className="preprocess-explanation">{summarySentence}</p>

      <div className="validation-look-list">
        <div>
          <strong>1. Margin of Error</strong>
          <span>
            {regression
              ? `You can expect real price predictions to be within approximately ±${formatMetric(best.mae)} units of reality on average.`
              : `The model correctly identifies the target category with strong precision and recall.`}
          </span>
        </div>
        <div>
          <strong>2. Model Robustness</strong>
          <span>
            The Random Forest Ensemble dampens individual tree errors by taking a majority vote across 100 trees, preventing runaway overfitting.
          </span>
        </div>
        <div>
          <strong>3. When to Retrain</strong>
          <span>
            If real-world market dynamics shift (e.g. inflation, new fuel standards), new data should be gathered and fed back into Step 01 to refresh the weights.
          </span>
        </div>
      </div>
    </section>
  );
}

function FinalCard({ result }) {
  return (
    <section
      className="preprocess-section final-result"
      style={{
        marginTop: "28px",
        padding: "24px",
        background: "var(--panel)",
        border: "1px solid var(--lime)",
        borderRadius: "8px",
      }}
    >
      <p className="section-label" style={{ color: "var(--lime)", margin: "0 0 6px" }}>
        CYCLE COMPLETE
      </p>
      <h2 style={{ margin: "0 0 10px", fontSize: "24px" }}>
        {NAMES[result.best_model]} is Recommended for Deployment!
      </h2>
      <p className="preprocess-explanation" style={{ margin: 0 }}>
        You have successfully explored raw data, preprocessed features, split validation partitions, 
        trained algorithms, and evaluated model performance using scientific criteria.
      </p>

      <div className="final-actions" style={{ marginTop: "22px" }}>
        <button
          className="continue-button"
          type="button"
          onClick={() => {
            window.location.hash = "#train";
          }}
          style={{ padding: "14px 22px" }}
        >
          Return to Train Another Model
        </button>
        <button
          className="explore-back"
          type="button"
          onClick={() => {
            window.location.hash = "#explore";
          }}
        >
          Review Data Exploration
        </button>
        <button
          className="explore-back"
          type="button"
          onClick={() => {
            window.location.hash = "#experiment";
            sessionStorage.removeItem(PLAN_KEY);
            sessionStorage.removeItem(TRAIN_KEY);
          }}
        >
          Start a Fresh Experiment
        </button>
      </div>
    </section>
  );
}
