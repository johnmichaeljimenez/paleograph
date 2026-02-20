import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { newRequest, validateRequest } from './shared/request.js';
import { processFiles } from './paleograph.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use('/shared', express.static('shared'));
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/process', async (req, res) => {
  const request = validateRequest(req.body);
  const reportContent = await processFiles(request);
  
  res.setHeader('Content-Disposition', `attachment; filename=${request.outputPath}.md`);
  res.setHeader('Content-Type', 'text/markdown');

  res.send(reportContent);
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});