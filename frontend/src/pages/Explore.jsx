import { useEffect, useMemo, useState } from "react";

const EMPTY_SUMMARY = {
  preview: [],
  numerical_summary: {},
  categorical_summary: {},
  correlations: {},
  outliers: {},
  numerical_columns: [],
  categorical_columns: [],
};

function Explore() {
  const [exploration, setExploration] = useState(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedNumericalColumn, setSelectedNumericalColumn] = useState("");
  const [selectedCategoricalColumn, setSelectedCategoricalColumn] = useState("");
  const [selectedCorrelationX, setSelectedCorrelationX] = useState("");
  const [selectedCorrelationY, setSelectedCorrelationY] = useState("");

  useEffect(() => {
    async function loadExploreData() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("http://localhost:5000/api/dataset/explore");
        const responseText = await response.text();
        let payload = {};

        if (responseText) {
          try {
            payload = JSON.parse(responseText);
          } catch {
            payload = {
              error: "The backend returned an unexpected response. Please complete Step 01 first and confirm the server is running.",
            };
          }
        }

        if (!response.ok) {
          throw new Error(payload.error || "Could not explore the dataset.");
        }

        setExploration(payload);

        const firstNumeric = payload.numerical_columns?.[0] || "";
        const firstCategorical = payload.categorical_columns?.[0] || "";
        setSelectedNumericalColumn(firstNumeric);
        setSelectedCategoricalColumn(firstCategorical);

        if (payload.numerical_columns?.length > 1) {
          setSelectedCorrelationX(payload.numerical_columns[0]);
          setSelectedCorrelationY(payload.numerical_columns[1]);
        }
      } catch (fetchError) {
        setError(fetchError.message || "Something went wrong while exploring the dataset.");
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
        Before teaching a model, we look at the data like a detective. We check what the columns mean, what looks usual, and what may need attention before learning begins.
      </p>

      {loading && (
        <div className="explore-state">
          <div className="state-badge">LOADING</div>
          <p>Exploring your dataset...</p>
        </div>
      )}

      {error && (
        <div className="explore-state error-state">
          <div className="state-badge">ERROR</div>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          <LessonSection
            title="Meet your data."
            explanation="Each row is one example and each column is a clue about it. These first rows show us the kind of information the model will receive."
            note="This is only a small sample, like looking at a few pages of a book. It helps us see the shape of the data, but it is not the whole story."
          >
            <DataPreview preview={exploration.preview} />
          </LessonSection>

          <LessonSection
            title="How are the numbers distributed?"
            explanation="These numbers give us a quick feel for a column. They help us see what is typical and how much the values vary."
            callouts={[
              { label: 'Mean', text: 'The average: add the values, then share the total.' },
              { label: 'Median', text: 'The middle value after putting the values in order.' },
              { label: 'Spread', text: 'A rough measure of how far values usually sit from the average.' },
              { label: 'Minimum / Maximum', text: 'The smallest and largest values we found.' },
            ]}
          >
            <NumericalSummary
              columns={numericColumns}
              selectedColumn={selectedNumericalColumn}
              setSelectedColumn={setSelectedNumericalColumn}
              stats={exploration.numerical_summary}
            />
            {selectedNumericStats && (
              <div className="mini-panel">
                <h3>{selectedNumericalColumn}</h3>
                <dl className="stat-grid">
                  <div><dt>Mean</dt><dd>{Number(selectedNumericStats.mean).toFixed(3)}</dd></div>
                  <div><dt>Median</dt><dd>{Number(selectedNumericStats.median).toFixed(3)}</dd></div>
                  <div><dt>Std dev</dt><dd>{Number(selectedNumericStats.std ?? 0).toFixed(3)}</dd></div>
                  <div><dt>Min</dt><dd>{Number(selectedNumericStats.min).toFixed(3)}</dd></div>
                  <div><dt>Max</dt><dd>{Number(selectedNumericStats.max).toFixed(3)}</dd></div>
                  <div><dt>Count</dt><dd>{selectedNumericStats.count}</dd></div>
                </dl>
              </div>
            )}
          </LessonSection>

          <LessonSection
            title="What categories appear?"
            explanation="Some columns hold words instead of amounts, such as fuel type or transmission. The counts below show which choices appear and which one is most common."
            note="Many models cannot use words directly. Later, we can turn choices like Petrol and Diesel into numbers without changing what they mean."
          >
            <CategoricalSummary
              columns={categoricalColumns}
              selectedColumn={selectedCategoricalColumn}
              setSelectedColumn={setSelectedCategoricalColumn}
              stats={exploration.categorical_summary}
            />
            {selectedCategoricalStats && (
              <div className="mini-panel">
                <h3>{selectedCategoricalColumn}</h3>
                <ul className="category-list">
                  <li><span>Unique values</span><strong>{selectedCategoricalStats.unique_count}</strong></li>
                  <li><span>Most common</span><strong>{selectedCategoricalStats.most_common}</strong></li>
                  <li><span>Frequency</span><strong>{selectedCategoricalStats.most_common_frequency}</strong></li>
                </ul>
                <CategoryBarChart valueCounts={selectedCategoricalStats.value_counts || {}} />
              </div>
            )}
          </LessonSection>

          <LessonSection
            title="Do variables move together?"
            explanation="Correlation asks whether two number columns tend to change together. It can reveal a useful clue, but it cannot tell us that one column causes the other."
            callouts={[
              { label: 'Positive', text: 'When one tends to go up, the other tends to go up too.' },
              { label: 'Negative', text: 'When one tends to go up, the other tends to go down.' },
              { label: 'Near zero', text: 'There is no clear straight-line pattern between them.' },
            ]}
            note="A high or low number is a clue to investigate, not proof that one thing causes another."
          >
            <CorrelationSection
              columns={numericColumns}
              xColumn={selectedCorrelationX}
              yColumn={selectedCorrelationY}
              setXColumn={setSelectedCorrelationX}
              setYColumn={setSelectedCorrelationY}
              correlations={exploration.correlations}
              value={correlationValue}
            />
          </LessonSection>

          <LessonSection
            title="Anything unusual?"
            explanation="An outlier is a value that sits far away from most of the others. It may be a mistake, or it may be a real example, so we check it before changing the data."
          >
            <OutlierSection outliers={exploration.outliers} columns={numericColumns} />
          </LessonSection>

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

function LessonSection({ title, explanation, note, callouts, children }) {
  return (
    <section className="explore-section">
      <div className="section-heading-row">
        <div>
          <p className="section-label">INSIGHT</p>
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
            <div key={column} className="stat-card">
              <h3>{column}</h3>
              <dl>
                <div><dt>Mean</dt><dd>{metrics.mean != null ? Number(metrics.mean).toFixed(3) : '—'}</dd></div>
                <div><dt>Median</dt><dd>{metrics.median != null ? Number(metrics.median).toFixed(3) : '—'}</dd></div>
                <div><dt>Min</dt><dd>{metrics.min != null ? Number(metrics.min).toFixed(3) : '—'}</dd></div>
                <div><dt>Max</dt><dd>{metrics.max != null ? Number(metrics.max).toFixed(3) : '—'}</dd></div>
                <div><dt>Std</dt><dd>{metrics.std != null ? Number(metrics.std).toFixed(3) : '—'}</dd></div>
              </dl>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CategoricalSummary({ columns, selectedColumn, setSelectedColumn, stats }) {
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
            <div key={column} className="stat-card">
              <h3>{column}</h3>
              <dl>
                <div><dt>Unique</dt><dd>{metrics.unique_count ?? 0}</dd></div>
                <div><dt>Most common</dt><dd>{metrics.most_common || '—'}</dd></div>
                <div><dt>Frequency</dt><dd>{metrics.most_common_frequency ?? 0}</dd></div>
              </dl>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CorrelationSection({ columns, xColumn, yColumn, setXColumn, setYColumn, correlations, value }) {
  return (
    <div className="correlation-panel">
      <div className="selector-row">
        <select value={xColumn} onChange={(event) => setXColumn(event.target.value)}>
          {columns.map((column) => <option key={column} value={column}>{column}</option>)}
        </select>
        <select value={yColumn} onChange={(event) => setYColumn(event.target.value)}>
          {columns.map((column) => <option key={column} value={column}>{column}</option>)}
        </select>
      </div>

      <div className="mini-panel correlation-value">
        <h3>{xColumn} vs {yColumn}</h3>
        <strong>{value != null ? Number(value).toFixed(3) : '—'}</strong>
        <p>This score shows how strongly the two number columns tend to move together. It is a clue, not proof that one causes the other.</p>
      </div>
    </div>
  );
}

function OutlierSection({ outliers, columns }) {
  return (
    <div className="outlier-grid">
      {columns.map((column) => {
        const stats = outliers[column] || {};
        return (
          <div key={column} className="stat-card">
            <h3>{column}</h3>
            <dl>
              <div><dt>Lower quarter</dt><dd>{stats.q1 != null ? Number(stats.q1).toFixed(3) : '—'}</dd></div>
              <div><dt>Upper quarter</dt><dd>{stats.q3 != null ? Number(stats.q3).toFixed(3) : '—'}</dd></div>
              <div><dt>Typical spread</dt><dd>{stats.iqr != null ? Number(stats.iqr).toFixed(3) : '—'}</dd></div>
              <div><dt>Potential outliers</dt><dd>{stats.potential_outlier_count ?? 0}</dd></div>
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

  const maxCount = Math.max(...counts.map(([, value]) => value));

  return (
    <div className="bar-chart">
      {counts.map(([label, value]) => (
        <div key={label} className="bar-row">
          <span>{label}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(value / maxCount) * 100}%` }} />
          </div>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

function ExploreSummary({ numericalCount, categoricalCount, largestCategoryColumn, strongestPositiveCorrelation, outlierColumns }) {
  return (
    <section className="explore-section">
      <p className="section-label">WHAT DID WE LEARN?</p>
      <h2>Quick summary</h2>
      <div className="summary-strip">
        <div><span>Number columns</span><strong>{numericalCount}</strong></div>
        <div><span>Word or category columns</span><strong>{categoricalCount}</strong></div>
        <div><span>Column with most choices</span><strong>{largestCategoryColumn || '—'}</strong></div>
        <div><span>Strongest columns moving together</span><strong>{strongestPositiveCorrelation || '—'}</strong></div>
        <div><span>Potential outliers</span><strong>{outlierColumns.length ? outlierColumns.join(', ') : 'None'}</strong></div>
      </div>

      <div className="lesson-card">
        <p className="section-label">WHAT THIS MEANS</p>
        <p>We now know what kinds of columns we have, which choices appear most often, how number columns move, and where unusual values may be hiding. That tells us what to clean or change before teaching a model.</p>
        <button type="button" className="continue-button explore-next-button" onClick={() => { window.location.hash = "#preprocess"; }}>Prepare data <span aria-hidden="true">-&gt;</span></button>
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
        best = `${rowKey} / ${columnKey}`;
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
