import { useEffect, useState } from "react";
import "../preprocess.css";
import ExperimentHeader from "../components/ExperimentHeader";
import ExperimentProgress from "../components/ExperimentProgress";

const EMPTY_METADATA = {
  columns: [],
  numerical_columns: [],
  categorical_columns: [],
  missing_values: {},
  rows: 0,
  filename: "",
};

const PREPROCESS_STORAGE_KEY = "ml-lab-preprocess-plan";

export default function Preprocess() {
  const [metadata, setMetadata] = useState(EMPTY_METADATA);
  const [selectedTarget, setSelectedTarget] = useState("");
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [trainingPercentage, setTrainingPercentage] = useState(80);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const savedPlan = JSON.parse(sessionStorage.getItem(PREPROCESS_STORAGE_KEY) || "null");
      if (savedPlan) {
        setSelectedTarget(savedPlan.selectedTarget || "");
        setSelectedFeatures(savedPlan.selectedFeatures || []);
        setTrainingPercentage(savedPlan.trainingPercentage || 80);
      }
    } catch {
      sessionStorage.removeItem(PREPROCESS_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem(PREPROCESS_STORAGE_KEY, JSON.stringify({ selectedTarget, selectedFeatures, trainingPercentage }));
  }, [selectedTarget, selectedFeatures, trainingPercentage]);

  useEffect(() => {
    async function loadMetadata() {
      try {
        const response = await fetch("http://localhost:5000/api/dataset/preprocess");
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Could not load the dataset for preprocessing.");
        setMetadata(payload);
        setSelectedTarget((current) => current || payload.columns?.[payload.columns.length - 1] || "");
      } catch (fetchError) {
        setError(fetchError.message || "Could not connect to the backend.");
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
    setSelectedFeatures((features) => (
      features.includes(column)
        ? features.filter((feature) => feature !== column)
        : [...features, column]
    ));
  }

  if (loading) {
    return <PreprocessShell><StateMessage label="LOADING" text="Getting the dataset ready to inspect..." /></PreprocessShell>;
  }

  if (error) {
    return <PreprocessShell><StateMessage label="ERROR" text={error} /></PreprocessShell>;
  }

  return (
    <PreprocessShell>
      <header className="preprocess-heading">
        <div>
          <p className="section-label">STEP 03 / PREPROCESS</p>
          <h1>Prepare your data<br /><em>for learning.</em></h1>
        </div>
        <button type="button" className="explore-back" onClick={() => { window.location.hash = "#explore"; }}>Back to explore</button>
      </header>
      <p className="preprocess-intro">Before a model can learn, we make sure the data is in a useful shape. We check missing information, explain how words can become numbers, choose the right clues, and plan a fair test.</p>

      <MissingValuesLesson missingValues={metadata.missing_values} rows={metadata.rows} />
      <EncodingLesson columns={metadata.categorical_columns} />
      <FeatureSelection
        columns={metadata.columns}
        selectedTarget={selectedTarget}
        selectedFeatures={selectedFeatures}
        chooseTarget={chooseTarget}
        toggleFeature={toggleFeature}
      />
      <ScalingLesson columns={metadata.numerical_columns} />
      <TrainTestSplit rows={metadata.rows} trainingPercentage={trainingPercentage} setTrainingPercentage={setTrainingPercentage} />
      <PreprocessSummary
        missingValues={metadata.missing_values}
        numericalColumns={metadata.numerical_columns}
        categoricalColumns={metadata.categorical_columns}
        selectedTarget={selectedTarget}
        selectedFeatures={selectedFeatures}
        trainingPercentage={trainingPercentage}
        onContinue={() => { window.location.hash = "#train"; }}
      />
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

function StateMessage({ label, text }) {
  return <div className="explore-state"><div className="state-badge">{label}</div><p>{text}</p></div>;
}

function LessonBlock({ title, explanation, children }) {
  return (
    <section className="preprocess-section">
      <p className="section-label">LESSON</p>
      <h2>{title}</h2>
      <p className="preprocess-explanation">{explanation}</p>
      {children}
    </section>
  );
}

function MissingValuesLesson({ missingValues, rows }) {
  const entries = Object.entries(missingValues || {});
  const missingEntries = entries.filter(([, count]) => count > 0);

  return (
    <LessonBlock
      title="What happens when information is missing?"
      explanation="An empty cell means information is unavailable for that example. Many models cannot use missing data directly, so we may need to decide how to handle it before training. We are only learning about the choices here; nothing is changed."
    >
      {missingEntries.length === 0 ? (
        <div className="preprocess-empty">No missing values detected. Every checked cell has information.</div>
      ) : (
        <>
          <div className="preprocess-table">
            <div className="preprocess-table-row preprocess-table-head"><span>Column</span><span>Missing cells</span><span>Share of rows</span></div>
            {missingEntries.map(([column, count]) => (
              <div className="preprocess-table-row" key={column}>
                <strong>{column}</strong>
                <span>{count}</span>
                <span>{rows ? `${((count / rows) * 100).toFixed(1)}%` : "—"}</span>
              </div>
            ))}
          </div>
          <div className="preprocess-options">
            <p><strong>Possible choices:</strong> remove rows, fill number columns with the mean or median, or fill word columns with the most common category.</p>
            <p className="preprocess-note">There is no single best choice. We should understand the data first instead of silently applying a cleanup rule.</p>
          </div>
        </>
      )}
    </LessonBlock>
  );
}

function EncodingLesson({ columns }) {
  const demoColumn = columns[0] || "Category";
  const demoValues = /fuel/i.test(demoColumn) ? ["Petrol", "Diesel", "CNG"] : ["Category A", "Category B", "Category C"];

  return (
    <LessonBlock
      title="How do we turn categories into numbers?"
      explanation="Word columns contain labels, such as fuel type or transmission. Many algorithms work with numbers, so categories may need to be encoded, or given a numerical representation, before training."
    >
      <div className="encoding-demo">
        <div><span className="demo-column-label">Column: {demoColumn}</span>{demoValues.map((value, index) => <div className="encoding-row" key={value}><span>{value}</span><strong>-&gt; {index}</strong></div>)}</div>
        <p>This is only a simple demonstration. The numbers are labels, not a ranking: Category C is not “more” than Category A. When categories have no natural order, one-hot encoding can be a better choice because it makes a separate yes/no column for each category.</p>
      </div>
    </LessonBlock>
  );
}

function FeatureSelection({ columns, selectedTarget, selectedFeatures, chooseTarget, toggleFeature }) {
  return (
    <LessonBlock
      title="Which columns should the model learn from?"
      explanation="Features are the clues we give a model. The target is the answer we want it to predict. We should not give the model the answer as a clue, because that would be cheating."
    >
      <div className="feature-selection-grid">
        <div>
          <h3>Choose the target</h3>
          <p>The column the model will try to predict.</p>
          <select value={selectedTarget} onChange={(event) => chooseTarget(event.target.value)}>
            <option value="">Select a target column</option>
            {columns.map((column) => <option key={column} value={column}>{column}</option>)}
          </select>
        </div>
        <div>
          <h3>Choose the features</h3>
          <p>The columns the model may use as clues.</p>
          <div className="feature-checklist">
            {columns.map((column) => (
              <label className={column === selectedTarget ? "feature-choice disabled" : "feature-choice"} key={column}>
                <input type="checkbox" checked={selectedFeatures.includes(column)} disabled={column === selectedTarget} onChange={() => toggleFeature(column)} />
                <span>{column}</span>
                {column === selectedTarget && <small>target</small>}
              </label>
            ))}
          </div>
        </div>
      </div>
    </LessonBlock>
  );
}

function ScalingLesson({ columns }) {
  const examples = columns.length >= 3 ? columns.slice(0, 3).map((column, index) => [column, [20, 50000, 5.5][index]]) : [["Age", 20], ["Kms_Driven", 50000], ["Present_Price", 5.5]];
  return (
    <LessonBlock
      title="Why do some models need scaling?"
      explanation="Number columns can use very different ranges. Some algorithms pay too much attention to large numbers, so scaling can put numerical features on more comparable scales."
    >
      <div className="scaling-example">
        {examples.map(([label, value]) => <div key={label}><strong>{label}</strong><span>{value}</span></div>)}
      </div>
      <p className="preprocess-note">Standardization changes values so a feature has an average close to 0 and a spread close to 1. This is an explanation only; the dataset is not being scaled yet.</p>
    </LessonBlock>
  );
}

function TrainTestSplit({ rows, trainingPercentage, setTrainingPercentage }) {
  const testingPercentage = 100 - trainingPercentage;
  const trainingRows = Math.round(rows * trainingPercentage / 100);
  const testingRows = rows - trainingRows;
  return (
    <LessonBlock
      title="How do we separate learning from testing?"
      explanation="We should not teach and test a model on the same examples. Training data teaches patterns; separate test data helps us see whether those patterns work on examples the model has not seen."
    >
      <div className="split-control">
        <label htmlFor="training-percentage">Training data: {trainingPercentage}%</label>
        <input id="training-percentage" type="range" min="50" max="90" value={trainingPercentage} onChange={(event) => setTrainingPercentage(Number(event.target.value))} />
        <div className="split-values"><span>{trainingRows} estimated training rows</span><span>{testingPercentage}% test / {testingRows} estimated test rows</span></div>
      </div>
    </LessonBlock>
  );
}

function PreprocessSummary({ missingValues, numericalColumns, categoricalColumns, selectedTarget, selectedFeatures, trainingPercentage, onContinue }) {
  const hasMissingData = Object.values(missingValues || {}).some((count) => count > 0);
  const items = [
    [!hasMissingData || hasMissingData, hasMissingData ? "Missing values found and choices reviewed" : "Missing values checked"],
    [numericalColumns.length + categoricalColumns.length > 0, "Number and word columns identified"],
    [Boolean(selectedTarget), "Target selected"],
    [selectedFeatures.length > 0, "Features selected"],
    [trainingPercentage > 0, "Train/test split configured"],
  ];

  return (
    <LessonBlock
      title="What will happen before training?"
      explanation="These decisions describe how the dataset could be prepared before a model learns. We are recording a plan, not applying it yet."
    >
      <div className="preprocess-summary-list">{items.map(([complete, text]) => <div key={text} className={complete ? "summary-item complete" : "summary-item"}><span>{complete ? "✓" : "○"}</span>{text}</div>)}</div>
      <button className="continue-button preprocess-continue" type="button" onClick={onContinue}>Continue to Train <span aria-hidden="true">-&gt;</span></button>
    </LessonBlock>
  );
}
