# Plan: plan-music-studio-v2 Learnings

## Session Summary
All 22 tasks of plan-music-studio-v2 were completed in this session.

## Key Patterns Discovered
- CSS variable migration: Replace hex colors with `var(--xxx)` from globals.css. The module `.module.css` files need `var(--)` prefix, NOT the CSS variable names from globals.css.
- `page.tsx` uses inline hardcoded text for some components (HardwarePanel) - refactor to use i18n translation keys passed as props.
- ESLint `no-explicit-any`: When extending interfaces with optional fields (isDuplicate, is32Bit), declare them in the interface rather than using `as any`.
- Recharts Tooltip `formatter` type: Use `formatter={(value) => [Number(value), ...]}` instead of typed `(value: number) => ...`.
- Recharts PieChart label type: `label={({ name, percent }: { name?: string; percent?: number }) => ...}`.
- `@react-pdf/renderer` runs in the renderer process (browser) - blob → base64 → write via IPC is the correct flow for PDF export.
- Electron `dialog.showSaveDialog` in main process + `fs.writeFileSync` = correct export pattern.
- ThemeContext: Need `ThemeInit` component that runs `useEffect` to set `data-theme` on `<html>` BEFORE React hydrates (prevents flash of wrong theme).

## Issues Encountered
- Subagent timeouts: `call_omo_agent` subagents consistently timed out on complex tasks. Worked around by implementing directly.
- Circular dependency risk: `software-detector.ts` imports from `../../shared/types` - kept Architecture type local to avoid issues.
- `pluginsWithFormats` type extension: Added `isDuplicate?: boolean` and `is32Bit?: boolean` optional fields to `PluginWithFormats` interface to avoid `as any` casts.
- Recharts bundle size: Frontend First Load JS went from ~92KB to ~678KB due to recharts + react-pdf. This is expected for chart libraries.

## Decisions Made
- Used donut (PieChart) for vendor chart instead of BarChart - cleaner in mobile view.
- VST3/VST/AU/AAX filter chips with toggle behavior (click to include/exclude).
- Search input + format filters live in the same control row above the plugin list.
- HardwarePanel receives full `translations[lang]` object to avoid prop drilling.
- Duplicate detection uses `bundleIdentifier` grouping post-scan.
- Orphaned detection: plugin vendor has no corresponding DAW in results.

## Build Verification
- `npm run build:all`: ✅ Exit 0
- `npm run build`: ✅ Exit 0
- `npm test`: ✅ 62/62 passed
- `npm run lint`: ✅ 0 errors, 0 warnings
