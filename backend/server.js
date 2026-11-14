require('dotenv').config();
console.log('PYTHON from .env:', process.env.PYTHON);
const express = require('express');
const { spawn, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const multer = require('multer');

const app = express();

app.use(express.json());

// --------------------------------------------------
// CORS setup: supports FRONTEND_URL env var and local development
// --------------------------------------------------
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
];

if (process.env.FRONTEND_URL) {
  const customOrigins = process.env.FRONTEND_URL.split(',').map((url) => url.trim().replace(/\/$/, ''));
  for (const origin of customOrigins) {
    if (origin && !allowedOrigins.includes(origin)) {
      allowedOrigins.push(origin);
    }
  }
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (such as mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, '');
      if (allowedOrigins.includes(cleanOrigin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  })
);

// --------------------------------------------------
// File upload setup
// --------------------------------------------------

const uploadDirectory = path.join(__dirname, 'uploads');

fs.mkdirSync(uploadDirectory, {
  recursive: true,
});

const upload = multer({
  dest: uploadDirectory,

  fileFilter: (req, file, callback) => {
    const isCsv =
      path.extname(file.originalname).toLowerCase() === '.csv';

    callback(
      isCsv
        ? null
        : new Error('Only CSV files are accepted.'),
      isCsv
    );
  },
});

// Stores the latest uploaded dataset for Step 02 and later steps.
// Defaults to car_sales_demo.csv so all ML features work immediately without manual upload.
const defaultDemoCsvPath = path.join(__dirname, 'car_sales_demo.csv');
let latestUploadedDatasetPath = fs.existsSync(defaultDemoCsvPath) ? defaultDemoCsvPath : null;
let latestUploadedDatasetName = fs.existsSync(defaultDemoCsvPath) ? 'car_sales_demo.csv' : null;

// --------------------------------------------------
// Python detection and configuration
// --------------------------------------------------

function detectPython() {
  // 1. Explicitly configured via environment variable
  if (process.env.PYTHON) {
    try {
      const result = spawnSync(process.env.PYTHON, ['--version'], {
        timeout: 5000,
        encoding: 'utf8',
      });
      const output = `${result.stdout || ''}${result.stderr || ''}`.trim();
      if (!result.error && output) {
        console.log(`Using configured Python from process.env.PYTHON (${process.env.PYTHON}): ${output}`);
        return process.env.PYTHON;
      }
      console.warn(`Configured PYTHON (${process.env.PYTHON}) returned no version output. Using anyway.`);
      return process.env.PYTHON;
    } catch (err) {
      console.warn(`Error verifying configured PYTHON (${process.env.PYTHON}): ${err.message}. Using anyway.`);
      return process.env.PYTHON;
    }
  }

  // 2. Fallback candidates when PYTHON is not provided
  const candidates = process.platform === 'win32'
    ? ['py', 'python', 'python3', 'python.exe']
    : ['python3', 'python'];

  for (const cmd of candidates) {
    try {
      const result = spawnSync(cmd, ['--version'], {
        timeout: 5000,
        encoding: 'utf8',
      });
      const output = `${result.stdout || ''}${result.stderr || ''}`.trim();
      if (!result.error && output) {
        console.log(`Detected Python (${cmd}): ${output}`);
        return cmd;
      }
    } catch (err) {
      // Check next candidate
    }
  }

  // 3. Default fallback if no executable responded
  const fallback = process.platform === 'win32' ? 'python' : 'python3';
  console.warn(`No Python executable verified via --version. Falling back to default '${fallback}'.`);
  return fallback;
}

const PYTHON_CMD = detectPython();
const pythonDir = path.join(__dirname, 'python');

function getSpawnOptions() {
  return {
    cwd: __dirname,
    env: {
      ...process.env,
      PYTHONPATH: process.env.PYTHONPATH
        ? `${pythonDir}${path.delimiter}${process.env.PYTHONPATH}`
        : pythonDir,
    },
  };
}

// --------------------------------------------------
// Health route
// --------------------------------------------------

app.get('/api/health', (req, res) => {
  res.json({
    message: 'ML Experiment Lab backend is running',
    pythonDetected: Boolean(PYTHON_CMD),
    pythonCommand: PYTHON_CMD,
  });
});

// --------------------------------------------------
// Python test route
// --------------------------------------------------

app.get('/api/python-test', (req, res) => {
  if (!PYTHON_CMD) {
    return res.status(500).json({
      success: false,
      message: 'Python was not detected.',
    });
  }

  const result = spawnSync(
    PYTHON_CMD,
    [
      '-c',
      'import sys; print(sys.executable); print("Python works")',
    ],
    {
      encoding: 'utf8',
      timeout: 10000,
    }
  );

  return res.json({
    success: !result.error && result.status === 0,
    command: PYTHON_CMD,
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    error: result.error?.message || null,
  });
});

// --------------------------------------------------
// Step 01: Analyze uploaded CSV
// --------------------------------------------------

app.post(
  '/api/dataset/analyze',
  upload.single('file'),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        error: 'Please upload one CSV file using the file field.',
      });
    }

    if (!PYTHON_CMD) {
      fs.unlink(req.file.path, () => {});

      return res.status(500).json({
        error: 'Python was not found on the server.',
      });
    }

    const scriptPath = path.join(
      __dirname,
      'python',
      'analyze_dataset.py'
    );

    const pythonProcess = spawn(
      PYTHON_CMD,
      [
        scriptPath,
        req.file.path,
      ],
      getSpawnOptions()
    );

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('error', (error) => {
      console.error('Could not start Python:', error);

      fs.unlink(req.file.path, () => {});

      if (!res.headersSent) {
        return res.status(500).json({
          error: 'Could not start the Python analysis process.',
          details: error.message,
        });
      }
    });

    pythonProcess.on('close', (code) => {
      if (res.headersSent) {
        return;
      }

      if (code !== 0) {
        console.error(
          'Python analysis error:',
          stderr
        );

        fs.unlink(req.file.path, () => {});

        return res.status(422).json({
          error: 'Python could not analyze this CSV file.',
          details: stderr.trim(),
        });
      }

      try {
        latestUploadedDatasetPath = req.file.path;
        latestUploadedDatasetName = req.file.originalname;

        return res.json({
          filename: req.file.originalname,
          ...JSON.parse(stdout),
        });
      } catch (error) {
        console.error(
          'Invalid Python JSON:',
          error,
          stdout
        );

        fs.unlink(req.file.path, () => {});

        return res.status(500).json({
          error: 'Python returned malformed JSON.',
        });
      }
    });
  }
);

// --------------------------------------------------
// Reset to default demo dataset
// --------------------------------------------------

app.post('/api/dataset/reset-default', (req, res) => {
  const defaultPath = path.join(__dirname, 'car_sales_demo.csv');
  if (fs.existsSync(defaultPath)) {
    latestUploadedDatasetPath = defaultPath;
    latestUploadedDatasetName = 'car_sales_demo.csv';
    return res.json({ success: true, filename: 'car_sales_demo.csv' });
  }
  return res.status(404).json({ error: 'Default demo dataset file not found.' });
});

// --------------------------------------------------
// Step 02: Explore uploaded CSV
// --------------------------------------------------

app.get('/api/dataset/explore', (req, res) => {
  if (!latestUploadedDatasetPath) {
    return res.status(404).json({
      error:
        'No dataset has been uploaded yet. Please complete Step 01 first.',
    });
  }

  if (!PYTHON_CMD) {
    return res.status(500).json({
      error: 'Python was not found on the server.',
    });
  }

  const scriptPath = path.join(
    __dirname,
    'python',
    'explore_dataset.py'
  );

  const pythonProcess = spawn(
    PYTHON_CMD,
    [
      scriptPath,
      latestUploadedDatasetPath,
    ],
    getSpawnOptions()
  );

  let stdout = '';
  let stderr = '';

  pythonProcess.stdout.on('data', (data) => {
    stdout += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    stderr += data.toString();
  });

  pythonProcess.on('error', (error) => {
    console.error(
      'Could not start exploration process:',
      error
    );

    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Could not explore the uploaded dataset.',
        details: error.message,
      });
    }
  });

  pythonProcess.on('close', (code) => {
    if (res.headersSent) {
      return;
    }

    if (code !== 0) {
      console.error(
        'Python exploration error:',
        stderr
      );

      return res.status(422).json({
        error: 'Python could not explore this CSV file.',
        details: stderr.trim(),
      });
    }

    try {
      return res.json(JSON.parse(stdout));
    } catch (error) {
      console.error(
        'Invalid explore JSON:',
        error,
        stdout
      );

      return res.status(500).json({
        error: 'Python returned malformed exploration data.',
      });
    }
  });
});

// --------------------------------------------------
// Step 03: Return only metadata needed for preprocessing
// --------------------------------------------------

app.get('/api/dataset/preprocess', (req, res) => {
  if (!latestUploadedDatasetPath) {
    return res.status(404).json({
      error: 'No dataset has been uploaded yet. Please complete Step 01 first.',
    });
  }

  if (!PYTHON_CMD) {
    return res.status(500).json({ error: 'Python was not found on the server.' });
  }

  const scriptPath = path.join(__dirname, 'python', 'analyze_dataset.py');
  const pythonProcess = spawn(PYTHON_CMD, [scriptPath, latestUploadedDatasetPath], getSpawnOptions());
  let stdout = '';
  let stderr = '';

  pythonProcess.stdout.on('data', (data) => { stdout += data.toString(); });
  pythonProcess.stderr.on('data', (data) => { stderr += data.toString(); });
  pythonProcess.on('error', (error) => {
    console.error('Could not start preprocess analysis:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Could not read the uploaded dataset.', details: error.message });
    }
  });
  pythonProcess.on('close', (code) => {
    if (res.headersSent) return;

    if (code !== 0) {
      console.error('Preprocess analysis error:', stderr);
      return res.status(422).json({ error: 'Python could not read this CSV file.', details: stderr.trim() });
    }

    try {
      const analysis = JSON.parse(stdout);
      const numericalColumns = Object.entries(analysis.dtypes || {})
        .filter(([, dtype]) => /int|float|number|bool/i.test(dtype))
        .map(([column]) => column);
      const categoricalColumns = (analysis.column_names || [])
        .filter((column) => !numericalColumns.includes(column));

      return res.json({
        columns: analysis.column_names || [],
        numerical_columns: numericalColumns,
        categorical_columns: categoricalColumns,
        missing_values: analysis.missing_values || {},
        rows: analysis.rows || 0,
        filename: latestUploadedDatasetName,
      });
    } catch (error) {
      console.error('Malformed preprocess metadata:', error, stdout);
      return res.status(500).json({ error: 'Python returned malformed dataset metadata.' });
    }
  });
});

// --------------------------------------------------
// Step 04: Train a selected model from the uploaded CSV
// --------------------------------------------------

app.post('/api/model/train', (req, res) => {
  if (!latestUploadedDatasetPath) {
    return res.status(404).json({ error: 'No dataset has been uploaded yet. Please complete Step 01 first.' });
  }

  if (!PYTHON_CMD) {
    return res.status(500).json({ error: 'Python was not found on the server.' });
  }

  const scriptPath = path.join(__dirname, 'python', 'train_model.py');
  const pythonProcess = spawn(
    PYTHON_CMD,
    [scriptPath, latestUploadedDatasetPath, JSON.stringify(req.body || {})],
    getSpawnOptions()
  );
  let stdout = '';
  let stderr = '';

  pythonProcess.stdout.on('data', (data) => { stdout += data.toString(); });
  pythonProcess.stderr.on('data', (data) => { stderr += data.toString(); });
  pythonProcess.on('error', (error) => {
    console.error('Could not start model training:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Could not start model training.', details: error.message });
    }
  });
  pythonProcess.on('close', (code) => {
    if (res.headersSent) return;

    if (code !== 0) {
      console.error('Model training error:', stderr);
      return res.status(422).json({ error: stderr.trim() || 'The model could not be trained.' });
    }
    try {
      return res.json(JSON.parse(stdout));
    } catch (error) {
      console.error('Malformed train output:', error, stdout);
      return res.status(500).json({ error: 'Python returned malformed training data.' });
    }
  });
});

// --------------------------------------------------
// Step 05: Train only on the training rows, then check unseen validation rows
// --------------------------------------------------

app.post('/api/model/validate', (req, res) => {
  if (!latestUploadedDatasetPath) {
    return res.status(404).json({ error: 'No dataset has been uploaded yet. Please complete Step 01 first.' });
  }

  if (!PYTHON_CMD) {
    return res.status(500).json({ error: 'Python was not found on the server.' });
  }

  const scriptPath = path.join(__dirname, 'python', 'validate_model.py');
  const pythonProcess = spawn(
    PYTHON_CMD,
    [scriptPath, latestUploadedDatasetPath, JSON.stringify(req.body || {})],
    getSpawnOptions()
  );
  let stdout = '';
  let stderr = '';

  pythonProcess.stdout.on('data', (data) => { stdout += data.toString(); });
  pythonProcess.stderr.on('data', (data) => { stderr += data.toString(); });
  pythonProcess.on('error', (error) => {
    console.error('Could not start validation:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Could not start validation.', details: error.message });
    }
  });
  pythonProcess.on('close', (code) => {
    if (res.headersSent) return;

    if (code !== 0) {
      console.error('Validation error:', stderr);
      return res.status(422).json({ error: stderr.trim() || 'The model could not be validated.' });
    }
    try {
      return res.json(JSON.parse(stdout));
    } catch (error) {
      console.error('Malformed validation output:', error, stdout);
      return res.status(500).json({ error: 'Python returned malformed validation data.' });
    }
  });
});

// --------------------------------------------------
// Step 06: Compare candidate models on the same unseen test data
// --------------------------------------------------

app.post('/api/model/evaluate', (req, res) => {
  if (!latestUploadedDatasetPath) {
    return res.status(404).json({ error: 'No dataset has been uploaded yet. Please complete Step 01 first.' });
  }

  if (!PYTHON_CMD) {
    return res.status(500).json({ error: 'Python was not found on the server.' });
  }

  const scriptPath = path.join(__dirname, 'python', 'evaluate_model.py');
  const pythonProcess = spawn(
    PYTHON_CMD,
    [scriptPath, latestUploadedDatasetPath, JSON.stringify(req.body || {})],
    getSpawnOptions()
  );
  let stdout = '';
  let stderr = '';

  pythonProcess.stdout.on('data', (data) => { stdout += data.toString(); });
  pythonProcess.stderr.on('data', (data) => { stderr += data.toString(); });
  pythonProcess.on('error', (error) => {
    console.error('Could not start evaluation:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Could not start evaluation.', details: error.message });
    }
  });
  pythonProcess.on('close', (code) => {
    if (res.headersSent) return;

    if (code !== 0) {
      console.error('Evaluation error:', stderr);
      return res.status(422).json({ error: stderr.trim() || 'The models could not be evaluated.' });
    }
    try {
      return res.json(JSON.parse(stdout));
    } catch (error) {
      console.error('Malformed evaluation output:', error, stdout);
      return res.status(500).json({ error: 'Python returned malformed evaluation data.' });
    }
  });
});

// --------------------------------------------------
// Demo URL checking route
// --------------------------------------------------

app.post('/api/check', (req, res) => {
  const { url } = req.body || {};

  if (!url) {
    return res.status(400).json({
      error: 'missing url',
    });
  }

  const scriptPath = path.join(
    __dirname,
    'ml_model.py'
  );

  if (!PYTHON_CMD || !fs.existsSync(scriptPath)) {
    const safe = Math.random() > 0.35;

    return res.json({
      verdict: safe ? 'safe' : 'phishing',
      score: safe ? 0.94 : 0.13,
      explanation: safe
        ? 'Demo fallback: no issues detected'
        : 'Demo fallback: suspicious patterns found',
      url,
    });
  }

  const pythonProcess = spawn(
    PYTHON_CMD,
    [
      scriptPath,
      url,
    ],
    getSpawnOptions()
  );

  let stdout = '';
  let stderr = '';

  const timeout = setTimeout(() => {
    pythonProcess.kill();
  }, 7000);

  pythonProcess.stdout.on('data', (data) => {
    stdout += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    stderr += data.toString();
  });

  pythonProcess.on('error', (error) => {
    clearTimeout(timeout);

    console.error(
      'Could not start URL checker:',
      error
    );

    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Could not start the Python URL checker.',
        details: error.message,
      });
    }
  });

  pythonProcess.on('close', (code) => {
    clearTimeout(timeout);

    if (res.headersSent) {
      return;
    }

    if (code !== 0 || !stdout.trim()) {
      console.error(
        'Python URL checker error:',
        code,
        stderr
      );

      const safe = Math.random() > 0.35;

      return res.json({
        verdict: safe ? 'safe' : 'phishing',
        score: safe ? 0.94 : 0.13,
        explanation: safe
          ? 'Demo fallback: no issues detected'
          : 'Demo fallback: suspicious patterns found',
        url,
      });
    }

    try {
      const payload = JSON.parse(stdout);

      return res.json(payload);
    } catch (error) {
      console.error(
        'Invalid Python output:',
        error,
        stdout
      );

      return res.status(500).json({
        error: 'Invalid Python output.',
      });
    }
  });
});

// --------------------------------------------------
// Error handler
// --------------------------------------------------

app.use((error, req, res, next) => {
  if (
    error instanceof multer.MulterError ||
    error.message === 'Only CSV files are accepted.'
  ) {
    return res.status(400).json({
      error: error.message,
    });
  }

  console.error(
    'Unexpected server error:',
    error
  );

  return res.status(500).json({
    error: 'An unexpected server error occurred.',
  });
});

// --------------------------------------------------
// Basic route
// --------------------------------------------------

app.get('/', (req, res) => {
  res.send('Hello World');
});

// --------------------------------------------------
// Start server
// --------------------------------------------------

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);

  if (PYTHON_CMD) {
    console.log(
      `Python features enabled using: ${PYTHON_CMD}`
    );
  } else {
    console.log(
      'Python features disabled. Using fallback responses.'
    );
  }
});

module.exports = { app, server };
