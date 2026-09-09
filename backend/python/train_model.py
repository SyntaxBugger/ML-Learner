import json
import sys

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.model_selection import train_test_split


def build_model(problem_type, model_type):
    models = {
        "regression": {
            "linear_regression": LinearRegression(),
            "decision_tree_regressor": DecisionTreeRegressor(random_state=42),
            "random_forest_regressor": RandomForestRegressor(n_estimators=100, random_state=42),
        },
        "classification": {
            "logistic_regression": LogisticRegression(max_iter=1000),
            "decision_tree_classifier": DecisionTreeClassifier(random_state=42),
            "random_forest_classifier": RandomForestClassifier(n_estimators=100, random_state=42),
        },
    }
    try:
        return models[problem_type][model_type]
    except KeyError as error:
        raise ValueError("The selected problem type and model do not match.") from error


def train_model(file_path, request):
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

    working = dataframe[features + [target]].copy()
    working = working.dropna(subset=[target])
    if len(working) < 2:
        raise ValueError("The dataset needs at least two rows with a target value.")

    X = working[features]
    y = working[target]
    if problem_type == "classification" and y.nunique(dropna=True) < 2:
        raise ValueError("Classification needs at least two target categories.")

    numeric_features = X.select_dtypes(include="number").columns.tolist()
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

    preprocessing = ColumnTransformer(transformers=transformers)
    model = build_model(problem_type, model_type)
    pipeline = Pipeline([("preprocess", preprocessing), ("model", model)])
    stratify = y if problem_type == "classification" and y.value_counts().min() >= 2 else None
    test_size = 1 - (training_percentage / 100)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=42, stratify=stratify
    )
    pipeline.fit(X_train, y_train)
    predictions = pipeline.predict(X_test)

    preview = []
    for actual, prediction in list(zip(y_test.tolist(), predictions.tolist()))[:5]:
        preview.append({"actual": make_json_value(actual), "prediction": make_json_value(prediction)})

    return {
        "success": True,
        "model_type": model_type,
        "problem_type": problem_type,
        "target": target,
        "features": features,
        "training_rows": len(X_train),
        "testing_rows": len(X_test),
        "training_status": "completed",
        "prediction_preview": preview,
    }


def make_json_value(value):
    if hasattr(value, "item"):
        return value.item()
    return value


def main():
    if len(sys.argv) != 3:
        print(json.dumps({"error": "A CSV path and training request are required."}))
        sys.exit(1)
    try:
        request = json.loads(sys.argv[2])
        print(json.dumps(train_model(sys.argv[1], request)))
    except Exception as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
