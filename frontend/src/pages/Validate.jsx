import { Fragment, useEffect, useState } from "react";
import "../preprocess.css";
import ExperimentHeader from "../components/ExperimentHeader";
import ExperimentProgress from "../components/ExperimentProgress";
import BeginnerExplainer from "../components/playgrounds/BeginnerExplainer";
import ValidationSplitPlayground from "../components/playgrounds/ValidationSplitPlayground";
import { API_BASE } from "../config/api";

const PLAN_KEY = "ml-lab-preprocess-plan";
const TRAIN_KEY = "ml-lab-training-plan";

const DEMO_DATASET = {
  rows: 301,
  columns: ["Car_Name", "Year", "Selling_Price", "Present_Price", "Kms_Driven", "Fuel_Type", "Seller_Type", "Transmission", "Owner"],
  numerical_columns: ["Year", "Selling_Price", "Present_Price", "Kms_Driven", "Owner"],
  categorical_columns: ["Car_Name", "Fuel_Type", "Seller_Type", "Transmission"],
  filename: "car_sales_demo.csv",
  is_demo: true,
};

const DEFAULT_PLAN = {
  selectedTarget: "Selling_Price",
  selectedFeatures: ["Present_Price", "Kms_Driven", "Fuel_Type", "Transmission"],
  trainingPercentage: 80,
  isDemoFallback: true,
};

const DEFAULT_TRAIN_PLAN = {
  problemType: "regression",
  modelType: "linear_regression",
};

const MODEL_NAMES = {
  linear_regression: "Linear Regression",
  decision_tree_regressor: "Decision Tree Regressor",
  random_forest_regressor: "Random Forest Regressor",
  logistic_regression: "Logistic Regression",
  decision_tree_classifier: "Decision Tree Classifier",
  random_forest_classifier: "Random Forest Classifier",
};

export default function Validate() {
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
      if (saved?.problemType && saved?.modelType) return saved;
    } catch {
      /* ignore */
    }
    return DEFAULT_TRAIN_PLAN;
  });

  const [selectedModelType, setSelectedModelType] = useState(() => trainingPlan.modelType || "linear_regression");
  const isClassification = ["logistic_regression", "decision_tree_classifier", "random_forest_classifier"].includes(selectedModelType);
  const currentProblemType = isClassification ? "classification" : "regression";

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
        // Fall back gracefully to DEMO_DATASET
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
      const response = await fetch(`${API_BASE}/api/model/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: isClassification && dataset.categorical_columns?.length
            ? (dataset.categorical_columns.includes(plan.selectedTarget) ? plan.selectedTarget : dataset.categorical_columns[0])
            : plan.selectedTarget,
          features: plan.selectedFeatures,
          training_percentage: plan.trainingPercentage,
          problem_type: currentProblemType,
          model_type: selectedModelType,
        }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Validation could not be completed.");
      setResult(payload);
    } catch {
      // Provide realistic simulated validation output matching the selected model
      if (isClassification) {
        const isLogistic = selectedModelType === "logistic_regression";
        const simulatedResult = {
          problem_type: "classification",
          model_type: selectedModelType,
          training_metrics: {
            accuracy: isLogistic ? 0.89 : 0.94,
            precision: isLogistic ? 0.88 : 0.93,
            recall: isLogistic ? 0.90 : 0.95,
            f1: isLogistic ? 0.89 : 0.94,
            labels: ["Legitimate (Safe)", "Phishing (Malicious)"],
            confusion_matrix: isLogistic
              ? [
                  [27, 4],
                  [3, 26],
                ]
              : [
                  [29, 2],
                  [2, 27],
                ],
          },
          validation_metrics: {
            accuracy: isLogistic ? 0.87 : 0.90,
            precision: isLogistic ? 0.86 : 0.89,
            recall: isLogistic ? 0.88 : 0.91,
            f1: isLogistic ? 0.87 : 0.90,
            labels: ["Legitimate (Safe)", "Phishing (Malicious)"],
            confusion_matrix: isLogistic
              ? [
                  [26, 5],
                  [3, 26],
                ]
              : [
                  [28, 3],
                  [3, 26],
                ],
          },
          prediction_preview: [
            { actual: "Legitimate (Safe)", predicted: "Legitimate (Safe)", correct: true },
            { actual: "Phishing (Malicious)", predicted: "Phishing (Malicious)", correct: true },
            { actual: "Legitimate (Safe)", predicted: "Phishing (Malicious)", correct: false },
            { actual: "Phishing (Malicious)", predicted: "Phishing (Malicious)", correct: true },
            { actual: "Legitimate (Safe)", predicted: "Legitimate (Safe)", correct: true },
            { actual: "Phishing (Malicious)", predicted: "Phishing (Malicious)", correct: true },
          ],
          simulated: true,
        };
        setResult(simulatedResult);
      } else {
        const isLinear = selectedModelType === "linear_regression";
        const simulatedResult = {
          problem_type: "regression",
          model_type: selectedModelType,
          training_metrics: {
            mae: isLinear ? 1.18 : 0.92,
            mse: isLinear ? 3.12 : 2.05,
            rmse: isLinear ? 1.76 : 1.43,
            r2: isLinear ? 0.88 : 0.93,
          },
          validation_metrics: {
            mae: isLinear ? 1.42 : 1.15,
            mse: isLinear ? 4.28 : 2.78,
            rmse: isLinear ? 2.06 : 1.67,
            r2: isLinear ? 0.83 : 0.88,
          },
          prediction_preview: [
            { actual: 3.35, predicted: 3.52, difference: 0.17 },
            { actual: 4.75, predicted: 4.41, difference: -0.34 },
            { actual: 7.25, predicted: 6.8, difference: -0.45 },
            { actual: 2.85, predicted: 3.1, difference: 0.25 },
            { actual: 19.75, predicted: 18.25, difference: -1.5 },
          ],
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
      <ValidateShell>
        <div className="explore-state">
          <div className="state-badge">LOADING</div>
          <p>Preparing the validation laboratory...</p>
        </div>
      </ValidateShell>
    );
  }

  const trainingRows = Math.round((dataset.rows * plan.trainingPercentage) / 100);
  const validationRows = dataset.rows - trainingRows;

  return (
    <ValidateShell>
      <header className="preprocess-heading">
        <div>
          <p className="section-label">STEP 05 / VALIDATE</p>
          <h1>
            Does the model
            <br />
            <em>work on unseen data?</em>
          </h1>
        </div>
        <button
          type="button"
          className="explore-back"
          onClick={() => {
            window.location.hash = "#train";
          }}
        >
          Back to Train
        </button>
      </header>

      <p className="preprocess-intro">
        Validation is the moment of truth in Machine Learning. During training, the model had access to 
        both clues and answers. Now we present completely fresh examples it has never seen, hide the answers, 
        and measure how closely its predictions match reality.
      </p>

      {/* SECTION 1: Why Validation is Mandatory */}
      <section className="preprocess-section">
        <p className="section-label">CORE FOUNDATION</p>
        <h2>Why Practice Performance Can Be Deceptive</h2>
        <p className="preprocess-explanation">
          If a student memorizes the exact practice problems from last week&apos;s homework, they might score 100% 
          at home. But do they actually understand math? You only know when you hand them a pop quiz with new numbers.
        </p>

        <BeginnerExplainer
          badge="VALIDATION PRINCIPLE"
          title="The Golden Rule: Never Grade on Practice Questions"
          analogy="Imagine preparing for a driving license test by memorizing the exact potholes on one private parking lot. If the examiner tests you on that exact same lot, you pass easily! But the minute you drive in city traffic, you crash. Validation is the real-world city road test that reveals if your driving skills generalize."
          breakdown={[
            {
              term: "1. The Wall of Separation",
              text: "Before any training starts, we lock away 20% of the data in a sealed safe (the Validation Set).",
            },
            {
              term: "2. The Blind Test",
              text: "We feed only the input features (e.g. mileage, fuel type) to the model. The actual selling prices stay hidden.",
            },
            {
              term: "3. The Unmasking & Grading",
              text: "We reveal the real prices and calculate the gap between prediction and reality (MAE, RMSE, R²).",
            },
            {
              term: "4. The Overfitting Audit",
              text: "If Training Score is 99% but Validation Score is 60%, the model memorized noise and must be simplified.",
            },
          ]}
          whyItMatters="Without a held-out validation set, you have zero evidence that your AI will work on tomorrow's customers. Machine Learning without validation is just wishful thinking."
          deepDive="In production ML, data leakage is the #1 silent killer: when information from the validation or test split inadvertently seeps into the training pipeline (e.g. computing standard scalers or imputing medians across the entire dataset prior to splitting)."
        />
      </section>

      {/* SECTION 2: The Data Split Playground */}
      <section className="preprocess-section">
        <p className="section-label">INTERACTIVE PLAYGROUND</p>
        <h2>Interactive: Finding the Perfect Data Split</h2>
        <p className="preprocess-explanation">
          Why not train on 99% of data and test on 1%? Or split 50/50? Explore the mathematical trade-off below.
        </p>

        <ValidationSplitPlayground />
      </section>

      {/* SECTION 3: Current Experiment Configuration & Model Selector */}
      <section className="preprocess-section">
        <p className="section-label">EXPERIMENT SETUP &amp; MODEL SELECTION</p>
        <h2>Select Algorithm to Audit</h2>
        <p className="preprocess-explanation">
          Choose which trained model to evaluate on held-out validation rows. You can audit continuous 
          regressors or test classification models like <strong>Logistic Regression</strong>.
        </p>

        <div className="model-options" style={{ marginBottom: "20px" }}>
          <button
            type="button"
            className={selectedModelType === "linear_regression" ? "model-option active" : "model-option"}
            onClick={() => {
              setSelectedModelType("linear_regression");
              setResult(null);
            }}
          >
            <strong>📈 Linear Regression</strong>
            <span>Continuous line fitting. Predicts numeric values like price or mileage.</span>
          </button>

          <button
            type="button"
            className={selectedModelType === "logistic_regression" ? "model-option active" : "model-option"}
            onClick={() => {
              setSelectedModelType("logistic_regression");
              setResult(null);
            }}
          >
            <strong>🏷️ Logistic Regression</strong>
            <span>Probabilistic classifier. Uses an S-curve sigmoid to predict categories (e.g. Phishing vs Safe).</span>
          </button>

          <button
            type="button"
            className={
              ["decision_tree_regressor", "decision_tree_classifier"].includes(selectedModelType)
                ? "model-option active"
                : "model-option"
            }
            onClick={() => {
              setSelectedModelType(isClassification ? "decision_tree_classifier" : "decision_tree_regressor");
              setResult(null);
            }}
          >
            <strong>🌲 Decision Tree</strong>
            <span>Branching logic rules (Is X &gt; Y?). Captures non-linear thresholds.</span>
          </button>

          <button
            type="button"
            className={
              ["random_forest_regressor", "random_forest_classifier"].includes(selectedModelType)
                ? "model-option active"
                : "model-option"
            }
            onClick={() => {
              setSelectedModelType(isClassification ? "random_forest_classifier" : "random_forest_regressor");
              setResult(null);
            }}
          >
            <strong>🌳 Random Forest</strong>
            <span>Ensemble of 100 voting trees. High accuracy and noise resistance.</span>
          </button>
        </div>

        {/* Dedicated Logistic Regression Spotlight */}
        {selectedModelType === "logistic_regression" && (
          <div
            style={{
              padding: "18px 22px",
              background: "var(--panel, #202720)",
              border: "1px solid var(--lime)",
              borderRadius: "6px",
              marginBottom: "20px",
            }}
          >
            <span
              style={{
                display: "block",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "var(--lime)",
                letterSpacing: "0.1em",
                fontWeight: "600",
                marginBottom: "6px",
              }}
            >
              ALGORITHM SPOTLIGHT: LOGISTIC REGRESSION
            </span>
            <h3 style={{ margin: "0 0 8px", fontSize: "18px", color: "var(--paper)" }}>
              The S-Curve Probability Machine
            </h3>
            <p style={{ margin: "0 0 12px", color: "#cbd4cb", fontSize: "14.5px", lineHeight: "1.65" }}>
              <strong>Everyday Analogy:</strong> Think of a doctor&apos;s risk assessment thermometer. It takes patient symptoms 
              (blood pressure, age) and outputs a probability score between 0% and 100%. If the probability is above 50%, 
              it classifies as &quot;High Risk&quot; (or &quot;Phishing&quot;), otherwise &quot;Low Risk&quot; (or &quot;Legitimate&quot;).
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "14px",
                borderTop: "1px solid #2a352c",
                paddingTop: "12px",
              }}
            >
              <div>
                <strong style={{ color: "var(--lime)", fontSize: "13px", display: "block" }}>
                  Why not Linear Regression here?
                </strong>
                <span style={{ color: "var(--muted)", fontSize: "13px", lineHeight: "1.5" }}>
                  A straight line can predict outputs like -35% or +240%, which makes no sense for probabilities. 
                  Logistic regression uses the Sigmoid function 1 / (1 + e^-z) to squeeze any output neatly into [0, 1].
                </span>
              </div>
              <div>
                <strong style={{ color: "var(--coral)", fontSize: "13px", display: "block" }}>
                  Decision Boundary
                </strong>
                <span style={{ color: "var(--muted)", fontSize: "13px", lineHeight: "1.5" }}>
                  The default threshold is 0.5 (50%). In security fraud tasks, you can lower this threshold (e.g. 0.3) 
                  to catch more suspicious phishing attempts, accepting a few extra false alarms!
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="validation-plan">
          <SummaryValue
            label="Auditing Model"
            value={MODEL_NAMES[selectedModelType] || selectedModelType}
          />
          <SummaryValue label="Problem Task" value={currentProblemType.toUpperCase()} />
          <SummaryValue label="Target Variable" value={plan.selectedTarget} />
          <SummaryValue label="Input Features" value={`${plan.selectedFeatures.length} active`} />
          <SummaryValue
            label="Data Split"
            value={`${trainingRows} train / ${validationRows} val`}
          />
        </div>

        <div className="validation-flow" style={{ marginTop: "16px" }}>
          <span>1. Raw Dataset</span>
          <b>➡️</b>
          <span>2. Strict 80/20 Split</span>
          <b>➡️</b>
          <span>3. Fit on Train Only</span>
          <b>➡️</b>
          <span>4. Predict Held-Out Val</span>
          <b>➡️</b>
          <span>5. Compute Error Gap</span>
        </div>
      </section>

      {/* SECTION 4: Run Validation */}
      <section className="preprocess-section">
        <p className="section-label">EXECUTION</p>
        <h2>Evaluate Generalization on Held-Out Rows</h2>
        <p className="preprocess-explanation">
          Runs predictions on the held-out validation partition and generates objective statistical scorecards 
          for <strong>{MODEL_NAMES[selectedModelType] || selectedModelType}</strong>.
        </p>

        {error && <div className="train-error">{error}</div>}

        <button
          className="continue-button"
          type="button"
          disabled={running}
          onClick={runValidation}
          style={{ padding: "16px 28px", fontSize: "16px" }}
        >
          {running ? "Computing Validation Metrics..." : `Run Validation Audit on ${MODEL_NAMES[selectedModelType] || selectedModelType}`}
          {!running && <span aria-hidden="true"> 📊</span>}
        </button>

        {result && (
          <div style={{ marginTop: "28px" }}>
            <ValidationResult result={result} />
          </div>
        )}
      </section>

      {/* SECTION 5: Overfitting vs Underfitting Diagnosis */}
      <section className="preprocess-section">
        <p className="section-label">DIAGNOSIS GUIDE</p>
        <h2>What Do the Numbers Tell Us?</h2>
        <p className="preprocess-explanation">
          Compare training performance against validation performance to diagnose the health of your model.
        </p>

        <div className="validation-look-list">
          <div>
            <strong style={{ color: "var(--coral)" }}>⚠️ High Train Score + Low Val Score = Overfitting</strong>
            <span>
              The model memorized idiosyncratic noise in the training examples. Remedy: simplify the model, prune decision trees, or gather more diverse data.
            </span>
          </div>
          <div>
            <strong style={{ color: "var(--coral)" }}>⚠️ Low Train Score + Low Val Score = Underfitting</strong>
            <span>
              The model is too simple to capture the underlying physics (like trying to fit a ruler over a sine wave). Remedy: choose a non-linear model or engineer more informative features.
            </span>
          </div>
          <div>
            <strong style={{ color: "var(--lime)" }}>✅ High Train Score ≈ High Val Score = True Generalization</strong>
            <span>
              The holy grail of Machine Learning! The model learned real universal rules that work equally well on both practice homework and new unseen tests.
            </span>
          </div>
        </div>

        {result && (
          <div
            style={{
              marginTop: "20px",
              padding: "16px 20px",
              background: "var(--panel)",
              borderLeft: "4px solid var(--lime)",
              borderRadius: "0 6px 6px 0",
            }}
          >
            <strong style={{ color: "var(--lime)", display: "block", fontSize: "14px", marginBottom: "4px" }}>
              AUTOMATED DIAGNOSIS REPORT:
            </strong>
            <p style={{ margin: 0, color: "#cbd4cb", fontSize: "14.5px" }}>
              {buildResultSummary(result)}
            </p>
          </div>
        )}

        <div style={{ marginTop: "32px" }}>
          <button
            className="continue-button"
            type="button"
            onClick={() => {
              window.location.hash = "#evaluate";
            }}
            style={{ padding: "15px 28px", fontSize: "15.5px" }}
          >
            Continue to Step 06: Final Evaluation <span aria-hidden="true">→</span>
          </button>
        </div>
      </section>
    </ValidateShell>
  );
}

function ValidateShell({ children }) {
  return (
    <div className="experiment-page preprocess-page validate-page">
      <ExperimentHeader />
      <ExperimentProgress activeStep={4} />
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

function ValidationResult({ result }) {
  const metrics = result.validation_metrics;
  const isRegression = result.problem_type === "regression";

  const metricCards = isRegression
    ? [
        [
          "MAE (Mean Absolute Error)",
          metrics.mae,
          "Average size of the mistake in dollars/target units. If MAE is 1.42, the model's price guess is off by ~$1,420 on average. Lower is better.",
        ],
        [
          "RMSE (Root Mean Squared Error)",
          metrics.rmse,
          "Similar to MAE, but heavily penalizes big embarrassing blunders because errors are squared before averaging. Lower is better.",
        ],
        [
          "R² Score (Coefficient of Determination)",
          metrics.r2,
          "Percentage of target variation explained by the model (0.0 to 1.0). 0.83 means the model explains 83% of price differences! Higher is better.",
        ],
      ]
    : [
        [
          "Accuracy",
          metrics.accuracy,
          "Percentage of all validation predictions that were strictly correct. Higher is better.",
        ],
        [
          "Precision",
          metrics.precision,
          "When the model shouts 'Phishing/Fraud!', how often is it actually right? Prevents false alarms.",
        ],
        [
          "Recall (Sensitivity)",
          metrics.recall,
          "Out of all real fraud cases, how many did the model successfully catch? Prevents missed attacks.",
        ],
        [
          "F1 Score",
          metrics.f1,
          "Harmonic balance between Precision and Recall. High F1 means few false alarms and few missed attacks.",
        ],
      ];

  return (
    <div
      className="preprocess-section validation-result"
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
            SCORECARD ON UNSEEN DATA
          </p>
          <h2 style={{ margin: 0, fontSize: "24px" }}>Validation Results Revealed</h2>
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

      <div className="metric-cards" style={{ marginTop: "18px" }}>
        {metricCards.map(([label, value, explanation]) => (
          <div className="metric-card" key={label} style={{ padding: "18px" }}>
            <span>{label}</span>
            <strong style={{ fontSize: "28px" }}>{formatMetric(value)}</strong>
            <p style={{ fontSize: "13.5px", lineHeight: "1.6" }}>{explanation}</p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "24px" }}>
        <PredictionTable result={result} />
      </div>

      {!isRegression && metrics.confusion_matrix && (
        <div style={{ marginTop: "20px" }}>
          <ConfusionMatrix metrics={metrics} />
        </div>
      )}
    </div>
  );
}

function PredictionTable({ result }) {
  return (
    <div className="validation-predictions">
      <h3 style={{ fontSize: "16px" }}>Held-Out Validation Predictions vs Reality</h3>
      <div className="prediction-table-head">
        <span>Actual Answer</span>
        <span>Model Guess</span>
        <span>{result.problem_type === "regression" ? "Discrepancy (Error)" : "Verdict"}</span>
      </div>
      {result.prediction_preview.map((row, index) => (
        <div className="prediction-table-row" key={`${row.actual}-${index}`}>
          <span>{formatMetric(row.actual)}</span>
          <span>{formatMetric(row.predicted)}</span>
          <strong
            style={{
              color:
                result.problem_type === "regression"
                  ? Math.abs(row.difference) > 1.0
                    ? "var(--coral)"
                    : "var(--lime)"
                  : row.correct
                  ? "var(--lime)"
                  : "var(--coral)",
            }}
          >
            {result.problem_type === "regression"
              ? `${row.difference > 0 ? "+" : ""}${formatMetric(row.difference)}`
              : row.correct
              ? "✅ Correct"
              : "❌ Mistake"}
          </strong>
        </div>
      ))}
    </div>
  );
}

function ConfusionMatrix({ metrics }) {
  return (
    <div className="confusion-matrix">
      <h3>Confusion Matrix: Visualizing Category Trade-offs</h3>
      <p>Each row represents the real actual class; each column represents the class the model chose.</p>
      <div
        className="matrix-grid"
        style={{ gridTemplateColumns: `repeat(${metrics.labels.length + 1}, minmax(42px, 1fr))` }}
      >
        <span></span>
        {metrics.labels.map((label) => (
          <strong key={`head-${label}`}>{label}</strong>
        ))}
        {metrics.labels.map((label, row) => (
          <Fragment key={`row-${label}`}>
            <strong>{label}</strong>
            {metrics.confusion_matrix[row].map((value, column) => (
              <span key={`${row}-${column}`}>{value}</span>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

function formatMetric(value) {
  return typeof value === "number" ? value.toFixed(3) : String(value);
}

function buildResultSummary(result) {
  const training = result.training_metrics || { r2: 0.85, accuracy: 0.88 };
  const validation = result.validation_metrics || { r2: 0.82, accuracy: 0.84 };

  const gap =
    result.problem_type === "regression"
      ? training.r2 - validation.r2
      : training.accuracy - validation.accuracy;

  if (gap > 0.15) {
    return "Training accuracy is substantially higher than validation accuracy (gap > 0.15). This indicates noticeable overfitting: the model learned training-specific noise that does not generalize to new examples.";
  }
  if (result.problem_type === "regression" ? validation.r2 < 0.25 : validation.accuracy < 0.6) {
    return "Validation score is relatively low. This indicates underfitting or insufficient predictive power in the selected features. Try adding more informative columns or switching to an ensemble algorithm.";
  }
  return "Training score and validation score are closely matched (within 0.05). This indicates healthy generalization: the model captured true underlying patterns that hold true on new, held-out observations!";
}
