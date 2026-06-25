import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import compileRouter from './routes/compile.js';

dotenv.config();

const app = express();
const PORT = process.env['PORT'] ? Number(process.env['PORT']) : 3000;

// T-01-02: restrict CORS to the Vite dev origin only
app.use(cors({ origin: 'http://localhost:5173' }));

// T-01-01: reject request bodies larger than 1mb before parse
app.use(express.json({ limit: '1mb' }));

// Mount compile route
app.use('/api', compileRouter);

app.listen(PORT, () => {
  console.log(`DDROIDD Newsletter server running on http://localhost:${PORT}`);
});

export default app;
