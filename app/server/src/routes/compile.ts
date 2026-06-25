import { Router } from 'express';
import mjml2html from 'mjml';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve repo root: compile.ts lives at app/server/src/routes/compile.ts
// so repo root is 4 levels up from __dirname (app/server/src/routes)
const REPO_ROOT = path.resolve(__dirname, '../../../../');
const SPIKE_OUTPUT_PATH = path.join(REPO_ROOT, 'dist', 'spike-output.html');

const router = Router();

router.post('/compile', async (req, res) => {
  const { mjml: editorOutput } = req.body as { mjml: string };

  if (typeof editorOutput !== 'string') {
    res.status(400).json({ error: 'Request body must contain a "mjml" string field.' });
    return;
  }

  const trimmed = editorOutput.trim();

  // Conditional wrap: prevent double-nesting if editor.getHtml() already returns a full <mjml> doc.
  // Bare fragment (no <mjml> root) is wrapped to form a valid MJML document.
  const fullMjml = /<mjml/i.test(trimmed)
    ? trimmed
    : `<mjml>\n  <mj-body>\n    ${trimmed}\n  </mj-body>\n</mjml>`;

  const result = mjml2html(fullMjml, {
    validationLevel: 'soft',
    minify: false,
  });

  if (result.errors && result.errors.length > 0) {
    console.warn('MJML compile warnings:', result.errors);
  }

  // Write compiled HTML to dist/spike-output.html at repo root (server owns filesystem).
  // Plan 05 client-render gate consumes this file.
  try {
    await fs.mkdir(path.dirname(SPIKE_OUTPUT_PATH), { recursive: true });
    await fs.writeFile(SPIKE_OUTPUT_PATH, result.html, 'utf8');
    console.log(`spike-output.html written to: ${SPIKE_OUTPUT_PATH}`);
  } catch (err) {
    console.error('Failed to write spike-output.html:', err);
    // Non-fatal: still return the compiled HTML even if write fails
  }

  res.json({ html: result.html, errors: result.errors });
});

export default router;
