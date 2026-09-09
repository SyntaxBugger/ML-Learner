import json
import sys
import time

import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    mean_absolute_error,
    mean_squared_error,
    precision_score,
    r2_score,
    recall_score,
)
from sklearn.model_selection import train_test_split

from train_model import build_model, make_json_value
from validate_model import build_preprocessing


MODELS = {
    "regression": ["linear_regression", "decision_tree_regressor", "random_forest_regressor"],
    "classification": ["logistic_regression", "decision_tree_classifier", "random_forest_classifier"],
}


def evaluate_dataset(file_path, request):
    dataframe = pd.read_csv(file_path)
    target = request.get("target")
    features = request.get("features") or []
    problem_type = request.get("problem_type")
    training_percentage = int(request.get("training_percentage", 80))
    random_state = int(request.get("random_state", 42))

    if not target or target not in dataframe.columns:
        raise ValueError("Please choose a valid target column.")
    if not features or any(feature not in dataframe.columns for feature in features):
        raise ValueError("Please choose at least one valid feature column.")
    if target in features:
        raise ValueError("The target cannot also be a feature.")
    if problem_type not in MODELS:
        raise ValueError("Please choose regression or classification.")
    if not 50 <= training_percentage <= 90:
        raise ValueError("The training percentage must be between 50 and 90.")

    working = dataframe[features + [target]].copy().dropna(subset=[target])
    X = working[features]
    y = working[target]
    if len(working) < 2:
        raise ValueError("The dataset needs at least two rows with a target value.")
    if problem_type == "classification" and y.nunique(dropna=True) < 2:
        raise ValueError("Classification needs at least two target categories.")

    stratify = y if problem_type == "classification" and y.value_counts().min() >= 2 else None
    test_size = 1 - training_percentage / 100
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=stratify
    )
    labels = sorted({make_json_value(value) for value in y.tolist()}) if problem_type == "classification" else []
    results = []
    fitted = {}

    for model_type in MODELS[problem_type]:
        started = time.perf_counter()
        pipeline = __import__("sklearn.pipeline", fromlist=["Pipeline"]).Pipeline([
            ("preprocess", build_preprocessing(working, features)),
            ("model", build_model(problem_type, model_type)),
        ])
        pipeline.fit(X_train, y_train)
        predictions = pipeline.predict(X_test)
        elapsed = round((time.perf_counter() - started) * 1000, 2)
        metrics = regression_metrics(y_test, predictions) if problem_type == "regression" else classification_metrics(y_test, predictions, labels)
        results.append({"model_type": model_type, "training_time_ms": elapsed, **metrics})
        fitted[model_type] = (pipeline, predictions)

    best = min(results, key=lambda result: (result["rmse"], -result["r2"])) if problem_type == "regression" else max(results, key=lambda result: (result["f1"], result["accuracy"]))
    best_pipeline, best_predictions = fitted[best["model_type"]]
    preview = []
    for actual, prediction in list(zip(y_test.tolist(), best_predictions.tolist()))[:30]:
        row = {"actual": make_json_value(actual), "predicted": make_json_value(prediction)}
        if problem_type == "regression":
            row["absolute_error"] = make_json_value(abs(actual - prediction))
            row["percentage_error"] = make_json_value(abs(actual - prediction) / abs(actual) * 100) if actual else None
        else:
            row["correct"] = bool(actual == prediction)
        preview.append(row)

    return {
        "success": True,
        "problem_type": problem_type,
        "target": target,
        "features": features,
        "training_rows": len(X_train),
        "test_rows": len(X_test),
        "random_state": random_state,
        "models": results,
        "best_model": best["model_type"],
        "best_metrics": best,
        "prediction_preview": preview,
        "labels": labels,
    }


def regression_metrics(actual, predicted):
    mse = mean_squared_error(actual, predicted)
    return {"mae": make_json_value(mean_absolute_error(actual, predicted)), "mse": make_json_value(mse), "rmse": make_json_value(mse ** 0.5), "r2": make_json_value(r2_score(actual, predicted))}


def classification_metrics(actual, predicted, labels):
    return {"accuracy": make_json_value(accuracy_score(actual, predicted)), "precision": make_json_value(precision_score(actual, predicted, average="weighted", zero_division=0)), "recall": make_json_value(recall_score(actual, predicted, average="weighted", zero_division=0)), "f1": make_json_value(f1_score(actual, predicted, average="weighted", zero_division=0)), "confusion_matrix": confusion_matrix(actual, predicted, labels=labels).tolist()}


def main():
    if len(sys.argv) != 3:
        print(json.dumps({"error": "A CSV path and evaluation request are required."}))
        sys.exit(1)
    try:
        print(json.dumps(evaluate_dataset(sys.argv[1], json.loads(sys.argv[2]))))
    except Exception as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
