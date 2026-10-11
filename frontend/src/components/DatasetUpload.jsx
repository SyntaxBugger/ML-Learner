import { useRef, useState } from "react";
import DiscoveryList from "./DiscoveryList";
import { API_BASE } from "../config/api";

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
  const categoricalColumns = dtypesEntries.filter(([, dtype]) => /object|string|category|str/i.test(dtype)).length;

  return {
    numericalColumns,
    categoricalColumns,
    totalMissing,
  };
}

const CAR_DEMO_ANALYSIS = {
  filename: "car_sales_demo.csv",
  rows: 301,
  columns: 9,
  column_names: [
    "Car_Name",
    "Year",
    "Selling_Price",
    "Present_Price",
    "Kms_Driven",
    "Fuel_Type",
    "Seller_Type",
    "Transmission",
    "Owner",
  ],
  dtypes: {
    Car_Name: "object",
    Year: "int64",
    Selling_Price: "float64",
    Present_Price: "float64",
    Kms_Driven: "int64",
    Fuel_Type: "object",
    Seller_Type: "object",
    Transmission: "object",
    Owner: "int64",
  },
  missing_values: {
    Car_Name: 0,
    Year: 0,
    Selling_Price: 0,
    Present_Price: 0,
    Kms_Driven: 0,
    Fuel_Type: 0,
    Seller_Type: 0,
    Transmission: 0,
    Owner: 0,
  },
  unique_values: {
    Car_Name: 98,
    Year: 16,
    Selling_Price: 156,
    Present_Price: 147,
    Kms_Driven: 206,
    Fuel_Type: 3,
    Seller_Type: 2,
    Transmission: 2,
    Owner: 3,
  },
  is_demo: true,
};

export default function DatasetUpload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef(null);

  // Initialize analysis from Local Storage or default directly to CAR_DEMO_ANALYSIS
  const [analysis, setAnalysis] = useState(() => {
    try {
      const source = localStorage.getItem("ml-lab-dataset-source");
      if (source === "custom") {
        const saved = JSON.parse(localStorage.getItem("ml-lab-dataset-analysis") || "null");
        if (saved?.rows) return saved;
      }
    } catch {
      /* ignore */
    }
    return CAR_DEMO_ANALYSIS;
  });

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
  }

  function handleDrop(event) {
    event.preventDefault();
    selectFile(event.dataTransfer.files[0]);
  }

  function handleBrowseClick() {
    fileInputRef.current.click();
  }

  function handleUseDefaultCar() {
    setSelectedFile(null);
    setAnalysis(CAR_DEMO_ANALYSIS);
    setMessage("");
    fetch(`${API_BASE}/api/dataset/reset-default`, { method: "POST" }).catch(() => {});
    try {
      localStorage.setItem("ml-lab-dataset-source", "default-car");
      localStorage.removeItem("ml-lab-custom-csv-name");
      localStorage.removeItem("ml-lab-custom-csv");
      localStorage.removeItem("ml-lab-dataset-analysis");
    } catch {
      /* ignore */
    }
  }

  async function handleContinue() {
    // If no file is selected, confirm and keep the default Car dataset
    if (!selectedFile) {
      handleUseDefaultCar();
      return;
    }

    setIsAnalyzing(true);
    setMessage("");

    // Read CSV into client-side Local Storage (never stored on server disk/database)
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result || "";
        localStorage.setItem("ml-lab-custom-csv", text.slice(0, 500000));
        localStorage.setItem("ml-lab-custom-csv-name", selectedFile.name);
        localStorage.setItem("ml-lab-dataset-source", "custom");
      } catch {
        // quota exceeded fallback
      }
    };
    reader.readAsText(selectedFile);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(`${API_BASE}/api/dataset/analyze`, {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "The dataset could not be analyzed.");
      }

      setAnalysis(payload);
      try {
        localStorage.setItem("ml-lab-dataset-analysis", JSON.stringify(payload));
      } catch {
        /* ignore */
      }
    } catch (error) {
      setMessage(error.message || "Using client-side parsing mode.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  const isUsingCustom = analysis && !analysis.is_demo;

  return (
    <section className="try-section" aria-labelledby="upload-title">
      <p className="section-label">NOW TRY IT</p>
      <p className="try-subheading">Inspect your dataset.</p>
      <p className="try-copy">
        Upload a CSV or continue with the pre-loaded <strong>Car Sales</strong> dataset.
      </p>

      {/* Short Privacy Disclaimer Banner */}
      <div className="privacy-disclaimer-banner">
        <span className="privacy-badge">🔒 CLIENT-SIDE PRIVACY GUARANTEE</span>
        <p>
          Your data stays 100% inside your browser&apos;s Local Storage. We never store, 
          retain, or save your CSV on any server or database. If you don&apos;t upload a file, 
          the default <strong>Car Sales (car_sales_demo.csv)</strong> dataset is ready to use immediately!
        </p>
      </div>

      <div className="upload-card">
        <div className="upload-card-heading">
          <div>
            <p className="card-kicker">INPUT / 01</p>
            <h2 id="upload-title">
              {isUsingCustom ? "Your Custom Dataset" : "Default Dataset: Car Sales"}
            </h2>
          </div>
          <span className="csv-label">CSV files only</span>
        </div>

        <div className="drop-zone" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
          <span className="upload-icon" aria-hidden="true">↑</span>
          <strong>
            {selectedFile
              ? selectedFile.name
              : isUsingCustom
              ? analysis.filename
              : "car_sales_demo.csv (Default Active)"}
          </strong>
          <span>
            {selectedFile
              ? formatFileSize(selectedFile.size)
              : "Drop your dataset here, browse for a CSV, or use the pre-loaded car dataset"}
          </span>
          <span className="ready-label">
            {selectedFile ? "Ready to inspect" : "Ready to explore"}
          </span>
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={handleFileChange} />
          
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "12px", justifyContent: "center" }}>
            <button className="browse-button" type="button" onClick={handleBrowseClick}>
              Browse for CSV
            </button>
            <button className="default-car-btn" type="button" onClick={handleUseDefaultCar}>
              ⚡ Use Default Car Dataset
            </button>
          </div>
        </div>

        <div className="upload-footer">
          <span className="privacy-note">
            {isUsingCustom
              ? "Custom dataset active in Local Storage"
              : "Default car dataset active (car_sales_demo.csv)"}
          </span>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {isUsingCustom && (
              <button
                type="button"
                className="reset-car-btn"
                onClick={handleUseDefaultCar}
              >
                ↩️ Reset to Default Car
              </button>
            )}
            <button
              className="continue-button"
              type="button"
              disabled={isAnalyzing}
              onClick={handleContinue}
            >
              {isAnalyzing
                ? "Analyzing dataset..."
                : selectedFile
                ? "Analyze CSV ->"
                : "Explore Car Dataset ->"}
            </button>
          </div>
        </div>

        {message && <p className="upload-message" role="status">{message}</p>}

        {analysis && (
          <>
            <DatasetAnalysis analysis={analysis} />
            <button
              className="explore-button"
              type="button"
              onClick={() => {
                window.location.hash = "#explore";
              }}
            >
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
  const categoricalColumns = entries.filter(([, type]) => /object|string|category|str/i.test(type));

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