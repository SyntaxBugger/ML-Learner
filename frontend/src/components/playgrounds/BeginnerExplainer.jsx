import { useState } from "react";

/**
 * BeginnerExplainer provides a structured, beginner-first explanation
 * with three levels of understanding:
 * 1. The Real-Life Analogy (Basics / ELI5)
 * 2. Step-by-Step Breakdown (How it works)
 * 3. Why ML Cares (Machine learning connection)
 */
export default function BeginnerExplainer({
  badge = "CONCEPT BASICS",
  title,
  analogy,
  analogyText,
  breakdown = [],
  steps = [],
  whyItMatters,
  mlImpactText,
  deepDive,
  deepDiveContent,
}) {
  const [activeTab, setActiveTab] = useState("analogy"); // "analogy" | "breakdown" | "ml"
  const [showDeepDive, setShowDeepDive] = useState(false);

  const resolvedAnalogy = analogy || analogyText || "";
  const rawBreakdown = breakdown && breakdown.length ? breakdown : steps || [];
  const resolvedBreakdown = rawBreakdown.map((item) => ({
    term: item.term || item.title || "",
    text: item.text || item.desc || item.description || "",
  }));
  const resolvedWhyItMatters = whyItMatters || mlImpactText || "";
  const resolvedDeepDive = deepDive || deepDiveContent || "";

  return (
    <div className="beginner-explainer-card">
      <div className="explainer-header">
        <span className="explainer-badge">{badge}</span>
        {title && <h3 className="explainer-title">{title}</h3>}
      </div>

      <div className="explainer-tabs" role="tablist">
        <button
          type="button"
          className={`explainer-tab-btn ${activeTab === "analogy" ? "active" : ""}`}
          onClick={() => setActiveTab("analogy")}
          role="tab"
          aria-selected={activeTab === "analogy"}
        >
          <span className="tab-icon">🌱</span>
          <span>Everyday Analogy</span>
        </button>
        <button
          type="button"
          className={`explainer-tab-btn ${activeTab === "breakdown" ? "active" : ""}`}
          onClick={() => setActiveTab("breakdown")}
          role="tab"
          aria-selected={activeTab === "breakdown"}
        >
          <span className="tab-icon">🔍</span>
          <span>Step-by-Step</span>
        </button>
        <button
          type="button"
          className={`explainer-tab-btn ${activeTab === "ml" ? "active" : ""}`}
          onClick={() => setActiveTab("ml")}
          role="tab"
          aria-selected={activeTab === "ml"}
        >
          <span className="tab-icon">🤖</span>
          <span>Why ML Cares</span>
        </button>
      </div>

      <div className="explainer-tab-content">
        {activeTab === "analogy" && (
          <div className="tab-pane fade-in">
            <div className="analogy-callout">
              <span className="pane-kicker">THINK OF IT LIKE THIS:</span>
              <p className="analogy-text">{resolvedAnalogy}</p>
            </div>
          </div>
        )}

        {activeTab === "breakdown" && (
          <div className="tab-pane fade-in">
            <div className="breakdown-list">
              {resolvedBreakdown.map((item, index) => (
                <div key={index} className="breakdown-step">
                  <span className="step-num">{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    {item.term && <strong>{item.term}</strong>}
                    <p>{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "ml" && (
          <div className="tab-pane fade-in">
            <div className="ml-impact-box">
              <span className="pane-kicker">MACHINE LEARNING IMPACT:</span>
              <p>{resolvedWhyItMatters}</p>
            </div>
          </div>
        )}
      </div>

      {resolvedDeepDive && (
        <div className="explainer-footer">
          <button
            type="button"
            className="deep-dive-toggle"
            onClick={() => setShowDeepDive(!showDeepDive)}
          >
            <span>{showDeepDive ? "▲ Hide technical details" : "▼ Want to go deeper? (Click for technical details)"}</span>
          </button>
          {showDeepDive && (
            <div className="deep-dive-content fade-in">
              <p>{resolvedDeepDive}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
