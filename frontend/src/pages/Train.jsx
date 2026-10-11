import { useEffect, useState } from "react";
import "../preprocess.css";
import ExperimentHeader from "../components/ExperimentHeader";
import ExperimentProgress from "../components/ExperimentProgress";
import BeginnerExplainer from "../components/playgrounds/BeginnerExplainer";
import ModelIntuitionPlayground from "../components/playgrounds/ModelIntuitionPlayground";
import { API_BASE } from "../config/api";

const PLAN_KEY = "ml-lab-preprocess-plan";
const TRAIN_KEY = "ml-lab-training-plan";

const DEMO_DATASET = {
  columns: ["Car_Name", "Year", "Selling_Price", "Present_Price", "Kms_Driven", "Fuel_Type", "Seller_Type", "Transmission", "Owner"],
  numerical_columns: ["Year", "Selling_Price", "Present_Price", "Kms_Driven", "Owner"],
  categorical_columns: ["Car_Name", "Fuel_Type", "Seller_Type", "Transmission"],
  rows: 301,
  filename: "car_sales_demo.csv",
  is_demo: true,
};

const DEFAULT_PLAN = {
  selectedTarget: "Selling_Price",
  selectedFeatures: ["Present_Price", "Kms_Driven", "Fuel_Type", "Transmission"],
  trainingPercentage: 80,
  isDemoFallback: true,
};

const MODEL_OPTIONS = {
  regression: [
    ["linear_regression", "Linear Regression", "Finds the single best straight line y = mx + b following the data pattern."],
    ["decision_tree_regressor", "Decision Tree Regressor", "Asks a branching sequence of Yes/No questions (e.g. Is Mileage > 50k?) to predict a number."],
    ["random_forest_regressor", "Random Forest Regressor", "Assembles 100 decision trees to vote and average their guesses together."],
  ],
  classification: [
    ["logistic_regression", "Logistic Regression", "Estimates the S-curve probability that an example belongs to a class."],
    ["decision_tree_classifier", "Decision Tree Classifier", "Asks Yes/No questions to branch down and pick a category."],
    ["random_forest_classifier", "Random Forest Classifier", "Combines a forest of voting trees to assign the most reliable category."],
  ],
};

export default function Train() {
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

  const [userProblemType, setUserProblemType] = useState(null);
  const problemType = userProblemType || getSuggestedProblemType(dataset, plan.selectedTarget);

  const [userModelType, setUserModelType] = useState(null);
  const defaultModelType = MODEL_OPTIONS[problemType]?.[0]?.[0] || "linear_regression";
  const modelType = userModelType || defaultModelType;

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
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
        // Fall back gracefully to DEMO_DATASET so user is never blocked
      } finally {
        setLoading(false);
      }
    }
    loadDataset();
  }, []);

  async function handleTrain() {
    setTraining(true);
    setError("");
    setResult(null);

    const planPayload = { problemType, modelType };
    sessionStorage.setItem(TRAIN_KEY, JSON.stringify(planPayload));

    try {
      const response = await fetch(`${API_BASE}/api/model/train`, {
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
    } catch {
      // If backend has no uploaded dataset in session, provide simulated demonstration
      const trainingRows = Math.round((dataset.rows * plan.trainingPercentage) / 100);
      const testingRows = dataset.rows - trainingRows;
      const demoResult = {
        model_type: modelType,
        problem_type: problemType,
        training_rows: trainingRows,
        testing_rows: testingRows,
        target: plan.selectedTarget,
        features: plan.selectedFeatures,
        prediction_preview: [
          { actual: 3.35, prediction: 3.48 },
          { actual: 4.75, prediction: 4.62 },
          { actual: 7.25, prediction: 6.95 },
          { actual: 2.85, prediction: 2.92 },
          { actual: 19.75, prediction: 18.8 },
        ],
        simulated: true,
      };
      setResult(demoResult);
    } finally {
      setTraining(false);
    }
  }

  if (loading) {
    return (
      <TrainShell>
        <div className="explore-state">
          <div className="state-badge">PREPARING LAB</div>
          <p>Setting up your training environment...</p>
        </div>
      </TrainShell>
    );
  }

  const models = MODEL_OPTIONS[problemType] || MODEL_OPTIONS.regression;
  const trainingRows = Math.round((dataset.rows * plan.trainingPercentage) / 100);
  const testingRows = dataset.rows - trainingRows;
  const selectedModel = models.find(([key]) => key === modelType) || models[0];

  return (
    <TrainShell>
      <header className="preprocess-heading">
        <div>
          <p className="section-label">STEP 04 / TRAIN</p>
          <h1>
            Let the model
            <br />
            <em>learn from data.</em>
          </h1>
        </div>
        <button
          type="button"
          className="explore-back"
          onClick={() => {
            window.location.hash = "#preprocess";
          }}
        >
          Back to Preprocess
        </button>
      </header>

      <p className="preprocess-intro">
        In traditional programming, humans write explicit IF/THEN rules by hand. In Machine Learning, 
        the computer studies hundreds or thousands of historical examples, notices mathematical patterns, 
        and adjusts internal parameters until its guesses match reality.
      </p>

      {plan.isDemoFallback && (
        <div
          style={{
            margin: "20px 0",
            padding: "16px 20px",
            background: "rgba(215, 243, 107, 0.05)",
            border: "1px solid var(--lime)",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <span style={{ fontSize: "20px" }}>💡</span>
          <div>
            <strong style={{ color: "var(--lime)", display: "block", fontSize: "14.5px" }}>
              Interactive Demo Mode Active
            </strong>
            <span style={{ color: "var(--muted)", fontSize: "13px" }}>
              Loaded realistic car valuation data with Target = <strong>{plan.selectedTarget}</strong> and{" "}
              {plan.selectedFeatures.length} features. You can freely explore the lessons and train models!
            </span>
          </div>
        </div>
      )}

      {/* SECTION 1: What is Machine Learning? */}
      <section className="preprocess-section">
        <p className="section-label">CORE FOUNDATION</p>
        <h2>What does &quot;Training&quot; actually mean?</h2>
        <p className="preprocess-explanation">
          Computers do not possess human wisdom or conscious intuition. When an ML model &quot;trains&quot;, it is running 
          an optimization loop: making a guess, calculating how wrong it was, and tweaking its internal dials.
        </p>

        <BeginnerExplainer
          badge="FOUNDATIONAL CONCEPT"
          title="How Machines Learn: The Optimization Loop"
          analogy="Imagine you are practicing basketball free throws blindfolded. Every time you shoot, a friend tells you: 'You were 1 foot too far to the left!' You adjust your wrist slightly. Next shot: '6 inches too short!' You push a bit harder. After 500 shots, your muscle memory has learned the exact arc. That feedback loop is exactly how a machine learning model adjusts its weights!"
          breakdown={[
            {
              term: "1. The Forward Pass (Guessing)",
              text: "The model receives input clues (e.g. Mileage = 45,000, Age = 5) and makes a blind initial guess at the price (e.g. '$3,000').",
            },
            {
              term: "2. The Loss Calculation (Checking the Error)",
              text: "It compares its guess with the real known answer ($7,500). The difference is the Error (Loss = $4,500).",
            },
            {
              term: "3. Backpropagation & Weight Updates (Tweaking the Dials)",
              text: "The algorithm calculates which features caused the error and updates internal weights to guess closer next time.",
            },
            {
              term: "4. Iteration Until Convergence",
              text: "The model repeats this process over all rows in the training set hundreds of times until errors stop shrinking.",
            },
          ]}
          whyItMatters="If a model only ever memorizes the practice questions (like cramming an exam cheat sheet), it will fail when asked new questions. The goal is Generalization: learning the underlying physics of the problem so it predicts unseen examples accurately."
          deepDive="Mathematically, training minimizes a Loss Function L(w) using techniques like Gradient Descent or Closed-Form Ordinary Least Squares. For linear models, the algorithm solves for weights w in y_hat = w0 + w1*x1 + ... + wn*xn such that the sum of squared residuals is minimized."
        />

        <div className="basics-definition-grid">
          <SummaryValue label="Dataset" value="A table of historical records" />
          <SummaryValue label="Row (Sample)" value="One specific item or example" />
          <SummaryValue label="Features (X)" value="The input clues or ingredients" />
          <SummaryValue label="Target (y)" value="The exact answer to predict" />
          <SummaryValue label="Weights" value="Internal dials adjusted during learning" />
          <SummaryValue label="Loss / Error" value="Distance between guess & reality" />
          <SummaryValue label="Generalization" value="Performance on new, unseen data" />
          <SummaryValue label="Convergence" value="When the model stops improving" />
        </div>
      </section>

      {/* SECTION 2: Problem Types - Regression vs Classification */}
      <section className="preprocess-section">
        <p className="section-label">TASK SELECTION</p>
        <h2>Regression vs. Classification: Choosing the Right Game</h2>
        <p className="preprocess-explanation">
          Every supervised learning problem belongs to one of two main families based on what kind of answer 
          you want the computer to produce.
        </p>

        <BeginnerExplainer
          badge="TASK TAXONOMY"
          title="Numbers vs. Categories"
          analogy="Regression is like guessing how many jellybeans are in a jar: the answer can be 412, 413, or 412.5 on a continuous spectrum. Classification is like sorting mail into bins marked 'Bills', 'Letters', and 'Junk': the answer is a distinct category from a fixed set of choices."
          breakdown={[
            {
              term: "Regression (Continuous Output)",
              text: "Used when the target is a measurable number: House Price ($), Temperature (°C), Stock Value ($), or Lifespan (Years).",
            },
            {
              term: "Classification (Discrete Classes)",
              text: "Used when the target is a label: Fraud vs Legitimate, Phishing vs Safe, Dog vs Cat, or High vs Medium vs Low risk.",
            },
          ]}
          whyItMatters="Choosing the wrong problem type breaks the mathematics! You cannot compute Mean Squared Error on words like 'Spam', and you cannot use a softmax classification probability to guess a continuous house price."
          deepDive="Regression maps f: X -> R (real numbers), evaluating via metrics like MSE, MAE, and R². Classification maps f: X -> {C1, C2, ... Ck}, optimizing cross-entropy loss and evaluated via Accuracy, Precision, Recall, and ROC-AUC."
        />

        <div className="problem-choice-grid">
          <button
            type="button"
            className={problemType === "regression" ? "problem-choice active" : "problem-choice"}
            onClick={() => {
              setUserProblemType("regression");
              setUserModelType(MODEL_OPTIONS.regression[0][0]);
            }}
          >
            <strong>📈 Regression Task</strong>
            <span>Predict a continuous number (e.g. Selling Price, Temperature, Stock Value).</span>
          </button>
          <button
            type="button"
            className={problemType === "classification" ? "problem-choice active" : "problem-choice"}
            onClick={() => {
              setUserProblemType("classification");
              setUserModelType(MODEL_OPTIONS.classification[0][0]);
            }}
          >
            <strong>🏷️ Classification Task</strong>
            <span>Predict a category or label (e.g. Fraud / Safe, Customer Churn Yes / No).</span>
          </button>
        </div>

        <p className="preprocess-note" style={{ marginTop: "14px" }}>
          Target column: <strong>{plan.selectedTarget}</strong>. Based on its numerical values,{" "}
          <strong>{getSuggestedProblemType(dataset, plan.selectedTarget).toUpperCase()}</strong> is recommended.
        </p>
      </section>

      {/* SECTION 3: Interactive Model Intuition Playground */}
      <section className="preprocess-section">
        <p className="section-label">INTERACTIVE PLAYGROUND</p>
        <h2>Interactive: Underfitting, Overfitting, and the Sweet Spot</h2>
        <p className="preprocess-explanation">
          A common mistake beginners make is assuming that a model with 100% accuracy on training data is 
          great. In reality, a model that memorizes every bump in training data usually falls apart on real-world tests!
        </p>

        <ModelIntuitionPlayground />
      </section>

      {/* SECTION 4: Training & Test Data Split Review */}
      <section className="preprocess-section">
        <p className="section-label">DATA CONTRACT</p>
        <h2>Features and Split Verification</h2>
        <p className="preprocess-explanation">
          Here is the exact data blueprint the model will receive. The target is isolated so the model cannot cheat.
        </p>

        <div className="train-data-summary">
          <SummaryValue label="Target (Answer)" value={plan.selectedTarget} />
          <SummaryValue label="Selected Features" value={`${plan.selectedFeatures.length} clues`} />
          <SummaryValue label="Training Partition" value={`${trainingRows} rows (${plan.trainingPercentage}%)`} />
          <SummaryValue label="Held-out Test Set" value={`${testingRows} rows (${100 - plan.trainingPercentage}%)`} />
        </div>

        <div className="selected-feature-list" style={{ marginTop: "16px" }}>
          {plan.selectedFeatures.map((feature) => (
            <span key={feature}>
              {feature}{" "}
              {dataset.numerical_columns.includes(feature)
                ? "📊 Numerical"
                : dataset.categorical_columns.includes(feature)
                ? "🏷️ Categorical"
                : ""}
            </span>
          ))}
        </div>

        <div className="feature-flow-lesson">
          <span className="lesson-tag">DATA FLOW PIPELINE</span>
          <div className="feature-flow">
            <span>Inputs: {plan.selectedFeatures.slice(0, 3).join(" + ") || "Features"}...</span>
            <strong>➡️ Model Weights ➡️</strong>
            <span>Predicted {plan.selectedTarget}</span>
          </div>
        </div>
      </section>

      {/* SECTION 5: Algorithm Selection */}
      <section className="preprocess-section">
        <p className="section-label">MODEL ARSENAL</p>
        <h2>Choose Your Model Architecture</h2>
        <p className="preprocess-explanation">
          Each algorithm learns in a fundamentally different way. No single algorithm is best for every problem (known as the &quot;No Free Lunch Theorem&quot;).
        </p>

        <div className="model-options">
          {models.map(([key, title, description]) => (
            <button
              type="button"
              key={key}
              className={modelType === key ? "model-option active" : "model-option"}
              onClick={() => setUserModelType(key)}
            >
              <strong>{title}</strong>
              <span>{description}</span>
            </button>
          ))}
        </div>

        <div style={{ marginTop: "18px" }}>
          <ModelDeepDive modelType={modelType} />
        </div>
      </section>

      {/* SECTION 6: Train Model Trigger */}
      <section className="preprocess-section">
        <p className="section-label">EXECUTION</p>
        <h2>Train the Model on Your Data</h2>
        <p className="preprocess-explanation">
          Clicking the button sends your pipeline blueprint to Python scikit-learn. The server preprocesses 
          numerical scales, applies one-hot encodings to text categories, and fits the chosen model.
        </p>

        {error && <div className="train-error">{error}</div>}

        <button
          className="continue-button"
          type="button"
          disabled={training}
          onClick={handleTrain}
          style={{ padding: "16px 28px", fontSize: "16px" }}
        >
          {training ? "Fitting Model in Python..." : `Train ${selectedModel[1]}`}
          {!training && <span aria-hidden="true"> ⚡</span>}
        </button>

        {result && (
          <div style={{ marginTop: "28px" }}>
            <TrainingResult
              result={result}
              onContinue={() => {
                window.location.hash = "#validate";
              }}
            />
          </div>
        )}
      </section>
    </TrainShell>
  );
}

function TrainShell({ children }) {
  return (
    <div className="experiment-page preprocess-page train-page">
      <ExperimentHeader />
      <ExperimentProgress activeStep={3} />
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

function ModelDeepDive({ modelType }) {
  const info = {
    linear_regression: {
      badge: "LINEAR MODEL",
      title: "Linear Regression (Ordinary Least Squares)",
      analogy: "Like drawing a ruler through a scatter plot of dots so the total distance from the ruler to all dots is as small as possible.",
      pros: "Extremely fast, easy to interpret (each feature has a clear multiplier weight), impossible to wildly overfit.",
      cons: "Cannot capture complex curves or sudden thresholds without manual polynomial feature engineering.",
    },
    decision_tree_regressor: {
      badge: "TREE-BASED MODEL",
      title: "Decision Tree Regressor",
      analogy: "Like playing 20 Questions: 'Is Age > 30? If yes, is Income > $50k? Then guess $75k.'",
      pros: "Captures non-linear thresholds and interactions between features naturally. Ignores feature scale differences.",
      cons: "Prone to high variance and overfitting if trees are allowed to grow too deep without pruning.",
    },
    random_forest_regressor: {
      badge: "ENSEMBLE METHOD",
      title: "Random Forest Regressor",
      analogy: "Instead of asking one expert doctor, you assemble a panel of 100 diverse doctors who all vote and take their average opinion.",
      pros: "One of the most powerful out-of-the-box ML algorithms. Drastically reduces overfitting compared to single trees.",
      cons: "Harder to visualize in your head than a single linear formula; takes slightly longer to compute.",
    },
    logistic_regression: {
      badge: "PROBABILISTIC CLASSIFIER",
      title: "Logistic Regression",
      analogy: "Like a confidence thermometer: it computes a score and squeezes it into a 0% to 100% probability curve.",
      pros: "Simple, robust, gives well-calibrated confidence probabilities.",
      cons: "Assumes a linear boundary between classes.",
    },
    decision_tree_classifier: {
      badge: "TREE-BASED CLASSIFIER",
      title: "Decision Tree Classifier",
      analogy: "A medical triage flowchart: if fever > 102°F AND cough = yes, classify as Flu.",
      pros: "Fully transparent decision rules you can print out and read like a flowchart.",
      cons: "Can memorize single outlier training rows easily.",
    },
    random_forest_classifier: {
      badge: "ENSEMBLE CLASSIFIER",
      title: "Random Forest Classifier",
      analogy: "A jury of 100 jurors. Each juror inspects a random subset of clues and votes on Guilty vs Not Guilty.",
      pros: "High accuracy, handles noisy real-world tabular data exceptionally well.",
      cons: "Requires more compute than a single decision tree.",
    },
  };

  const item = info[modelType] || info.linear_regression;

  return (
    <div
      style={{
        padding: "18px 20px",
        background: "var(--panel, #202720)",
        border: "1px solid #3c493e",
        borderRadius: "6px",
      }}
    >
      <span
        style={{
          display: "block",
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
          color: "var(--coral, #ff775f)",
          letterSpacing: "0.1em",
          fontWeight: "600",
          marginBottom: "6px",
        }}
      >
        {item.badge}
      </span>
      <h3 style={{ margin: "0 0 10px", fontSize: "18px", color: "var(--paper)" }}>{item.title}</h3>
      <p style={{ margin: "0 0 12px", color: "#cbd4cb", fontSize: "14.5px", lineHeight: "1.65" }}>
        <strong>Everyday Analogy:</strong> {item.analogy}
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          borderTop: "1px solid #2a352c",
          paddingTop: "12px",
        }}
      >
        <div>
          <strong style={{ color: "var(--lime)", fontSize: "13px", display: "block" }}>✅ Key Strengths:</strong>
          <span style={{ color: "var(--muted)", fontSize: "13px" }}>{item.pros}</span>
        </div>
        <div>
          <strong style={{ color: "var(--coral)", fontSize: "13px", display: "block" }}>⚠️ Watch Out For:</strong>
          <span style={{ color: "var(--muted)", fontSize: "13px" }}>{item.cons}</span>
        </div>
      </div>
    </div>
  );
}

function TrainingResult({ result, onContinue }) {
  return (
    <div
      className="preprocess-section training-result"
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
            TRAINING COMPLETE
          </p>
          <h2 style={{ margin: 0, fontSize: "24px" }}>The Model Has Learned Its First Pattern!</h2>
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
            Interactive Simulation Preview
          </span>
        )}
      </div>

      <p className="preprocess-explanation" style={{ marginTop: "12px" }}>
        The algorithm has finished adjusting its weights over the training partition. Here is a sneak peek 
        at how its predictions compare with real target values:
      </p>

      <div className="train-data-summary" style={{ marginTop: "16px" }}>
        <SummaryValue label="Trained Algorithm" value={formatModelName(result.model_type)} />
        <SummaryValue label="Problem Family" value={result.problem_type} />
        <SummaryValue label="Training Partition" value={`${result.training_rows} examples`} />
        <SummaryValue label="Held-Out Test Partition" value={`${result.testing_rows} examples`} />
      </div>

      <div className="prediction-preview" style={{ marginTop: "20px" }}>
        <h3 style={{ fontSize: "16px" }}>Sample Prediction Verification</h3>
        {result.prediction_preview.map((p, idx) => (
          <div key={idx} style={{ padding: "12px 18px" }}>
            <span>
              Sample #{idx + 1} — Actual Value: <strong>{p.actual}</strong>
            </span>
            <strong style={{ color: "var(--lime)", fontFamily: "var(--font-mono)" }}>
              Model Guess: {p.prediction}
            </strong>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "24px", display: "flex", gap: "14px", alignItems: "center" }}>
        <button
          className="continue-button"
          type="button"
          onClick={onContinue}
          style={{ padding: "15px 26px", fontSize: "15px" }}
        >
          Continue to Step 05: Validate <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}

function formatModelName(modelType) {
  if (!modelType) return "Linear Regression";
  return modelType
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function getSuggestedProblemType(dataset, target) {
  if (!target) return "regression";
  return dataset.categorical_columns.includes(target) ? "classification" : "regression";
}
