import json
import sys

import pandas as pd


def detect_column_types(dataframe):
    numerical_columns = dataframe.select_dtypes(include=['number']).columns.tolist()
    categorical_columns = dataframe.select_dtypes(exclude=['number']).columns.tolist()
    return numerical_columns, categorical_columns


def summarize_numerical(dataframe, numerical_columns):
    summary = {}
    for column in numerical_columns:
        series = dataframe[column]
        summary[column] = {
            'count': int(series.count()),
            'mean': float(series.mean()) if series.count() else None,
            'median': float(series.median()) if series.count() else None,
            'std': float(series.std()) if series.count() > 1 else None,
            'min': float(series.min()) if series.count() else None,
            'max': float(series.max()) if series.count() else None,
        }
    return summary


def summarize_categorical(dataframe, categorical_columns):
    summary = {}
    for column in categorical_columns:
        series = dataframe[column].dropna()
        value_counts = series.value_counts(dropna=False)
        if value_counts.empty:
            summary[column] = {
                'unique_count': 0,
                'most_common': None,
                'most_common_frequency': 0,
                'value_counts': {},
            }
            continue

        top_value = value_counts.idxmax()
        top_frequency = int(value_counts.max())

        summary[column] = {
            'unique_count': int(series.nunique(dropna=False)),
            'most_common': str(top_value),
            'most_common_frequency': top_frequency,
            'value_counts': {str(key): int(value) for key, value in value_counts.items()},
        }
    return summary


def calculate_correlations(dataframe, numerical_columns):
    if not numerical_columns:
        return {}

    correlation_frame = dataframe[numerical_columns].corr(numeric_only=True)
    return correlation_frame.to_dict()


def calculate_outliers(dataframe, numerical_columns):
    outliers = {}
    for column in numerical_columns:
        series = dataframe[column].dropna()
        if series.empty:
            outliers[column] = {
                'q1': None,
                'q3': None,
                'iqr': None,
                'lower_bound': None,
                'upper_bound': None,
                'potential_outlier_count': 0,
            }
            continue

        q1 = float(series.quantile(0.25))
        q3 = float(series.quantile(0.75))
        iqr = q3 - q1
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr

        outside_bounds = series[(series < lower_bound) | (series > upper_bound)]
        outliers[column] = {
            'q1': q1,
            'q3': q3,
            'iqr': float(iqr),
            'lower_bound': float(lower_bound),
            'upper_bound': float(upper_bound),
            'potential_outlier_count': int(outside_bounds.shape[0]),
        }
    return outliers


def explore_dataset(file_path):
    dataframe = pd.read_csv(file_path)
    numerical_columns, categorical_columns = detect_column_types(dataframe)

    preview = dataframe.head(10).to_dict(orient='records')

    return {
        'preview': preview,
        'numerical_summary': summarize_numerical(dataframe, numerical_columns),
        'categorical_summary': summarize_categorical(dataframe, categorical_columns),
        'correlations': calculate_correlations(dataframe, numerical_columns),
        'outliers': calculate_outliers(dataframe, numerical_columns),
        'numerical_columns': numerical_columns,
        'categorical_columns': categorical_columns,
    }


def main():
    if len(sys.argv) != 2:
        print(json.dumps({'error': 'A CSV file path is required.'}))
        sys.exit(1)

    try:
        result = explore_dataset(sys.argv[1])
        print(json.dumps(result))
    except Exception as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
