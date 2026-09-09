import json
import sys

import pandas as pd


def analyze_dataset(file_path):
    """Read a CSV into a DataFrame and return basic educational information."""
    # A DataFrame is pandas' table-like structure: rows and named columns.
    dataframe = pd.read_csv(file_path)

    return {
        "rows": int(dataframe.shape[0]),
        "columns": int(dataframe.shape[1]),
        "column_names": dataframe.columns.tolist(),
        "dtypes": {column: str(dtype) for column, dtype in dataframe.dtypes.items()},
        "missing_values": {column: int(value) for column, value in dataframe.isna().sum().items()},
        "unique_values": {column: int(value) for column, value in dataframe.nunique(dropna=False).items()},
    }


def main():
    if len(sys.argv) != 2:
        print(json.dumps({"error": "A CSV file path is required."}))
        sys.exit(1)

    try:
        # stdout is the normal output stream that Node reads from this process.
        print(json.dumps(analyze_dataset(sys.argv[1])))
    except Exception as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()