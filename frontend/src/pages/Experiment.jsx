import ExperimentHeader from "../components/ExperimentHeader";
import ExperimentProgress from "../components/ExperimentProgress";
import DatasetUpload from "../components/DatasetUpload";
import LessonPanel from "../components/LessonPanel";

// Experiment assembles the first step of the learning workspace.
export default function Experiment() {
  return (
    <div className="experiment-page">
      <ExperimentHeader />
      <ExperimentProgress />

      <main className="experiment-main">
        <LessonPanel />
        <DatasetUpload />
      </main>
    </div>
  );
}