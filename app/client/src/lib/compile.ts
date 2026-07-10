import mjml2html from 'mjml-browser';
import type { MjmlError } from 'mjml-browser';
import { buildFullMjml } from '@shared/mjml-head';

export type CompileResult = {
  html: string;
  errors: MjmlError[];
};

/**
 * @description Compiles editor-emitted MJML into client-safe HTML entirely in-browser via
 * mjml-browser@4.18.0 -- the same version + compile options as the server's mjml@4.18.0 path
 * (app/server/src/services/compile.ts), fed the identical buildFullMjml transform (app/shared/
 * mjml-head.ts) so both engines only differ in the compiler itself (proven by
 * app/server/scripts/verify-parity.ts). MUST stay synchronous: mjml-browser is sync at
 * runtime, and the Task 3 "Preview & Compile" flow calls window.open() in the same user
 * gesture as this call -- awaiting a Promise here would move window.open() outside the
 * gesture and trigger popup blockers.
 */
export const compileNewsletter = (editorOutput: string): CompileResult => {
  const result = mjml2html(buildFullMjml(editorOutput), {
    validationLevel: 'soft',
    minify: false,
  });

  return { html: result.html, errors: result.errors };
};
