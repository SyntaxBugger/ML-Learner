// ExampleSection connects the general dataset lesson to a familiar use case.
export default function ExampleSection() {
  return (
    <aside className="example-section">
      <p className="section-label">EXAMPLE / PHISHING DETECTION</p>
      <h2>One dataset, one question:</h2>
      <p className="example-question">Imagine we want to decide whether a website is phishing:</p>
      <div className="example-points">
        <div><strong>One row</strong><span>one website to study</span></div>
        <div><strong>Features</strong><span>clues like URL length, HTTPS, and special characters</span></div>
        <div><strong>Target</strong><span>the answer: phishing or legitimate</span></div>
      </div>
    </aside>
  );
}