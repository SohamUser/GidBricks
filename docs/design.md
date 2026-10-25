# Interface direction

The audience is a UK energy trader reviewing a fixed historical month. The primary job is to inspect the next delivery day's wind profile at the original purchase cutoff, then examine measured errors. The chart and its temporal context lead the page; promotional copy and decorative navigation have no role.

## Tokens

- Deep navy `#142F43`: wordmark, headings, structural emphasis.
- Ocean teal `#007D85`: selected controls and forecast series.
- Burnt amber `#AD652D`: retrospective actuals and error series, never forecast status.
- Cool canvas `#F3F6F8`: application background.
- White `#FFFFFF`: chart and input surfaces.
- Slate `#536575`: supporting text; borders are a lighter derived neutral.

Use Source Sans 3 for interface text and tabular numerals for comparable quantities. Sentence-case labels, consistent spacing, and dark-on-light contrast keep the desk readable. No icon is used as the logo; the name is a typographic wordmark. Icons are reserved for export and previous/next-day actions.

## Layout

```text
Wind Desk                         Great Britain / January replay
Decision overview | Forecast accuracy | Data & methodology

Day-ahead wind outlook                           Export CSV
Decision date + previous/next   Cutoff   Delivery date
Energy                  Peak             Minimum           Coverage

Hourly wind profile                           Actuals switch
[full-width plot, restrained grid, MW units, time labels]
Source and cutoff note

Publication provenance             Interpretation / accuracy action
Expandable hourly source values
```

The old sidebar consumed chart space and repeated the navigation context. Horizontal tabs free that space. A single ruled metric strip replaces four disconnected cards; only real content groups receive surfaces. No gradient banners, motivational tagline, decorative numbered steps, or unnecessary navigation icons.

## Component source and skills

Controls come from the official shadcn/ui registry, checked into `frontend/components/ui/`. Tailwind v4 and semantic CSS variables apply the palette consistently. Custom page CSS handles layout and chart presentation; component behavior remains in the upstream primitives.

Reviewed guidance: [Anthropic frontend-design](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md), [official shadcn skill](https://github.com/shadcn-ui/ui/blob/main/skills/shadcn/SKILL.md), and [Vite installation](https://ui.shadcn.com/docs/installation/vite). Changes preserve the Elexon-only analytical scope, cutoff rules, and explicit retrospective labeling.
