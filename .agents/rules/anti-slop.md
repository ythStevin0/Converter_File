# Anti-Slop Design Rulebook (Temporary Working Rules)

## Core Mandates: Eliminate AI-Shaped UI, Copy, and Code
1. **No Fake / Inane Copy**:
   - Zero lines like "Unlock the power of next-gen AI", "Revolutionize your workflow", or "10,000% synergy".
   - Honest, functional microcopy only. State what the action actually does (e.g. "Convert to WebP", "Lossless Quality 85%", "Clean EXIF").

2. **No Generic "AI Slop" Aesthetics**:
   - Reject over-saturated purple-to-cyan rainbow gradients.
   - Reject arbitrary sparkle icons (`Sparkles`) placed on non-AI buttons just for decoration.
   - Reject fake terminal widgets reporting fictional `0.0001ms` latency or meaningless graphs.
   - Use high-conviction color palettes: Deep Obsidian (`#09090b`), Graphite (`#18181b`), Zinc (`#27272a`), with intentional functional accents (Emerald for success, Amber for warning, Indigo/Slate for neutral controls).

3. **Accessibility & Human Utility**:
   - High contrast text (minimum WCAG AA: 4.5:1 ratio for body, 3:1 for large text).
   - Clear interactive states: hover, active, focus-visible with distinct rings.
   - Tabular numerals (`font-variant-numeric: tabular-nums`) for real-time file sizes, percentages, and pixel coordinates.

4. **Depth & Texture**:
   - Subtle multi-layered shadows (`box-shadow: 0 1px 2px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.5)`).
   - Crisp 1px translucent borders (`border: 1px solid rgba(255,255,255,0.08)`).
   - Subtle inner highlights (`box-shadow: inset 0 1px 0 rgba(255,255,255,0.06)`).
