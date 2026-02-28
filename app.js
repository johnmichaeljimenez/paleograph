import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateRequest } from './shared/request.js';
import { processFiles } from './paleograph.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

let running = false;

app.use(express.static(path.join(__dirname, 'public')));
app.use('/shared', express.static('shared'));
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/process', async (req, res) => {
  if (running)
    return res.status(429).send({ "Error": "Request already running. Please wait." });

  running = true;
  try {
    const request = validateRequest(req.body);
    console.log(request);

    const report = await processFiles(request);
    return res.json(report);

  } catch (error) {
    console.error(error);
    return res.status(500).send({ "Error": error.message });
  } finally {
    running = false;
  }
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});