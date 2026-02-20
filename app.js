import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { newRequest, validateRequest } from './shared/request.js';

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
  console.log(request);

  res.send({ 'status': 'OK' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});