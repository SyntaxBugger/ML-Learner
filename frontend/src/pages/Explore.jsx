import { useEffect, useMemo, useState } from "react";
import "../explore.css";
import MeanMedianPlayground from "../components/playgrounds/MeanMedianPlayground";
import CorrelationPlayground from "../components/playgrounds/CorrelationPlayground";
import OutlierDetectivePlayground from "../components/playgrounds/OutlierDetectivePlayground";
import BeginnerExplainer from "../components/playgrounds/BeginnerExplainer";
import { API_BASE } from "../config/api";

const DEMO_EXPLORATION = {
  preview: [
    { Car_Name: "ritz", Year: 2014, Selling_Price: 3.35, Present_Price: 5.59, Kms_Driven: 27000, Fuel_Type: "Petrol" },
    { Car_Name: "sx4", Year: 2013, Selling_Price: 4.75, Present_Price: 9.54, Kms_Driven: 43000, Fuel_Type: "Diesel" },
    { Car_Name: "ciaz", Year: 2017, Selling_Price: 7.25, Present_Price: 9.85, Kms_Driven: 6900, Fuel_Type: "Petrol" },
    { Car_Name: "wagon r", Year: 2011, Selling_Price: 2.85, Present_Price: 4.15, Kms_Driven: 5200, Fuel_Type: "Petrol" },
    { Car_Name: "swift", Year: 2014, Selling_Price: 4.60, Present_Price: 6.87, Kms_Driven: 42450, Fuel_Type: "Diesel" },
  ],
  numerical_columns: ["Year", "Selling_Price", "Present_Price", "Kms_Driven"],
  categorical_columns: ["Car_Name", "Fuel_Type"],
  numerical_summary: {
    Year: { count: 301, mean: 2013.6, median: 2014.0, std: 2.89, min: 2003, max: 2018 },
    Selling_Price: { count: 301, mean: 4.66, median: 3.60, std: 5.08, min: 0.1, max: 35.0 },
    Present_Price: { count: 301, mean: 7.63, median: 6.40, std: 8.64, min: 0.32, max: 92.6 },
    Kms_Driven: { count: 301, mean: 36947.2, median: 32000.0, std: 38886.1, min: 500, max: 500000 },
  },
  categorical_summary: {
    Car_Name: { unique_count: 98, most_common: "city", most_common_frequency: 26, value_counts: { city: 26, corolla: 17, verna: 14, brio: 10, jazz: 7 } },
    Fuel_Type: { unique_count: 3, most_common: "Petrol", most_common_frequency: 239, value_counts: { Petrol: 239, Diesel: 60, CNG: 2 } },
  },
  correlations: {
    Year: { Year: 1.0, Selling_Price: 0.24, Present_Price: -0.05, Kms_Driven: -0.52 },
    Selling_Price: { Year: 0.24, Selling_Price: 1.0, Present_Price: 0.88, Kms_Driven: 0.03 },
    Present_Price: { Year: -0.05, Selling_Price: 0.88, Present_Price: 1.0, Kms_Driven: 0.20 },
    Kms_Driven: { Year: -0.52, Selling_Price: 0.03, Present_Price: 0.20, Kms_Driven: 1.0 },
  },
  outliers: {
    Year: { q1: 2012, q3: 2016, iqr: 4, potential_outlier_count: 2 },
    Selling_Price: { q1: 0.9, q3: 6.0, iqr: 5.1, potential_outlier_count: 17 },
    Present_Price: { q1: 1.2, q3: 9.9, iqr: 8.7, potential_outlier_count: 14 },
    Kms_Driven: { q1: 15000, q3: 48767, iqr: 33767, potential_outlier_count: 8 },
  },
};

function Explore() {
  const [exploration, setExploration] = useState(DEMO_EXPLORATION);
  const [loading, setLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [selectedNumericalColumn, setSelectedNumericalColumn] = useState("Selling_Price");
  const [selectedCategoricalColumn, setSelectedCategoricalColumn] = useState("Fuel_Type");
  const [selectedCorrelationX, setSelectedCorrelationX] = useState("Selling_Price");
  const [selectedCorrelationY, setSelectedCorrelationY] = useState("Present_Price");
  const [selectedAnatomy, setSelectedAnatomy] = useState("rows");

  useEffect(() => {
    async function loadExploreData() {
      try {
        setLoading(true);

        const response = await fetch(`${API_BASE}/api/dataset/explore`);
        const responseText = await response.text();
        let payload = {};

        if (responseText) {
          try {
            payload = JSON.parse(responseText);
          } catch {
            // silent parse fallback
          }
        }

        if (!response.ok || !payload.preview || !payload.preview.length) {
          // If no user dataset uploaded, fallback to rich demo exploration mode seamlessly
          setExploration(DEMO_EXPLORATION);
          setIsDemoMode(true);
          setSelectedNumericalColumn("Selling_Price");
          setSelectedCategoricalColumn("Fuel_Type");
          setSelectedCorrelationX("Selling_Price");
          setSelectedCorrelationY("Present_Price");
          return;
        }

        setExploration(payload);
        setIsDemoMode(false);

        const firstNumeric = payload.numerical_columns?.[0] || "";
        const firstCategorical = payload.categorical_columns?.[0] || "";
        setSelectedNumericalColumn(firstNumeric);
        setSelectedCategoricalColumn(firstCategorical);

        if (payload.numerical_columns?.length > 1) {
          setSelectedCorrelationX(payload.numerical_columns[0]);
          setSelectedCorrelationY(payload.numerical_columns[1]);
        }
      } catch {
        // Fallback to demo dataset so the learner is never blocked
        setExploration(DEMO_EXPLORATION);
        setIsDemoMode(true);
      } finally {
        setLoading(false);
      }
    }

    loadExploreData();
  }, []);

  const numericColumns = exploration.numerical_columns || [];
  const categoricalColumns = exploration.categorical_columns || [];

  const selectedNumericStats = selectedNumericalColumn
    ? exploration.numerical_summary?.[selectedNumericalColumn] || null
    : null;

  const selectedCategoricalStats = selectedCategoricalColumn
    ? exploration.categorical_summary?.[selectedCategoricalColumn] || null
    : null;

  const correlationValue = useMemo(() => {
    if (!selectedCorrelationX || !selectedCorrelationY) return null;
    const row = exploration.correlations?.[selectedCorrelationX];
    if (!row) return null;
    return row[selectedCorrelationY];
  }, [exploration.correlations, selectedCorrelationX, selectedCorrelationY]);

  return (
    <div className="explore-page">
      <header className="explore-header">
        <div>
          <p className="section-label">STEP 02 / EXPLORE</p>
          <h1>Now let's look inside the data.</h1>
        </div>
        <button type="button" className="explore-back" onClick={() => { window.location.hash = "#experiment"; }}>
          Back to dataset
        </button>
      </header>

      <p className="explore-intro">
        Before teaching any machine learning model, we become <strong>data detectives</strong>. We inspect what the columns mean, check what values are typical, discover relationships, and spot unusual records that could mislead our algorithms.
      </p>

      {isDemoMode && (
        <div className="live-insight-banner" style={{ margin: "22px 0 10px" }}>
          <div className="insight-icon">💡</div>
          <div className="insight-content">
            <strong style={{ color: "var(--lime)" }}>INTERACTIVE DEMO DATASET ACTIVE:</strong>
            <p>
              You haven't uploaded a custom CSV in Step 01 yet, so we've preloaded an interactive car-sales dataset for you! All beginner lessons, statistics, and interactive playgrounds below are fully operational. You can explore freely or click <strong>Back to dataset</strong> to upload your own CSV file anytime.
            </p>
          </div>
        </div>
      )}

      {!loading && (
        <>
          {/* ========================================================
              SECTION 1: MEET YOUR DATA (DATA ANATOMY)
             ======================================================== */}
          <LessonSection
            badge="DATA ANATOMY"
            title="1. Meet your data: What is a table?"
            explanation="A dataset is essentially a structured table of real-world observations. Before running complex mathematics, we inspect raw sample rows to get an intuitive feel for what information we have collected."
            note="This is a small preview of the first 5 rows, like skimming the first few pages of a book to understand the characters before reading the entire story."
          >
            {/* Beginner Explainer with Tabs */}
            <BeginnerExplainer
              badge="FOUNDATION 01"
              title="Understanding the Building Blocks: Rows, Columns & Clues"
              analogy="Think of a dataset like a patient logbook at a clinic. Each row is one individual patient who walked in. Each column is a specific question or measurement recorded for them: their age, blood pressure, fever status, and whether they had the flu."
              breakdown={[
                {
                  term: "Row (Observation / Instance)",
                  text: "One single real-world event, person, website, or product that was measured."
                },
                {
                  term: "Column (Attribute / Variable)",
                  text: "One specific measurement or question recorded across all rows (e.g. Price, Mileage, or Fuel Type)."
                },
                {
                  term: "Feature vs. Target",
                  text: "Features are the clues given to the computer. The Target is the mystery answer we want it to learn to predict."
                }
              ]}
              whyItMatters="Machine learning algorithms do not possess common sense. They cannot guess what a column means from its title. If a column has confusing headers or dirty formatting, the model will struggle to learn useful patterns."
              deepDive="Tabular data is represented in memory as a 2D matrix (X rows × Y columns). Columns generally fall into two broad data types: Numerical (continuous or discrete quantities you can calculate with) and Categorical (text labels, groups, or identifiers)."
            />

            {/* Interactive Anatomy Filter */}
            <div className="anatomy-interactive-strip">
              <div
                className={`anatomy-pill-card ${selectedAnatomy === "rows" ? "selected" : ""}`}
                onClick={() => setSelectedAnatomy("rows")}
              >
                <span className="anatomy-tag">CLICK TO HIGHLIGHT</span>
                <strong>Rows = Examples</strong>
                <p>Each row represents one distinct item being analyzed ({exploration.preview.length} rows shown in preview).</p>
              </div>

              <div
                className={`anatomy-pill-card ${selectedAnatomy === "columns" ? "selected" : ""}`}
                onClick={() => setSelectedAnatomy("columns")}
              >
                <span className="anatomy-tag">CLICK TO HIGHLIGHT</span>
                <strong>Columns = Attributes</strong>
                <p>{numericColumns.length} numerical columns and {categoricalColumns.length} categorical columns detected.</p>
              </div>

              <div
                className={`anatomy-pill-card ${selectedAnatomy === "features" ? "selected" : ""}`}
                onClick={() => setSelectedAnatomy("features")}
              >
                <span className="anatomy-tag">CLICK TO HIGHLIGHT</span>
                <strong>Features vs Target</strong>
                <p>In Step 03, you will designate one column as the Target (the answer) and the rest as Features (clues).</p>
              </div>
            </div>

            <DataPreview preview={exploration.preview} />
          </LessonSection>

          {/* ========================================================
              SECTION 2: NUMERICAL DISTRIBUTION
             ======================================================== */}
          <LessonSection
            badge="STATISTICS BASICS"
            title="2. How are the numbers distributed? (The Shape of Data)"
            explanation="When examining a column of numbers, we need summary metrics to understand its 'center' and its 'spread'. Summary metrics tell us what is typical, how wild the variations are, and whether extreme values are skewing the picture."
            callouts={[
              { label: 'Mean (Average)', text: 'Add all numbers together and divide equally among all rows.' },
              { label: 'Median (Middle)', text: 'Sort the numbers from lowest to highest and pick the exact middle number.' },
              { label: 'Std Dev (Spread)', text: 'Measures how tightly values cluster around the mean vs. flying all over the map.' },
              { label: 'Min / Max (Bounds)', text: 'The lowest floor and highest ceiling observed in the entire column.' },
            ]}
          >
            {/* Beginner Explainer with Tabs */}
            <BeginnerExplainer
              badge="FOUNDATION 02"
              title="Mean vs. Median: The Cookie Jar Analogy"
              analogy="Imagine 5 friends bring cookies to a table: [2, 3, 3, 4, 8]. The Mean asks: 'If we put all 20 cookies in a bowl and shared them equally, everyone gets 4.' The Median asks: 'If we line the bags up from smallest to largest, which bag is sitting right in the middle?' Here, the median is 3."
              breakdown={[
                {
                  term: "When Mean works great",
                  text: "When data is symmetrical (a classic bell curve), the Mean accurately represents the typical example."
                },
                {
                  term: "When Mean can deceive you",
                  text: "If a billionaire walks into a café, the 'average' wealth in the room becomes $100 Million, even though everyone else has $20 in their pocket! The Mean gets pulled by extremes."
                },
                {
                  term: "Why Median is the Hero",
                  text: "The Median ignores extreme values because it only cares about order. The billionaire in the café only shifts the Median by one position."
                }
              ]}
              whyItMatters="Many beginner machine learning mistakes happen by assuming the Mean represents normal behavior. If your dataset has extreme salaries or house prices, the Mean will be artificially inflated, misguiding models and missing value imputations."
              deepDive="Standard deviation (σ) is the square root of the variance. In a normal distribution, ~68% of your data points fall within 1 standard deviation of the mean, and ~95% fall within 2 standard deviations. When the gap between Mean and Median is large, the column is heavily skewed."
            />

            {/* Interactive Playground 1: Mean vs. Median Simulator */}
            <MeanMedianPlayground />

            {/* Live Dataset Inspection */}
            <div className="dataset-inspection-wrapper">
              <h3 style={{ fontSize: "16px", margin: "24px 0 12px", color: "var(--paper)" }}>
                Now inspect the numbers in your uploaded dataset:
              </h3>
              <NumericalSummary
                columns={numericColumns}
                selectedColumn={selectedNumericalColumn}
                setSelectedColumn={setSelectedNumericalColumn}
                stats={exploration.numerical_summary}
              />
              {selectedNumericStats && (
                <div className="mini-panel">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                    <h3 style={{ margin: 0 }}>Column: {selectedNumericalColumn}</h3>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--lime)" }}>
                      {Math.abs(Number(selectedNumericStats.mean) - Number(selectedNumericStats.median)) > (Number(selectedNumericStats.std || 1) * 0.3)
                        ? "⚠️ Skewed (Mean differs from Median)"
                        : "✅ Symmetrical (Mean & Median are close)"}
                    </span>
                  </div>
                  <dl className="stat-grid">
                    <div><dt>Mean (Average)</dt><dd>{Number(selectedNumericStats.mean).toFixed(3)}</dd></div>
                    <div><dt>Median (Middle)</dt><dd>{Number(selectedNumericStats.median).toFixed(3)}</dd></div>
                    <div><dt>Std dev (Spread)</dt><dd>{Number(selectedNumericStats.std ?? 0).toFixed(3)}</dd></div>
                    <div><dt>Minimum (Floor)</dt><dd>{Number(selectedNumericStats.min).toFixed(3)}</dd></div>
                    <div><dt>Maximum (Ceiling)</dt><dd>{Number(selectedNumericStats.max).toFixed(3)}</dd></div>
                    <div><dt>Total Count</dt><dd>{selectedNumericStats.count}</dd></div>
                  </dl>
                </div>
              )}
            </div>
          </LessonSection>

          {/* ========================================================
              SECTION 3: CATEGORICAL SUMMARY
             ======================================================== */}
          <LessonSection
            badge="CATEGORICAL DATA"
            title="3. What categories appear? (Labels, Groups & Imbalance)"
            explanation="Not every clue is a number. Columns like Fuel Type, City, or Website Protocol hold word choices. We must see which choices exist and check whether one choice completely dominates the dataset."
            note="Machine learning models are mathematical engines—they cannot perform arithmetic directly on words like 'Petrol' or 'Diesel'. In Step 03 (Preprocess), we will transform categories into numbers (Encoding) without changing what they mean."
          >
            {/* Beginner Explainer with Tabs */}
            <BeginnerExplainer
              badge="FOUNDATION 03"
              title="Words as Categories: Why Computers Need Translations"
              analogy="Think of sorting your laundry into baskets: [Whites, Darks, Delicates]. These are categories. You can't calculate the 'average color' of your shirts by adding Whites and Darks together—they are distinct groups."
              breakdown={[
                {
                  term: "Unique Values (Cardinality)",
                  text: "How many different options exist in this column. For example, 'Yes/No' has 2 unique values (low cardinality); 'Postal Code' might have 5,000 (high cardinality)."
                },
                {
                  term: "Most Common (The Mode)",
                  text: "The single choice that appears most frequently in this column."
                },
                {
                  term: "Class Imbalance Warning",
                  text: "If 98% of your emails are 'Legitimate' and only 2% are 'Phishing', a lazy model could guess 'Legitimate' 100% of the time and boast 98% accuracy while being completely useless! Checking frequency guards against this trap."
                }
              ]}
              whyItMatters="Categories with too many rare choices or extreme imbalance require special handling. High-cardinality features can slow down models or cause overfitting if not grouped properly."
              deepDive="Categorical variables can be Nominal (no natural ordering, e.g. Red, Blue, Green) or Ordinal (meaningful order, e.g. Low, Medium, High). Nominal variables typically use One-Hot Encoding (creating 0/1 columns), whereas Ordinal variables can use integer ranking."
            />

            <div className="dataset-inspection-wrapper">
              <h3 style={{ fontSize: "16px", margin: "20px 0 12px", color: "var(--paper)" }}>
                Inspect categorical columns in your dataset:
              </h3>
              <CategoricalSummary
                columns={categoricalColumns}
                selectedColumn={selectedCategoricalColumn}
                setSelectedColumn={setSelectedCategoricalColumn}
                stats={exploration.categorical_summary}
              />
              {selectedCategoricalStats && (
                <div className="mini-panel">
                  <h3>Distribution of: {selectedCategoricalColumn}</h3>
                  <ul className="category-list">
                    <li><span>Unique Choices (Cardinality)</span><strong>{selectedCategoricalStats.unique_count}</strong></li>
                    <li><span>Top Choice (Mode)</span><strong>{selectedCategoricalStats.most_common}</strong></li>
                    <li><span>Top Choice Frequency</span><strong>{selectedCategoricalStats.most_common_frequency} times</strong></li>
                  </ul>
                  <CategoryBarChart valueCounts={selectedCategoricalStats.value_counts || {}} />
                </div>
              )}
            </div>
          </LessonSection>

          {/* ========================================================
              SECTION 4: CORRELATION
             ======================================================== */}
          <LessonSection
            badge="FEATURE RELATIONSHIPS"
            title="4. Do variables move together? (Correlation & The Causation Trap)"
            explanation="Correlation measures whether two numerical features tend to change in sync. Finding strong relationships gives models potent predictive clues—but confusing correlation with causation can lead to catastrophic mistakes."
            callouts={[
              { label: 'Positive (+)', text: 'When X goes up, Y tends to go up (e.g. Study hours & exam grade).' },
              { label: 'Negative (-)', text: 'When X goes up, Y tends to go down (e.g. Car age & resale price).' },
              { label: 'Near Zero (0)', text: 'No linear connection (e.g. Coffee consumed & winning the lottery).' },
            ]}
            note="A high correlation score is a statistical clue to investigate, not evidence that one variable caused the other to change."
          >
            {/* Beginner Explainer with Tabs */}
            <BeginnerExplainer
              badge="FOUNDATION 04"
              title="Correlation vs. Causation: The Hidden Third Variable"
              analogy="Imagine you notice that on days when people buy lots of ice cream, hospital visits for sunburns also shoot up! Does eating ice cream cause sunburn? No! A hidden factor—bright sunny weather—causes both to increase simultaneously."
              breakdown={[
                {
                  term: "The Pearson Scale (-1.00 to +1.00)",
                  text: "+1.00 means a perfect uphill line; -1.00 means a perfect downhill line; 0.00 means points are scattered randomly."
                },
                {
                  term: "Why Models Love Correlation",
                  text: "If Feature X is strongly correlated with the Target, the model can make very accurate guesses just by watching Feature X."
                },
                {
                  term: "Multicollinearity Danger",
                  text: "If two input features are 99% correlated with each other (like 'Length in inches' and 'Length in centimeters'), giving both to a model is redundant and can confuse linear algorithms."
                }
              ]}
              whyItMatters="In Machine Learning, correlation allows us to prioritize the most informative clues and weed out redundant or useless noise. However, domain knowledge is always needed to ensure the relationship makes sense."
              deepDive="Pearson's r measures linear relationships. Non-linear relationships (like a U-shaped curve where very young and very old people both visit the doctor frequently) can have a Pearson r close to zero even though a strong relationship exists! Spearman rank correlation can be used for monotonic non-linear relations."
            />

            {/* Interactive Playground 2: Correlation Simulator */}
            <CorrelationPlayground />

            {/* Live Dataset Correlation Matrix Check */}
            <div className="dataset-inspection-wrapper">
              <h3 style={{ fontSize: "16px", margin: "24px 0 12px", color: "var(--paper)" }}>
                Calculate Pearson correlation between any two columns in your data:
              </h3>
              <CorrelationSection
                columns={numericColumns}
                xColumn={selectedCorrelationX}
                yColumn={selectedCorrelationY}
                setXColumn={setSelectedCorrelationX}
                setYColumn={setSelectedCorrelationY}
                value={correlationValue}
              />
            </div>
          </LessonSection>

          {/* ========================================================
              SECTION 5: OUTLIERS
             ======================================================== */}
          <LessonSection
            badge="ANOMALY DETECTION"
            title="5. Anything unusual? (Outliers & The Detective's Rule)"
            explanation="An outlier is a data point that sits dramatically far away from the rest of the observations. Some outliers are simple human typing mistakes, while others are rare, high-value real-world events. We must investigate before deciding whether to clean them."
          >
            {/* Beginner Explainer with Tabs */}
            <BeginnerExplainer
              badge="FOUNDATION 05"
              title="The Odd Duck: How Math Finds Outliers"
              analogy="If 20 people in a room are between 20 and 40 years old, and one person is 38, that person is completely normal. If someone enters claiming to be 250 years old, that's an impossible outlier (almost certainly a typo for 25). If someone is 98, that's rare, but physically possible!"
              breakdown={[
                {
                  term: "The IQR (Interquartile Range)",
                  text: "Sort the data and cut it into four quarters. Q1 is the 25% mark; Q3 is the 75% mark. The middle 50% between them is the IQR."
                },
                {
                  term: "Tukey's 1.5 × IQR Fence Rule",
                  text: "Anything that falls more than 1.5 times the IQR box above Q3 or below Q1 is flagged as a potential outlier for inspection."
                },
                {
                  term: "The Golden Rule: Don't Blindly Delete",
                  text: "If an outlier represents fraud or a billion-dollar transaction, deleting it teaches the model that extreme events never happen!"
                }
              ]}
              whyItMatters="Outliers heavily distort distance-based and linear models (like Linear Regression or K-Means) because squared-error loss functions penalize big mistakes exponentially. Tree models (Decision Trees, Random Forests) are naturally robust to outliers."
              deepDive="Common outlier mitigation strategies include: 1) Trimming (removing the rows if proven erroneous), 2) Winsorization/Capping (clamping values at the 99th percentile), and 3) Robust scaling (scaling by median and IQR rather than mean and standard deviation)."
            />

            {/* Interactive Playground 3: Outlier Detective */}
            <OutlierDetectivePlayground />

            {/* Live Dataset Outlier Check */}
            <div className="dataset-inspection-wrapper">
              <h3 style={{ fontSize: "16px", margin: "24px 0 12px", color: "var(--paper)" }}>
                Potential outliers detected across your dataset:
              </h3>
              <OutlierSection outliers={exploration.outliers} columns={numericColumns} />
            </div>
          </LessonSection>

          {/* ========================================================
              SECTION 6: EXPLORE SUMMARY & WHAT DID WE LEARN
             ======================================================== */}
          <ExploreSummary
            numericalCount={numericColumns.length}
            categoricalCount={categoricalColumns.length}
            largestCategoryColumn={findLargestCategoryColumn(exploration.categorical_summary)}
            strongestPositiveCorrelation={findStrongestPositiveCorrelation(exploration.correlations)}
            outlierColumns={findOutlierColumns(exploration.outliers)}
          />
        </>
      )}
    </div>
  );
}

function LessonSection({ badge, title, explanation, note, callouts, children }) {
  return (
    <section className="explore-section">
      <div className="section-heading-row">
        <div>
          <p className="section-label">{badge || "INSIGHT"}</p>
          <h2>{title}</h2>
        </div>
      </div>

      <p className="explore-explanation">{explanation}</p>

      {callouts && (
        <div className="concept-callouts">
          {callouts.map((callout) => (
            <div key={callout.label} className="concept-callout">
              <strong>{callout.label}</strong>
              <span>{callout.text}</span>
            </div>
          ))}
        </div>
      )}

      {children}

      {note && <p className="explore-note">{note}</p>}
    </section>
  );
}

function DataPreview({ preview }) {
  const columns = preview.length ? Object.keys(preview[0]) : [];

  return (
    <div className="chart-panel">
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              {columns.map((column) => <th key={column}>{column}</th>)}
            </tr>
          </thead>
          <tbody>
            {preview.map((row, rowIndex) => (
              <tr key={`${rowIndex}-${Object.values(row).join('-')}`}>
                {columns.map((column) => <td key={`${rowIndex}-${column}`}>{String(row[column])}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NumericalSummary({ columns, selectedColumn, setSelectedColumn, stats }) {
  return (
    <div className="summary-stack">
      <div className="selector-row">
        {columns.map((column) => (
          <button
            key={column}
            type="button"
            className={selectedColumn === column ? "selector-button active" : "selector-button"}
            onClick={() => setSelectedColumn(column)}
          >
            {column}
          </button>
        ))}
      </div>

      <div className="stats-grid">
        {columns.map((column) => {
          const metrics = stats[column] || {};
          return (
            <div key={column} className={`stat-card ${selectedColumn === column ? "active-stat-card" : ""}`}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0 }}>{column}</h3>
                {selectedColumn === column && <span style={{ color: "var(--lime)", fontSize: "12px", fontFamily: "var(--font-mono)" }}>SELECTED</span>}
              </div>
              <dl style={{ marginTop: "12px" }}>
                <div><dt>Mean (Avg)</dt><dd>{metrics.mean != null ? Number(metrics.mean).toFixed(3) : '—'}</dd></div>
                <div><dt>Median (Mid)</dt><dd>{metrics.median != null ? Number(metrics.median).toFixed(3) : '—'}</dd></div>
                <div><dt>Std Dev</dt><dd>{metrics.std != null ? Number(metrics.std).toFixed(3) : '—'}</dd></div>
                <div><dt>Min</dt><dd>{metrics.min != null ? Number(metrics.min).toFixed(3) : '—'}</dd></div>
                <div><dt>Max</dt><dd>{metrics.max != null ? Number(metrics.max).toFixed(3) : '—'}</dd></div>
                <div><dt>Count</dt><dd>{metrics.count ?? '—'}</dd></div>
              </dl>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CategoricalSummary({ columns, selectedColumn, setSelectedColumn, stats }) {
  if (!columns.length) {
    return <div className="explore-state" style={{ margin: "14px 0" }}><p>No categorical (text label) columns in this dataset.</p></div>;
  }

  return (
    <div className="summary-stack">
      <div className="selector-row">
        {columns.map((column) => (
          <button
            key={column}
            type="button"
            className={selectedColumn === column ? "selector-button active" : "selector-button"}
            onClick={() => setSelectedColumn(column)}
          >
            {column}
          </button>
        ))}
      </div>

      <div className="stats-grid">
        {columns.map((column) => {
          const metrics = stats[column] || {};
          return (
            <div key={column} className={`stat-card ${selectedColumn === column ? "active-stat-card" : ""}`}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0 }}>{column}</h3>
                {selectedColumn === column && <span style={{ color: "var(--lime)", fontSize: "12px", fontFamily: "var(--font-mono)" }}>SELECTED</span>}
              </div>
              <dl style={{ marginTop: "12px" }}>
                <div><dt>Unique choices</dt><dd>{metrics.unique_count ?? 0}</dd></div>
                <div><dt>Most common</dt><dd>{metrics.most_common || '—'}</dd></div>
                <div><dt>Occurrences</dt><dd>{metrics.most_common_frequency ?? 0}</dd></div>
              </dl>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CorrelationSection({ columns, xColumn, yColumn, setXColumn, setYColumn, value }) {
  if (columns.length < 2) {
    return <div className="explore-state"><p>Need at least two numerical columns to compute correlation.</p></div>;
  }

  const absVal = value != null ? Math.abs(value) : 0;
  const interpretation =
    value == null
      ? "Select two variables"
      : absVal >= 0.7
      ? value > 0 ? "Strong Positive: High values of X occur with high values of Y" : "Strong Negative: High values of X occur with low values of Y"
      : absVal >= 0.3
      ? value > 0 ? "Moderate Positive relationship" : "Moderate Negative relationship"
      : "Weak or No linear correlation";

  return (
    <div className="correlation-panel">
      <div className="selector-row" style={{ alignItems: "center" }}>
        <label style={{ fontSize: "13.5px", color: "var(--muted)", fontFamily: "var(--font-mono)" }}>Feature 1:</label>
        <select value={xColumn} onChange={(event) => setXColumn(event.target.value)}>
          {columns.map((column) => <option key={column} value={column}>{column}</option>)}
        </select>
        <span style={{ color: "var(--lime)", fontWeight: "bold" }}>vs</span>
        <label style={{ fontSize: "13.5px", color: "var(--muted)", fontFamily: "var(--font-mono)" }}>Feature 2:</label>
        <select value={yColumn} onChange={(event) => setYColumn(event.target.value)}>
          {columns.map((column) => <option key={column} value={column}>{column}</option>)}
        </select>
      </div>

      <div className="mini-panel correlation-value">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--muted)", letterSpacing: "0.1em" }}>PEARSON COEFFICIENT</span>
            <h3 style={{ margin: "4px 0 0" }}>{xColumn} ↔ {yColumn}</h3>
          </div>
          <strong style={{ color: value >= 0 ? "var(--lime)" : "var(--coral)", fontSize: "28px" }}>
            {value != null ? (value >= 0 ? `+${Number(value).toFixed(3)}` : Number(value).toFixed(3)) : '—'}
          </strong>
        </div>

        <div style={{ marginTop: "12px", padding: "10px 12px", background: "rgba(0,0,0,0.2)", borderRadius: "4px" }}>
          <strong style={{ fontSize: "12px", color: "var(--paper)", display: "block", marginBottom: "4px" }}>
            Detective's Verdict: {interpretation}
          </strong>
          <p style={{ margin: 0, fontSize: "13.5px", color: "#aeb8ad", lineHeight: 1.5 }}>
            {absVal >= 0.7
              ? "These two features share a substantial linear pattern. In machine learning, this could either provide strong predictive power or signify redundant features."
              : "There is little direct straight-line dependency between these two metrics in your dataset."}
          </p>
        </div>
      </div>
    </div>
  );
}

function OutlierSection({ outliers, columns }) {
  if (!columns.length) return null;

  return (
    <div className="outlier-grid">
      {columns.map((column) => {
        const stats = outliers[column] || {};
        const count = stats.potential_outlier_count ?? 0;
        return (
          <div key={column} className={`stat-card ${count > 0 ? "outlier-detected-card" : ""}`}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>{column}</h3>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  padding: "3px 6px",
                  borderRadius: "3px",
                  background: count > 0 ? "rgba(255,119,95,0.15)" : "rgba(215,243,107,0.1)",
                  color: count > 0 ? "var(--coral)" : "var(--lime)",
                }}
              >
                {count > 0 ? `🚨 ${count} Potential Outliers` : "✅ Clean"}
              </span>
            </div>
            <dl style={{ marginTop: "12px" }}>
              <div><dt>Lower quarter (Q1)</dt><dd>{stats.q1 != null ? Number(stats.q1).toFixed(3) : '—'}</dd></div>
              <div><dt>Upper quarter (Q3)</dt><dd>{stats.q3 != null ? Number(stats.q3).toFixed(3) : '—'}</dd></div>
              <div><dt>Typical spread (IQR)</dt><dd>{stats.iqr != null ? Number(stats.iqr).toFixed(3) : '—'}</dd></div>
              <div><dt>Outlier Count</dt><dd style={{ color: count > 0 ? "var(--coral)" : "var(--paper)" }}>{count}</dd></div>
            </dl>
          </div>
        );
      })}
    </div>
  );
}

function CategoryBarChart({ valueCounts }) {
  const counts = Object.entries(valueCounts || {});
  if (!counts.length) return null;

  const total = counts.reduce((acc, [, val]) => acc + val, 0);
  const maxCount = Math.max(...counts.map(([, value]) => value));

  return (
    <div className="bar-chart">
      {counts.map(([label, value]) => {
        const pct = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
        return (
          <div key={label} className="bar-row">
            <span title={label} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {label}
            </span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${(value / maxCount) * 100}%` }} />
            </div>
            <strong>{value} <small style={{ color: "var(--muted)", fontWeight: "normal" }}>({pct}%)</small></strong>
          </div>
        );
      })}
    </div>
  );
}

function ExploreSummary({ numericalCount, categoricalCount, largestCategoryColumn, strongestPositiveCorrelation, outlierColumns }) {
  return (
    <section className="explore-section">
      <p className="section-label">DETECTIVE'S REPORT</p>
      <h2>What did we learn from this dataset?</h2>
      <div className="summary-strip">
        <div><span>Numeric Clues</span><strong>{numericalCount} columns</strong></div>
        <div><span>Categorical Clues</span><strong>{categoricalCount} columns</strong></div>
        <div><span>Most Diverse Category</span><strong>{largestCategoryColumn || '—'}</strong></div>
        <div><span>Strongest Correlation</span><strong>{strongestPositiveCorrelation || '—'}</strong></div>
        <div><span>Columns with Outliers</span><strong style={{ color: outlierColumns.length ? "var(--coral)" : "var(--lime)" }}>{outlierColumns.length ? outlierColumns.join(', ') : 'None'}</strong></div>
      </div>

      <div className="lesson-card" style={{ marginTop: "24px" }}>
        <p className="section-label">WHAT HAPPENS NEXT?</p>
        <p>
          We now understand the anatomy of our dataset: what values are standard, which categories dominate, how number columns align, and where potential data anomalies lurk.
          In <strong>Step 03: Preprocess</strong>, we will transform these raw clues into the exact mathematical format required to train a machine learning model.
        </p>
        <button
          type="button"
          className="continue-button explore-next-button"
          onClick={() => { window.location.hash = "#preprocess"; }}
        >
          Proceed to Step 03: Preprocess Data <span aria-hidden="true">-&gt;</span>
        </button>
      </div>
    </section>
  );
}

function findLargestCategoryColumn(categoricalSummary) {
  if (!categoricalSummary) return null;
  const entries = Object.entries(categoricalSummary);
  if (!entries.length) return null;
  entries.sort((a, b) => (b[1]?.unique_count ?? 0) - (a[1]?.unique_count ?? 0));
  return entries[0]?.[0] || null;
}

function findStrongestPositiveCorrelation(correlations) {
  if (!correlations || typeof correlations !== 'object') return null;
  let best = null;
  let bestValue = -Infinity;

  Object.entries(correlations).forEach(([rowKey, row]) => {
    Object.entries(row || {}).forEach(([columnKey, value]) => {
      if (rowKey === columnKey) return;
      if (typeof value === 'number' && value > bestValue) {
        bestValue = value;
        best = `${rowKey} ↔ ${columnKey} (+${value.toFixed(2)})`;
      }
    });
  });

  return best;
}

function findOutlierColumns(outliers) {
  if (!outliers || typeof outliers !== 'object') return [];
  return Object.entries(outliers)
    .filter(([, details]) => (details?.potential_outlier_count ?? 0) > 0)
    .map(([column]) => column);
}

export default Explore;
