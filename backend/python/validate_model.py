import json
import sys

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

from train_model import build_model
from train_model import make_json_value
from train_model import SimpleImputer
from train_model import OneHotEncoder
from train_model import Pipeline
from train_model import ColumnTransformer


def build_preprocessing(dataframe, features):
    numeric_features = dataframe[features].select_dtypes(include="number").columns.tolist()
    categorical_features = [column for column in features if column not in numeric_features]
    transformers = []

    if numeric_features:
        transformers.append(("numbers", SimpleImputer(strategy="median"), numeric_features))
    if categorical_features:
        transformers.append((
            "categories",
            Pipeline([
                ("fill", SimpleImputer(strategy="most_frequent")),
                ("encode", OneHotEncoder(handle_unknown="ignore")),
            ]),
            categorical_features,
        ))

    return ColumnTransformer(transformers=transformers)


def validate_model(file_path, request):
    dataframe = pd.read_csv(file_path)
    target = request.get("target")
    features = request.get("features") or []
    problem_type = request.get("problem_type")
    model_type = request.get("model_type")
    training_percentage = int(request.get("training_percentage", 80))

    if not target or target not in dataframe.columns:
        raise ValueError("Please choose a target column.")
    if not features or any(feature not in dataframe.columns for feature in features):
        raise ValueError("Please choose at least one valid feature column.")
    if target in features:
        raise ValueError("The target cannot also be a feature.")
    if problem_type not in {"regression", "classification"}:
        raise ValueError("Please choose regression or classification.")
    if not 50 <= training_percentage <= 90:
        raise ValueError("The training percentage must be between 50 and 90.")

    working = dataframe[features + [target]].copy().dropna(subset=[target])
    if len(working) < 2:
        raise ValueError("The dataset needs at least two rows with a target value.")

    X = working[features]
    y = working[target]
    if problem_type == "classification" and y.nunique(dropna=True) < 2:
        raise ValueError("Classification needs at least two target categories.")

    stratify = y if problem_type == "classification" and y.value_counts().min() >= 2 else None
    test_size = 1 - (training_percentage / 100)
    X_train, X_validation, y_train, y_validation = train_test_split(
        X, y, test_size=test_size, random_state=42, stratify=stratify
    )

    # Fit preprocessing and the model on training rows only to keep validation unseen.
    pipeline = Pipeline([
        ("preprocess", build_preprocessing(working, features)),
        ("model", build_model(problem_type, model_type)),
    ])
    pipeline.fit(X_train, y_train)
    training_predictions = pipeline.predict(X_train)
    validation_predictions = pipeline.predict(X_validation)

    if problem_type == "regression":
        training_metrics = regression_metrics(y_train, training_predictions)
        validation_metrics = regression_metrics(y_validation, validation_predictions)
    else:
        labels = sorted({make_json_value(value) for value in y.tolist()})
        training_metrics = classification_metrics(y_train, training_predictions, labels)
        validation_metrics = classification_metrics(y_validation, validation_predictions, labels)

    prediction_preview = []
    for actual, prediction in list(zip(y_validation.tolist(), validation_predictions.tolist()))[:8]:
        actual_value = make_json_value(actual)
        prediction_value = make_json_value(prediction)
        row = {"actual": actual_value, "predicted": prediction_value}
        if problem_type == "regression":
            row["difference"] = make_json_value(abs(actual - prediction))
        else:
            row["correct"] = bool(actual == prediction)
        prediction_preview.append(row)

    return {
        "success": True,
        "problem_type": problem_type,
        "model_type": model_type,
        "target": target,
        "features": features,
        "training_rows": len(X_train),
        "validation_rows": len(X_validation),
        "training_metrics": training_metrics,
        "validation_metrics": validation_metrics,
        "prediction_preview": prediction_preview,
    }


def regression_metrics(actual, predicted):
    mse = mean_squared_error(actual, predicted)
    return {
        "mae": make_json_value(mean_absolute_error(actual, predicted)),
        "mse": make_json_value(mse),
        "rmse": make_json_value(mse ** 0.5),
        "r2": make_json_value(r2_score(actual, predicted)),
    }


def classification_metrics(actual, predicted, labels):
    return {
        "accuracy": make_json_value(accuracy_score(actual, predicted)),
        "precision": make_json_value(precision_score(actual, predicted, average="weighted", zero_division=0)),
        "recall": make_json_value(recall_score(actual, predicted, average="weighted", zero_division=0)),
        "f1": make_json_value(f1_score(actual, predicted, average="weighted", zero_division=0)),
        "confusion_matrix": confusion_matrix(actual, predicted, labels=labels).tolist(),
        "labels": labels,
    }


def main():
    if len(sys.argv) != 3:
        print(json.dumps({"error": "A CSV path and validation request are required."}))
        sys.exit(1)
    try:
        request = json.loads(sys.argv[2])
        print(json.dumps(validate_model(sys.argv[1], request)))
    except Exception as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
