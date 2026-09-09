import { useRef, useState } from "react";
import DiscoveryList from "./DiscoveryList";

// Convert bytes into a size that is easier for a person to read.
function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getDatasetCounts(analysis) {
  const dtypesEntries = Object.entries(analysis.dtypes || {});
  const totalMissing = Object.values(analysis.missing_values || {}).reduce((sum, value) => sum + value, 0);

  const numericalColumns = dtypesEntries.filter(([, dtype]) => /int|float|number|bool/i.test(dtype)).length;
  const categoricalColumns = dtypesEntries.filter(([, dtype]) => /object|string|category/i.test(dtype)).length;

  return {
    numericalColumns,
    categoricalColumns,
    totalMissing,
  };
}

export default function DatasetUpload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef(null);

  function handleFileChange(event) {
    selectFile(event.target.files[0]);
  }

  function selectFile(file) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setSelectedFile(null);
      setMessage("Please choose a CSV file.");
      return;
    }

    setSelectedFile(file);
    setMessage("");
    setAnalysis(null);
  }

  function handleDrop(event) {
    event.preventDefault();
    selectFile(event.dataTransfer.files[0]);
  }

  function handleBrowseClick() {
    fileInputRef.current.click();
  }

  async function handleContinue() {
    if (!selectedFile) return;
    setIsAnalyzing(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("http://localhost:5000/api/dataset/analyze", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "The dataset could not be analyzed.");
      }

      setAnalysis(payload);
    } catch (error) {
      setMessage(error.message || "Could not connect to the backend.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <section className="try-section" aria-labelledby="upload-title">
      <p className="section-label">NOW TRY IT</p>
      <p className="try-subheading">Inspect your own dataset.</p>
      <p className="try-copy">Upload a CSV and we'll use it to explore these concepts in the next step.</p>
      <div className="upload-card">
        <div className="upload-card-heading">
          <div>
            <p className="card-kicker">INPUT / 01</p>
            <h2 id="upload-title">Upload your dataset</h2>
          </div>
          <span className="csv-label">CSV files only</span>
        </div>

        <div className="drop-zone" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
          <span className="upload-icon" aria-hidden="true">↑</span>
          <strong>{selectedFile ? selectedFile.name : "No dataset selected"}</strong>
          <span>{selectedFile ? formatFileSize(selectedFile.size) : "Drop your dataset here or browse for a file"}</span>
          {selectedFile && <span className="ready-label">Ready to inspect</span>}
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={handleFileChange} />
          <button className="browse-button" type="button" onClick={handleBrowseClick}>Browse for CSV</button>
        </div>

        <div className="upload-footer">
          <span className="privacy-note">Your file stays in this browser for now.</span>
          <button className="continue-button" type="button" disabled={!selectedFile || isAnalyzing} onClick={handleContinue}>{isAnalyzing ? "Analyzing dataset..." : "Continue"} {!isAnalyzing && <span aria-hidden="true">-&gt;</span>}</button>
        </div>
        {message && <p className="upload-message" role="status">{message}</p>}
        {analysis && (
          <>
            <DatasetAnalysis analysis={analysis} />
            <button className="explore-button" type="button" onClick={() => { window.location.hash = "#explore"; }}>
              Explore dataset <span aria-hidden="true">-&gt;</span>
            </button>
          </>
        )}
      </div>
      <DiscoveryList />
    </section>
  );
}

function DatasetAnalysis({ analysis }) {
  const { numericalColumns, categoricalColumns, totalMissing } = getDatasetCounts(analysis);
  const missingColumns = Object.entries(analysis.missing_values || {}).filter(([, count]) => count > 0);

  const takeawayItems = [
    `${analysis.rows} examples`,
    `${analysis.columns} columns`,
    `${totalMissing} empty cells`,
    `${numericalColumns} number columns`,
    `${categoricalColumns} word or category columns`,
  ];

  return (
    <div className="dataset-analysis" aria-live="polite">
      <div className="analysis-heading">
        <p className="section-label">DATASET SNAPSHOT</p>
        <strong>{analysis.filename}</strong>
      </div>

      <DatasetSummary rows={analysis.rows} columns={analysis.columns} />

      <SectionCard
        title="COLUMN NAMES"
        description="These are the clues available in the dataset. Each column describes one part of an example."
      >
        <ColumnList columns={analysis.column_names || []} />
      </SectionCard>

      <DataTypeSection dtypes={analysis.dtypes || {}} />

      <MissingValuesSection missingValues={analysis.missing_values || {}} totalMissing={totalMissing} />

      <UniqueValuesSection uniqueValues={analysis.unique_values || {}} />

      <LessonCard
        title="WHY DOES THIS MATTER?"
        body="Before we teach a model, we need to know what each column means, which columns are useful clues, and which column might be the answer. This helps us avoid asking the model to learn from the wrong information."
      />

      <LessonCard
        title="NOT EVERY COLUMN BECOMES A FEATURE"
        body="Some columns may help with a prediction, while others may be noise, or even give away the answer. We choose the clues carefully before teaching the model."
      />

      <ExperimentTakeaway items={takeawayItems} />

      {missingColumns.length > 0 && (
        <p className="analysis-note">Some cells are empty. Before teaching the model, we need to decide whether to fill them in, remove them, or leave them out.</p>
      )}
    </div>
  );
}

function DatasetSummary({ rows, columns }) {
  return (
    <div className="dataset-summary">
      <div className="summary-card">
        <span>ROWS</span>
        <strong>{rows}</strong>
        <small>One row usually represents one example.</small>
      </div>
      <div className="summary-card">
        <span>COLUMNS</span>
        <strong>{columns}</strong>
        <small>Columns describe parts of each example. Some may become clues for the model.</small>
      </div>
    </div>
  );
}

function SectionCard({ title, description, children }) {
  return (
    <div className="analysis-section">
      <div className="section-header">
        <span>{title}</span>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}

function ColumnList({ columns }) {
  return (
    <div className="column-list">
      {columns.map((column) => (
        <div key={column} className="column-pill">{column}</div>
      ))}
    </div>
  );
}

function DataTypeSection({ dtypes }) {
  const entries = Object.entries(dtypes);
  const numericColumns = entries.filter(([, type]) => /int|float|number|bool/i.test(type));
  const categoricalColumns = entries.filter(([, type]) => /object|string|category/i.test(type));

  return (
    <SectionCard
      title="DATA TYPES"
      description="Models work best when they know what kind of information each column holds. Numbers are often ready to use, but words usually need to be changed into numbers first."
    >
      <div className="type-grid">
        <div className="type-group">
          <h3>Numerical data</h3>
          <p>These are amounts we can count or measure, such as price, age, distance, or quantity.</p>
          <ul>
            {numericColumns.map(([column, type]) => (
              <li key={column}><strong>{column}</strong><span>{type}</span></li>
            ))}
          </ul>
        </div>
        <div className="type-group">
          <h3>Words or categories</h3>
          <p>These are labels, such as fuel type, seller type, or transmission. Many models need these words turned into numbers first.</p>
          <ul>
            {categoricalColumns.map(([column, type]) => (
              <li key={column}><strong>{column}</strong><span>{type}</span></li>
            ))}
          </ul>
        </div>
      </div>
    </SectionCard>
  );
}

function MissingValuesSection({ missingValues, totalMissing }) {
  const missingEntries = Object.entries(missingValues).filter(([, count]) => count > 0);

  return (
    <SectionCard
      title="MISSING VALUES"
      description="An empty cell means we do not have that piece of information. We check for empty cells because many models cannot use them as they are."
    >
      {totalMissing === 0 ? (
        <div className="empty-state">No empty cells found. That means every checked cell has a value.</div>
      ) : (
        <div className="value-list">
          {missingEntries.map(([column, count]) => (
            <div key={column} className="value-item">
              <strong>{column}</strong>
              <span>{count} missing</span>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function UniqueValuesSection({ uniqueValues }) {
  return (
    <SectionCard
      title="UNIQUE VALUES"
      description="Unique values tell us how many different answers appear in a column. This helps us see whether a column repeats a few choices or contains many different values."
    >
      <div className="value-list">
        {Object.entries(uniqueValues).map(([column, count]) => (
          <div key={column} className="value-item">
            <strong>{column}</strong>
            <span>{count} unique</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function LessonCard({ title, body }) {
  return (
    <div className="lesson-card">
      <span className="lesson-card-kicker">NOTE</span>
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}

function ExperimentTakeaway({ items }) {
  return (
    <div className="experiment-takeaway">
      <span className="lesson-card-kicker">WHAT DID WE LEARN?</span>
      <h3>Quick summary</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}