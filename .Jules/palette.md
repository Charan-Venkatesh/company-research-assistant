## 2026-08-03 - Missing htmlFor attributes on form labels
**Learning:** Found a common accessibility pattern in custom form components where `<label>` tags lacked `htmlFor` attributes to associate them with their respective `<input>` fields. Even when visually positioned together, screen readers require explicit programmatic association (`htmlFor` matching the input `id`) to announce inputs correctly.
**Action:** Always verify that every custom `<label>` includes an `htmlFor` property mapped to a unique `id` on the input element during component reviews.
