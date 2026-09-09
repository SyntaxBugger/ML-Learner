// DiscoveryList previews the questions answered by the next lesson.
export default function DiscoveryList() {
  const discoveries = [
    "How many examples and clues it has",
    "Whether columns hold numbers or words",
    "Whether any cells are empty",
    "Which column might be the answer",
  ];

  return (
    <div className="discovery-list">
      <p className="section-label">WHAT YOU'LL DISCOVER</p>
      {discoveries.map((discovery, index) => (
        <div className="discovery-item" key={discovery}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <span>{discovery}</span>
        </div>
      ))}
      <p className="next-note">Next, we will look at the dataset you just uploaded and ask what it is telling us.</p>
    </div>
  );
}