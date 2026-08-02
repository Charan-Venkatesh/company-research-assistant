## 2026-08-02 - Form Accessibility in Research Assistant
**Learning:** Found that custom-styled forms in this app frequently missed basic accessibility attributes, such as `htmlFor` on `<label>` elements, `id` on `<input>` elements, and `aria-label`s on standalone inputs (like the main search bar).
**Action:** Always check that inputs have proper associative labels or `aria-label`s, especially in custom UI components where standard form structure might be overlooked in favor of styling.
