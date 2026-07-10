// Ambient module declaration for `mjml-browser` -- it ships no published @types. This is the
// documented reason for avoiding `any`: without this declaration every import site would need
// an `any`-typed import or a `@ts-ignore`, so a single narrow, accurate ambient type here keeps
// the rest of the codebase fully typed (see .claude/rules/typescript.md).
declare module 'mjml-browser' {
  export type MjmlError = {
    line: number;
    message: string;
    tagName: string;
    formattedMessage: string;
  };

  export type MjmlBrowserOptions = {
    validationLevel?: 'strict' | 'soft' | 'skip';
    minify?: boolean;
  };

  export type MjmlBrowserResult = {
    html: string;
    errors: MjmlError[];
  };

  // Synchronous at runtime (same as the server `mjml` package) despite there being no async
  // signature to contradict here -- see app/client/src/lib/compile.ts for the load-bearing
  // sync contract.
  const mjml2html: (mjmlSource: string, options?: MjmlBrowserOptions) => MjmlBrowserResult;

  export default mjml2html;
}
