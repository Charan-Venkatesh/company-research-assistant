🧪 Add Unit Tests for Discord Report Sender

🎯 **What:** The `sendReportToDiscord` function in `lib/discord.ts` was entirely untested. This function handles integrating with a third-party API via `FormData` and multipart requests.

📊 **Coverage:** The test suite covers:
- Early exit paths when configuration is missing `botToken` or `channelId`.
- Success path ensuring `global.fetch` is correctly called, URL matches expectations, request headers feature authorization tokens, and the multipart `FormData` is properly appended with the correct metadata and PDF binary Blob.
- Missing fallback properties are appropriately resolved (using 'Unknown' string fallbacks).
- Failure paths when the third party API explicitly returns 4xx/5xx status codes, extracting the response payload when available.
- Exceptional failure paths natively bubbling through network errors.

✨ **Result:** Test coverage for `lib/discord.ts` is now at 100% (Statements/Branches/Lines/Functions).
