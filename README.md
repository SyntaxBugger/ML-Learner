# ML Experiment Lab

An interactive machine learning platform for learning ML concepts, preprocessing datasets, training models, and evaluating results through hands-on experimentation.

**Live Demo:** https://ml-learner-mauve.vercel.app

## Features

- **Interactive Learning:** Explore machine learning and statistical concepts through guided lessons.
- **Data Preprocessing:** Handle missing values, encode categorical variables, select features, scale data, and split datasets.
- **Model Training:** Train machine learning models on uploaded datasets.
- **Model Evaluation:** Analyze model performance using evaluation metrics.
- **Visualizations:** Visualize datasets, model results, and performance metrics.
- **Dataset Processing:** Upload and process CSV datasets through an interactive interface.

## Tech Stack

| Component | Technologies |
|---|---|
| Frontend | React, JavaScript |
| Backend | Node.js, Express.js |
| ML Processing | Python, Pandas, Scikit-learn |
| Data Handling | CSV, Multer |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js and npm
- Python 3.10+
- Git

### Installation

**1. Clone the repository**

```bash
git clone YOUR_GITHUB_REPO_URL
cd ML-Experiment-Lab
```

**2. Install backend dependencies**

```bash
cd backend
npm install
```

**3. Install Python dependencies**

```bash
pip install -r requirements.txt
```

**4. Configure environment variables**

Create a `.env` file in the backend directory:

```env
PORT=5000
PYTHON=YOUR_PYTHON_EXECUTABLE_PATH
```

Set `PYTHON` to the path of your Python executable if required by the backend.

**5. Start the backend**

```bash
npm run dev
```

**6. Start the frontend**

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The application should now be available at your local Vite development URL.

## Project Structure

```text
ML-Experiment-Lab/
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── routes/
│   ├── controllers/
│   ├── python/
│   ├── server.js
│   ├── requirements.txt
│   └── package.json
│
└── README.md
```

*Directory structure may vary depending on implementation.*

## Learning Modules

- Machine Learning Fundamentals
- Statistics
- Data Preprocessing
- Supervised Learning
- Model Training
- Model Evaluation
- Data Visualization

## Future Improvements

- K-Means Clustering
- Additional ML algorithms
- Advanced model evaluation
- More interactive visualizations
- Additional datasets and experiments

## License

This project is intended for educational purposes.
