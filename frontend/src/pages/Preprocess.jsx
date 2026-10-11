import { useEffect, useState } from "react";
import "../preprocess.css";
import "../explore.css";
import ExperimentHeader from "../components/ExperimentHeader";
import ExperimentProgress from "../components/ExperimentProgress";
import BeginnerExplainer from "../components/playgrounds/BeginnerExplainer";
import MissingValuePlayground from "../components/playgrounds/MissingValuePlayground";
import EncodingPlayground from "../components/playgrounds/EncodingPlayground";
import ScalingPlayground from "../components/playgrounds/ScalingPlayground";
import { API_BASE } from "../config/api";

const PREPROCESS_STORAGE_KEY = "ml-lab-preprocess-plan";

const DEMO_METADATA = {
  filename: "car_data_demo.csv",
  rows: 301,
  columns: ["Car_Name", "Year", "Selling_Price", "Present_Price", "Kms_Driven", "Fuel_Type"],
  numerical_columns: ["Year", "Selling_Price", "Present_Price", "Kms_Driven"],
  categorical_columns: ["Car_Name", "Fuel_Type"],
  missing_values: { Car_Name: 0, Year: 0, Selling_Price: 0, Present_Price: 3, Kms_Driven: 2, Fuel_Type: 0 },
};

export default function Preprocess() {
  const [metadata, setMetadata] = useState(DEMO_METADATA);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [loading, setLoading] = useState(false);

  // Lazy initialize state from sessionStorage to avoid cascading renders
  const [selectedTarget, setSelectedTarget] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(PREPROCESS_STORAGE_KEY) || "null");
      return saved?.selectedTarget || "Selling_Price";
    } catch {
      return "Selling_Price";
    }
  });

  const [selectedFeatures, setSelectedFeatures] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(PREPROCESS_STORAGE_KEY) || "null");
      return saved?.selectedFeatures || ["Year", "Present_Price", "Kms_Driven", "Fuel_Type"];
    } catch {
      return ["Year", "Present_Price", "Kms_Driven", "Fuel_Type"];
    }
  });

  const [trainingPercentage, setTrainingPercentage] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(PREPROCESS_STORAGE_KEY) || "null");
      return saved?.trainingPercentage || 80;
    } catch {
      return 80;
    }
  });

  useEffect(() => {
    sessionStorage.setItem(
      PREPROCESS_STORAGE_KEY,
      JSON.stringify({ selectedTarget, selectedFeatures, trainingPercentage })
    );
  }, [selectedTarget, selectedFeatures, trainingPercentage]);

  useEffect(() => {
    async function loadMetadata() {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/api/dataset/preprocess`);
        const payload = await response.json();

        if (!response.ok || !payload.columns || !payload.columns.length) {
          // Fallback to demo metadata so learner is never blocked
          setMetadata(DEMO_METADATA);
          setIsDemoMode(true);
          return;
        }

        setMetadata(payload);
        setIsDemoMode(false);

        // Auto-select target if none selected yet
        setSelectedTarget((current) => current || payload.columns[payload.columns.length - 1] || "");
      } catch {
        setMetadata(DEMO_METADATA);
        setIsDemoMode(true);
      } finally {
        setLoading(false);
      }
    }

    loadMetadata();
  }, []);

  function chooseTarget(column) {
    setSelectedTarget(column);
    setSelectedFeatures((features) => features.filter((feature) => feature !== column));
  }

  function toggleFeature(column) {
    if (column === selectedTarget) return;
    setSelectedFeatures((features) =>
      features.includes(column)
        ? features.filter((feature) => feature !== column)
        : [...features, column]
    );
  }

  return (
    <PreprocessShell>
      <header className="preprocess-heading">
        <div>
          <p className="section-label">STEP 03 / PREPROCESS</p>
          <h1>Prepare your data<br /><em>for learning.</em></h1>
        </div>
        <button
          type="button"
          className="explore-back"
          onClick={() => { window.location.hash = "#explore"; }}
        >
          Back to explore
        </button>
      </header>

      <p className="preprocess-intro">
        Before an algorithm can learn patterns, we must translate our raw observations into the clean mathematical format that computers understand. We inspect missing cells, convert word categories into numbers, choose which clues to teach, scale numbers fairly, and set aside an unseen test exam.
      </p>

      {isDemoMode && (
        <div className="live-insight-banner" style={{ margin: "22px 0 10px" }}>
          <div className="insight-icon">💡</div>
          <div className="insight-content">
            <strong style={{ color: "var(--lime)" }}>INTERACTIVE DEMO DATASET ACTIVE:</strong>
            <p>
              You haven't uploaded a custom CSV in Step 01 yet, so we've preloaded demo car dataset metadata! All interactive lessons, feature selectors, and simulators below are fully functional. You can customize your preprocessing plan here or upload your own CSV in Step 01 anytime.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="explore-state">
          <div className="state-badge">LOADING</div>
          <p>Preparing the dataset inspection tools...</p>
        </div>
      ) : (
        <>
          {/* ========================================================
              LESSON 1: MISSING VALUES
             ======================================================== */}
          <MissingValuesLesson
            missingValues={metadata.missing_values}
            rows={metadata.rows}
          />

          {/* ========================================================
              LESSON 2: CATEGORICAL ENCODING
             ======================================================== */}
          <EncodingLesson />

          {/* ========================================================
              LESSON 3: FEATURE SELECTION
             ======================================================== */}
          <FeatureSelection
            columns={metadata.columns}
            selectedTarget={selectedTarget}
            selectedFeatures={selectedFeatures}
            chooseTarget={chooseTarget}
            toggleFeature={toggleFeature}
          />

          {/* ========================================================
              LESSON 4: FEATURE SCALING
             ======================================================== */}
          <ScalingLesson columns={metadata.numerical_columns} />

          {/* ========================================================
              LESSON 5: TRAIN-TEST SPLIT
             ======================================================== */}
          <TrainTestSplit
            rows={metadata.rows}
            trainingPercentage={trainingPercentage}
            setTrainingPercentage={setTrainingPercentage}
          />

          {/* ========================================================
              LESSON 6: PREPROCESS SUMMARY
             ======================================================== */}
          <PreprocessSummary
            missingValues={metadata.missing_values}
            numericalColumns={metadata.numerical_columns}
            categoricalColumns={metadata.categorical_columns}
            selectedTarget={selectedTarget}
            selectedFeatures={selectedFeatures}
            trainingPercentage={trainingPercentage}
            onContinue={() => { window.location.hash = "#train"; }}
          />
        </>
      )}
    </PreprocessShell>
  );
}

function PreprocessShell({ children }) {
  return (
    <div className="experiment-page preprocess-page">
      <ExperimentHeader />
      <ExperimentProgress activeStep={2} />
      <main className="preprocess-main">{children}</main>
    </div>
  );
}

function LessonBlock({ badge = "LESSON", title, explanation, children }) {
  return (
    <section className="preprocess-section">
      <p className="section-label">{badge}</p>
      <h2>{title}</h2>
      <p className="preprocess-explanation">{explanation}</p>
      {children}
    </section>
  );
}

/* ------------------------------------------------------------
   1. Missing Values Lesson Component
   ------------------------------------------------------------ */
function MissingValuesLesson({ missingValues, rows }) {
  const entries = Object.entries(missingValues || {});
  const missingEntries = entries.filter(([, count]) => count > 0);

  return (
    <LessonBlock
      badge="DATA HYGIENE 01"
      title="1. What happens when information is missing?"
      explanation="An empty cell means data was not recorded for that row. Most machine learning algorithms will crash or produce errors when given empty cells. We must choose an intelligent strategy to handle them."
    >
      <BeginnerExplainer
        badge="FOUNDATION 01"
        title="The Incomplete Survey Form: Dropping vs. Imputing"
        analogy="Imagine collecting 100 job application forms. One applicant forgot to write their phone number. If you throw their entire application in the paper shredder, you lose their education and work history! If you instead write 'Unknown' or estimate reasonable values, you keep the rest of their story."
        breakdown={[
          {
            term: "Dropping Rows (Deletion)",
            text: "Removes any row containing an empty cell. Works well if you have millions of rows and only 2 missing cells. But if 40% of rows are missing something, dropping them discards almost half your valuable data!"
          },
          {
            term: "Imputation with Mean / Median",
            text: "Fills missing numbers with the average or median. Median is preferred if extreme outliers exist (like salaries), keeping the row intact."
          },
          {
            term: "Imputation with Mode (Most Common)",
            text: "For text categories (like Fuel Type), you can fill empty spots with the most frequently occurring label."
          }
        ]}
        whyItMatters="Silently deleting rows can introduce severe bias. For example, if low-income patients systematically skip answering the 'Salary' question on a medical survey, deleting their rows accidentally removes all low-income patients from your model's worldview!"
        deepDive="Advanced techniques include KNN Imputation (finding the 5 most similar rows and averaging their values) and MICE (Multiple Imputation by Chained Equations). In our pipeline, we impute numeric columns using median and categorical columns using most frequent."
      />

      {/* Interactive Missing Value Simulator */}
      <MissingValuePlayground />

      {/* Real Dataset Missing Value Summary */}
      <div style={{ marginTop: "20px" }}>
        <h4 style={{ fontSize: "14px", color: "var(--paper)", margin: "0 0 10px" }}>
          Missing cells detected in your dataset:
        </h4>
        {missingEntries.length === 0 ? (
          <div className="preprocess-empty">
            ✅ No missing values detected! Every checked cell in this dataset contains complete information.
          </div>
        ) : (
          <div className="preprocess-table">
            <div className="preprocess-table-row preprocess-table-head">
              <span>Column</span>
              <span>Missing Cells</span>
              <span>Share of Dataset</span>
            </div>
            {missingEntries.map(([column, count]) => (
              <div className="preprocess-table-row" key={column}>
                <strong>{column}</strong>
                <span style={{ color: "var(--coral)" }}>{count} empty</span>
                <span>{rows ? `${((count / rows) * 100).toFixed(1)}%` : "—"}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </LessonBlock>
  );
}

/* ------------------------------------------------------------
   2. Categorical Encoding Lesson Component
   ------------------------------------------------------------ */
function EncodingLesson() {
  return (
    <LessonBlock
      badge="DATA TRANSLATION 02"
      title="2. How do we turn categories into numbers?"
      explanation="Machine learning models are mathematical engines. They calculate slopes, weights, and gradients. They cannot perform algebra on words like 'Petrol' or 'Diesel', so we must encode categories numerically."
    >
      <BeginnerExplainer
        badge="FOUNDATION 02"
        title="Why Computers Hate Words: The False Ranking Trap"
        analogy="If you ask a computer to calculate 2 × 'Diesel', it doesn't know what that means. If you assign Petrol = 0, Diesel = 1, and CNG = 2, the computer thinks CNG is twice as valuable as Diesel! Unless your categories have a natural ranking (like Low, Medium, High), numbers can lie."
        breakdown={[
          {
            term: "Label Encoding (Integer IDs)",
            text: "Assigns 0, 1, 2, 3 to each choice. Great for ordinal features (like Education: High School=1, Bachelors=2, PhD=3), but dangerous for unranked categories."
          },
          {
            term: "One-Hot Encoding (Binary Columns)",
            text: "Creates a separate yes/no column for every category (e.g., is_Petrol, is_Diesel). Each column holds a 1 (True) or 0 (False). No artificial hierarchy is created!"
          },
          {
            term: "The Cardinality Rule",
            text: "If a column has 10,000 unique choices (like Zip Code), One-Hot Encoding creates 10,000 columns, ballooning memory usage. For high cardinality, grouping or target encoding is used."
          }
        ]}
        whyItMatters="One-Hot Encoding guarantees that distance-based and linear models treat every category as equally distinct. Our training backend automatically applies One-Hot Encoding to your chosen word columns."
        deepDive="In linear regression, having all N one-hot columns can cause perfect multicollinearity (the 'Dummy Variable Trap'). To avoid this, some practitioners drop the first category (drop='first'), using it as the reference baseline."
      />

      {/* Interactive Encoding Playground */}
      <EncodingPlayground />
    </LessonBlock>
  );
}

/* ------------------------------------------------------------
   3. Feature Selection Component
   ------------------------------------------------------------ */
function FeatureSelection({ columns, selectedTarget, selectedFeatures, chooseTarget, toggleFeature }) {
  return (
    <LessonBlock
      badge="MODEL DESIGN 03"
      title="3. Which columns should the model learn from?"
      explanation="Features are the clues we give the algorithm. The Target is the mystery answer we want it to learn how to predict. Never feed the Target into the clues!"
    >
      <BeginnerExplainer
        badge="FOUNDATION 03"
        title="The Student Homework Analogy: Clues vs. The Secret Answer"
        analogy="Imagine a teacher assigning practice questions for an exam. The practice questions and formulas are the Features. The score on exam day is the Target. If the teacher accidentally prints the final exam answers inside the practice homework, the student gets 100% on homework but learns nothing!"
        breakdown={[
          {
            term: "The Target (Output / Y)",
            text: "The one single value or label you want the machine to forecast (e.g. Selling Price, Phishing Status, or Patient Disease)."
          },
          {
            term: "The Features (Inputs / X)",
            text: "The clues the model is allowed to study (e.g. Car Year, Engine Size, URL Length, HTTPS Present)."
          },
          {
            term: "Data Leakage Danger",
            text: "If you give the model the Target as an input, or include a feature that directly reveals the answer, the model 'cheats' during practice and fails disastrously in the real world."
          }
        ]}
        whyItMatters="Choosing clean, relevant clues is often more impactful than choosing complex algorithms. Irrelevant features add noise, while missing features make predictions impossible."
      />

      <div className="feature-selection-grid" style={{ marginTop: "20px" }}>
        <div>
          <span className="card-kicker">STEP A: DEFINE THE GOAL</span>
          <h3 style={{ margin: "4px 0 8px" }}>Choose the Target</h3>
          <p>The column the model will try to predict.</p>
          <select value={selectedTarget} onChange={(event) => chooseTarget(event.target.value)}>
            <option value="">Select a target column</option>
            {columns.map((column) => (
              <option key={column} value={column}>{column}</option>
            ))}
          </select>
          {selectedTarget && (
            <p style={{ marginTop: "10px", color: "var(--lime)", fontSize: "13.5px", fontFamily: "var(--font-mono)" }}>
              🎯 Target set to: <strong>{selectedTarget}</strong>
            </p>
          )}
        </div>

        <div>
          <span className="card-kicker">STEP B: SELECT INPUT CLUES</span>
          <h3 style={{ margin: "4px 0 8px" }}>Choose the Features ({selectedFeatures.length} selected)</h3>
          <p>The clues the model is permitted to inspect.</p>
          <div className="feature-checklist">
            {columns.map((column) => (
              <label
                className={column === selectedTarget ? "feature-choice disabled" : "feature-choice"}
                key={column}
              >
                <input
                  type="checkbox"
                  checked={selectedFeatures.includes(column)}
                  disabled={column === selectedTarget}
                  onChange={() => toggleFeature(column)}
                />
                <span>{column}</span>
                {column === selectedTarget && <small>TARGET (LOCKED)</small>}
              </label>
            ))}
          </div>
        </div>
      </div>
    </LessonBlock>
  );
}

/* ------------------------------------------------------------
   4. Feature Scaling Component
   ------------------------------------------------------------ */
function ScalingLesson() {
  return (
    <LessonBlock
      badge="SCALE NORMALIZATION 04"
      title="4. Why do some models need scaling?"
      explanation="Numbers in different columns live on completely different scales. Some algorithms get hypnotized by huge numbers, ignoring small numbers even if they hold the most critical clues."
    >
      <BeginnerExplainer
        badge="FOUNDATION 04"
        title="The Elephant & The Mouse: Why Scale Matters"
        analogy="Suppose you measure a mouse's weight in grams (25g) and an elephant's weight in kilograms (5,000kg). If a computer algorithm compares them as raw numbers without units, it treats 5,000 as 200 times more important than 25 simply because the number is bigger!"
        breakdown={[
          {
            term: "Min-Max Normalization",
            text: "Squeezes all numbers into the range [0.0, 1.0]. The smallest value becomes 0.0, and the largest becomes 1.0."
          },
          {
            term: "Standardization (StandardScaler)",
            text: "Shifts the average of the column to 0.0 and rescales it so the standard deviation is 1.0. A score of +2.0 means 'two standard deviations above average'."
          },
          {
            term: "Which Models Need It?",
            text: "Distance-based algorithms (KNN, K-Means) and gradient-based models (Linear Regression, Neural Networks) require scaling. Decision Trees and Random Forests do not care about scale!"
          }
        ]}
        whyItMatters="Without scaling, features with large units (like Kms_Driven in the tens of thousands) will overpower small features (like Car Age in single digits), preventing the model from learning a balanced pattern."
      />

      {/* Interactive Scaling Playground */}
      <ScalingPlayground />
    </LessonBlock>
  );
}

/* ------------------------------------------------------------
   5. Train-Test Split Component
   ------------------------------------------------------------ */
function TrainTestSplit({ rows, trainingPercentage, setTrainingPercentage }) {
  const testingPercentage = 100 - trainingPercentage;
  const trainingRows = Math.round((rows * trainingPercentage) / 100);
  const testingRows = rows - trainingRows;

  return (
    <LessonBlock
      badge="FAIR TESTING 05"
      title="5. How do we separate learning from testing?"
      explanation="Never test a student on the exact same questions they practiced during homework! Training data teaches the patterns; separate test data checks whether those patterns work on unseen reality."
    >
      <BeginnerExplainer
        badge="FOUNDATION 05"
        title="Homework Practice vs. The Final Exam"
        analogy="If a math student memorizes the answers to 50 practice problems, they might get 100% on those 50 problems. But if you give them a new exam with fresh numbers, you find out whether they actually learned the math or just memorized the textbook!"
        breakdown={[
          {
            term: "Training Set (Usually 70% - 80%)",
            text: "The textbook and practice homework. The model inspects both the clues and the answers to discover relationships."
          },
          {
            term: "Test Set (Usually 20% - 30%)",
            text: "The final exam locked in a safe. The model never sees these rows until training is completely finished."
          },
          {
            term: "Overfitting Warning",
            text: "When a model scores 99% on training data but only 50% on test data, it has memorized noise instead of learning true concepts. Train/test splitting catches overfitting."
          }
        ]}
        whyItMatters="Keeping test data completely isolated is the most sacred rule in machine learning. It guarantees that performance metrics reflect genuine real-world generalization."
      />

      <div className="split-control" style={{ marginTop: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
          <label htmlFor="training-percentage">
            <strong>Adjust Training vs. Test Split Ratio:</strong>
          </label>
          <span style={{ fontFamily: "var(--font-mono)", color: "var(--lime)", fontSize: "14px", fontWeight: "bold" }}>
            {trainingPercentage}% Train / {testingPercentage}% Test
          </span>
        </div>

        <input
          id="training-percentage"
          type="range"
          min="50"
          max="90"
          step="5"
          value={trainingPercentage}
          onChange={(event) => setTrainingPercentage(Number(event.target.value))}
          className="playground-range-input"
          style={{ width: "100%" }}
        />

        <div className="validation-split" style={{ marginTop: "16px", minHeight: "90px" }}>
          <div className="validation-training" style={{ flexBasis: `${trainingPercentage}%` }}>
            <strong>{trainingPercentage}%</strong>
            <span>Training Data<br />{trainingRows} practice rows</span>
          </div>
          <div className="validation-testing" style={{ flexBasis: `${testingPercentage}%` }}>
            <strong>{testingPercentage}%</strong>
            <span>Unseen Test Exam<br />{testingRows} hidden rows</span>
          </div>
        </div>

        <div className="split-values">
          <span>Standard recommended ratio is 80% training / 20% testing.</span>
          <span>Total Rows: {rows}</span>
        </div>
      </div>
    </LessonBlock>
  );
}

/* ------------------------------------------------------------
   6. Preprocess Summary Component
   ------------------------------------------------------------ */
function PreprocessSummary({
  missingValues,
  numericalColumns,
  categoricalColumns,
  selectedTarget,
  selectedFeatures,
  trainingPercentage,
  onContinue,
}) {
  const hasMissingData = Object.values(missingValues || {}).some((count) => count > 0);
  const items = [
    [!hasMissingData || hasMissingData, hasMissingData ? "Missing values inspected & imputation strategy planned" : "Missing values checked (clean)"],
    [numericalColumns.length + categoricalColumns.length > 0, "Categorical columns prepared for One-Hot Encoding"],
    [Boolean(selectedTarget), selectedTarget ? `Target column selected: "${selectedTarget}"` : "Target column selected"],
    [selectedFeatures.length > 0, `${selectedFeatures.length} predictive feature clues selected`],
    [trainingPercentage > 0, `Train/test split configured (${trainingPercentage}% / ${100 - trainingPercentage}%)`],
  ];

  return (
    <LessonBlock
      badge="PREPARATION CHECKLIST"
      title="What will happen when we begin training?"
      explanation="Here is the master plan for preparing your data. When you click continue, these decisions will guide Python to build an automated data transformation pipeline."
    >
      <div className="preprocess-summary-list">
        {items.map(([complete, text]) => (
          <div key={text} className={complete ? "summary-item complete" : "summary-item"}>
            <span>{complete ? "✓" : "○"}</span>
            {text}
          </div>
        ))}
      </div>

      <div className="lesson-card" style={{ marginTop: "24px" }}>
        <p className="section-label">READY FOR STEP 04</p>
        <p>
          Your preprocessing blueprint is complete! Next, we will introduce machine learning models (Linear Regression, Decision Trees, and Random Forests) and let the computer start studying your prepared examples.
        </p>
        <button
          className="continue-button preprocess-continue"
          type="button"
          disabled={!selectedTarget || selectedFeatures.length === 0}
          onClick={onContinue}
        >
          Continue to Step 04: Train <span aria-hidden="true">-&gt;</span>
        </button>
      </div>
    </LessonBlock>
  );
}
