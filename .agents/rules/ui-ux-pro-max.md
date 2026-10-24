# UI UX Pro Max — Design System & Interaction Intelligence

## 1. Visual Hierarchy & Spacing (8pt Grid System)
- Strict mathematical rhythm: 4px, 8px, 12px, 16px, 24px, 32px, 48px.
- Compact HUD interface for desktop tool overlays: minimal padding, maximum data density and legibility.
- Visual anchors: Primary action buttons should be undeniably obvious; secondary actions should be subtle ghost/outline buttons.

## 2. Micro-Interactions & Physics
- Framer Motion transitions must feel snappy and natural:
  - Spring physics: `stiffness: 400`, `damping: 30` for hover/click micro-scales.
  - Duration: 150ms - 220ms for state toggles. Avoid sluggish animations (> 350ms).
- Active tap states: `whileTap={{ scale: 0.97 }}` for tactile tactile feedback.

## 3. Glassmorphism & Frosted Blur
- Real depth with `backdrop-blur-xl` + dark tinted backdrops `rgba(10, 10, 12, 0.82)`.
- Never use plain white borders with high opacity; use `rgba(255, 255, 255, 0.08)`.
- Subtle radial highlight that follows cursor or focused item rather than static blinding glare.

## 4. Typography Scale
- Primary font: Modern neo-grotesque (Inter or System UI).
- Title: 14px - 16px SemiBold / Bold with `-0.02em` tracking.
- Meta / Numbers: 11px - 12px Medium with `font-mono` or `tabular-nums`.
- Labels & Subtitles: 10px - 11px uppercase tracking-wider text with muted contrast (`text-zinc-400`).
