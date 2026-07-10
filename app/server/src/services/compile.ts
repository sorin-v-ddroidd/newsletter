import mjml2html from 'mjml';
import type { MJMLParseError, MJMLParseResults } from 'mjml-core';
import { buildFullMjml, HEAD_MARKERS } from '../../../shared/mjml-head';

// Re-exported so existing callers (verify-compile.ts: `import { compileNewsletter,
// HEAD_MARKERS } from '../src/services/compile'`) keep resolving unchanged after the
// canonical head moved to app/shared/mjml-head.ts (EXPORT-04: exactly one source of truth).
export { HEAD_MARKERS };

export type CompileResult = {
  html: string;
  errors: MJMLParseError[];
};

/**
 * @description Compiles editor-emitted MJML into client-safe HTML. Delegates the
 * wrap/strip-head/inject-canonical-head transform to the shared, compiler-agnostic
 * buildFullMjml (app/shared/mjml-head.ts) so the server and the in-browser client
 * (app/client/src/lib/compile.ts) apply the identical transform before handing off to their
 * respective mjml engines -- per EXPORT-04, there is exactly one source of truth for the head.
 */
export const compileNewsletter = (editorOutput: string): CompileResult => {
  const fullMjml = buildFullMjml(editorOutput);

  // NOTE: @types/mjml-core declares mjml2html as returning Promise<MJMLParseResults>, but the
  // `mjml` package's actual runtime implementation (lib/index.js) is synchronous -- it
  // re-exports mjml-core's internal default directly, which returns MJMLParseResults, not a
  // Promise. This is a pre-existing type/runtime mismatch (confirmed: `tsc` fails without this
  // cast even though the prior route.ts code already relied on synchronous access). Cast to the
  // true runtime shape rather than awaiting a Promise that never resolves.
  const result = mjml2html(fullMjml, {
    validationLevel: 'soft',
    minify: false,
  }) as unknown as MJMLParseResults;

  return { html: result.html, errors: result.errors };
};
