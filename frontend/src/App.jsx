import { useEffect, useState } from "react";
// App.css contains the visual design shared by all page sections.
import "./App.css";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Workflow from "./components/Workflow";
import FeatureSection from "./components/FeatureSection";
import Footer from "./components/Footer";
import Experiment from "./pages/Experiment";
import Explore from "./pages/Explore";
import Preprocess from "./pages/Preprocess";
import Train from "./pages/Train";
import Validate from "./pages/Validate";
import Evaluate from "./pages/Evaluate";

function App() {
  const [showExperiment, setShowExperiment] = useState(window.location.hash === "#experiment");
  const [showExplore, setShowExplore] = useState(window.location.hash === "#explore");
  const [showPreprocess, setShowPreprocess] = useState(window.location.hash === "#preprocess");
  const [showTrain, setShowTrain] = useState(window.location.hash === "#train");
  const [showEvaluate, setShowEvaluate] = useState(window.location.hash === "#evaluate");
  const [showValidate, setShowValidate] = useState(window.location.hash === "#validate");

  useEffect(() => {
    function handleHashChange() {
      setShowExperiment(window.location.hash === "#experiment");
      setShowExplore(window.location.hash === "#explore");
      setShowPreprocess(window.location.hash === "#preprocess");
      setShowTrain(window.location.hash === "#train");
      setShowEvaluate(window.location.hash === "#evaluate");
      setShowValidate(window.location.hash === "#validate");
      window.scrollTo(0, 0);
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  if (showExperiment) {
    return <Experiment />;
  }

  if (showExplore) {
    return <Explore />;
  }

  if (showPreprocess) {
    return <Preprocess />;
  }

  if (showTrain) {
    return <Train />;
  }

  if (showValidate) {
    return <Validate />;
  }

  if (showEvaluate) {
    return <Evaluate />;
  }

  return (
    // App is the top-level component: it assembles the smaller components.
    <div className="app-root">
      <Header />
      {/* main contains the primary content of the landing page. */}
      <main>
        <Hero />
        <Workflow />
        <FeatureSection />
      </main>
      <Footer />
    </div>
  );
}

// Export lets main.jsx import and render this component.
export default App;