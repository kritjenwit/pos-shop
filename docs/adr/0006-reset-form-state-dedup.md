# ADR-0006: Reset Form State Extraction

Both `CustomerCheckoutView` and `CustomerCheckoutPage` had near-identical `handleReset` functions (6–9 lines each) clearing the same 5 state pieces after order completion. Extracted into `resetFormState()` in `src/shared/lib/util.ts` — a pure function that takes `setState` dispatchers as a single object. Each component calls it and then resets its own component-specific fields (PromptPay target, receipt file) inline. Keeps the extracted logic minimal: no hook, no component wrapper, just a function that zeroes state.
