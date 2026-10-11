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

app.use(
  cors({
    origin: 'http://localhost:5173',
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
// Python detection
// --------------------------------------------------

// On Windows, "py" works even when "python" is not in PATH.
function detectPython() {
  const candidates = [];

  // Optional custom Python path from an environment variable.
  if (process.env.PYTHON) {
    candidates.push(process.env.PYTHON);
  }

  if (process.platform === 'win32') {
    candidates.push(
      'py',
      'python',
      'python3',
      'python.exe'
    );
  } else {
    candidates.push(
      'python3',
      'python'
    );
  }

  for (const cmd of candidates) {
    try {
      const result = spawnSync(
        cmd,
        ['--version'],
        {
          timeout: 5000,
          encoding: 'utf8',

          // Allows Windows commands such as "py" to work.
          
        }
      );

      // Python may print its version to stdout OR stderr.
      const output = `${result.stdout || ''}${result.stderr || ''}`
        .trim();

      if (!result.error && output) {
        console.log('Detected Python:', cmd, output);
        return cmd;
      }

      console.log(`Could not use Python command: ${cmd}`);
    } catch (error) {
      console.log(
        `Error checking ${cmd}:`,
        error.message
      );
    }
  }

  console.warn(
    'No Python executable detected. Python features are unavailable.'
  );

  return null;
}

const PYTHON_CMD = detectPython();

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
      {
        cwd: __dirname,
      }
    );

    let stdout = '';
    let stderr = '';
    let responseSent = false;

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('error', (error) => {
      console.error('Could not start Python:', error);

      fs.unlink(req.file.path, () => {});

      responseSent = true;

      return res.status(500).json({
        error: 'Could not start the Python analysis process.',
        details: error.message,
      });
    });

    pythonProcess.on('close', (code) => {
      if (responseSent) {
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
    {
      cwd: __dirname,
    
    }
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

    return res.status(500).json({
      error: 'Could not explore the uploaded dataset.',
      details: error.message,
    });
  });

  pythonProcess.on('close', (code) => {
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
  const pythonProcess = spawn(PYTHON_CMD, [scriptPath, latestUploadedDatasetPath], { cwd: __dirname });
  let stdout = '';
  let stderr = '';

  pythonProcess.stdout.on('data', (data) => { stdout += data.toString(); });
  pythonProcess.stderr.on('data', (data) => { stderr += data.toString(); });
  pythonProcess.on('error', (error) => res.status(500).json({ error: 'Could not read the uploaded dataset.', details: error.message }));
  pythonProcess.on('close', (code) => {
    if (code !== 0) {
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
  const pythonProcess = spawn(PYTHON_CMD, [scriptPath, latestUploadedDatasetPath, JSON.stringify(req.body || {})], { cwd: __dirname });
  let stdout = '';
  let stderr = '';

  pythonProcess.stdout.on('data', (data) => { stdout += data.toString(); });
  pythonProcess.stderr.on('data', (data) => { stderr += data.toString(); });
  pythonProcess.on('error', (error) => res.status(500).json({ error: 'Could not start model training.', details: error.message }));
  pythonProcess.on('close', (code) => {
    if (code !== 0) {
      return res.status(422).json({ error: stderr.trim() || 'The model could not be trained.' });
    }
    try {
      return res.json(JSON.parse(stdout));
    } catch (error) {
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
  const pythonProcess = spawn(PYTHON_CMD, [scriptPath, latestUploadedDatasetPath, JSON.stringify(req.body || {})], { cwd: __dirname });
  let stdout = '';
  let stderr = '';

  pythonProcess.stdout.on('data', (data) => { stdout += data.toString(); });
  pythonProcess.stderr.on('data', (data) => { stderr += data.toString(); });
  pythonProcess.on('error', (error) => res.status(500).json({ error: 'Could not start validation.', details: error.message }));
  pythonProcess.on('close', (code) => {
    if (code !== 0) {
      return res.status(422).json({ error: stderr.trim() || 'The model could not be validated.' });
    }
    try {
      return res.json(JSON.parse(stdout));
    } catch (error) {
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
  const pythonProcess = spawn(PYTHON_CMD, [scriptPath, latestUploadedDatasetPath, JSON.stringify(req.body || {})], { cwd: __dirname });
  let stdout = '';
  let stderr = '';

  pythonProcess.stdout.on('data', (data) => { stdout += data.toString(); });
  pythonProcess.stderr.on('data', (data) => { stderr += data.toString(); });
  pythonProcess.on('error', (error) => res.status(500).json({ error: 'Could not start evaluation.', details: error.message }));
  pythonProcess.on('close', (code) => {
    if (code !== 0) return res.status(422).json({ error: stderr.trim() || 'The models could not be evaluated.' });
    try {
      return res.json(JSON.parse(stdout));
    } catch (error) {
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

  if (!PYTHON_CMD) {
    const safe = Math.random() > 0.35;

    return res.json({
      verdict: safe ? 'safe' : 'phishing',
      score: safe ? 0.94 : 0.13,
      explanation: safe
        ? 'Demo fallback: no Python available'
        : 'Demo fallback: suspicious URL',
      url,
    });
  }

  const scriptPath = path.join(
    __dirname,
    'ml_model.py'
  );

  const pythonProcess = spawn(
    PYTHON_CMD,
    [
      scriptPath,
      url,
    ],
    {
      cwd: __dirname,
 
    }
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

    return res.status(500).json({
      error: 'Could not start the Python URL checker.',
      details: error.message,
    });
  });

  pythonProcess.on('close', (code) => {
    clearTimeout(timeout);

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

app.listen(5000, () => {
  console.log('Server is running on port 5000');

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