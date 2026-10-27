DESIGN AND QUALITY STANDARDS (follow strictly, applies to every screen of any app)

GOAL
The result must look like it was designed by an experienced human product designer, not generated. Restraint, consistency, and honesty about data beat decoration. When unsure, remove rather than add. If the app is a refactor of existing UI, change presentation and copy only. Do not change features, routes, or data logic unless asked.

1. COLOR
- One neutral ramp (5-7 grays: background, surface, border, muted text, text) plus ONE accent color.
- Accent is used only for primary actions, active states, links, and selected/completed states. Primary buttons and active nav use the dark neutral (or accent, but pick one and stay consistent).
- Red/amber/green only for real status (errors, warnings, success).
- No gradients, glows, glassmorphism, blur backdrops, or purple-to-blue anything.
- Don't ship a framework's default accent untouched (e.g. Tailwind emerald-500, indigo-500, blue-500). Tune the hue and saturation so it reads as a deliberate brand choice.
- Define all colors as CSS variables (design tokens) and use them everywhere. Support light and dark mode through the same variables with WCAG AA contrast. No inverted-color hacks.

2. TYPOGRAPHY
- One typeface (Inter, Geist, or DM Sans). An optional serif is allowed for headings only.
- Four sizes only: 12 (captions), 14 (body/UI), 16 (card or section titles), 24 (page titles and large numbers). Nothing below 12px. A single larger display size is allowed on marketing/landing pages only.
- Weights 400/500/600 only. Build hierarchy with size, weight, and primary vs muted color, not by bolding everything.
- Line-height 1.2 for headings, 1.5 for body.
- Tabular numerals (font-variant-numeric: tabular-nums) for all stats, tables, prices, and counts.

3. SPACING AND LAYOUT
- Spacing scale only: 4, 8, 12, 16, 24, 32, 48, 64. Never arbitrary values. Card padding is consistent (20 or 24px).
- Generous whitespace. Left-align text; center only short hero or auth text.
- Real grid with consistent max-widths and shared alignment edges.
- Clear hierarchy on every page: page title, one muted supporting line containing a real fact, then the primary surface, then secondary content. One dominant surface per page with secondary info beside or below it, not many equal boxes.
- Navigation: 16px icons, muted inactive items, active item shown with a subtle background and a 2px accent edge, not a heavy filled block.

4. SHAPE AND DEPTH
- Radius: two values only. 8px for inputs, buttons, and small elements; 12px for cards and panels. No pill inputs, no mixed radii.
- Shadow: none by default. Separate surfaces with 1px solid borders. One subtle shadow level is allowed only for floating layers (menus, popovers, modals). Never colored shadows or glows.
- Don't put everything in cards. Use cards only for distinct units; otherwise use dividers, whitespace, tables, and lists.

5. ICONS AND IMAGERY
- One icon set (Lucide), one stroke width, one size (16px in UI), muted color.
- NEVER use emoji anywhere in the UI (headings, buttons, labels, empty states, toasts).
- No multi-colored icon tiles (colored squares behind icons).
- No stock-illustration blobs, decorative SVG filler, sparkle icons, or abstract gradient shapes.
- Use real imagery or none. No placeholder photos that don't relate to the product.

6. NEVER USE
- Decorative badges and filler ("Live", "AI-powered", "Pro", "New", fake status chips) unless they reflect real state.
- Motivational quote cards, generic "insight" cards, hero banners with colored fills, or any block that doesn't show the user's real data or help them act.
- Generic three-column icon feature grids, "how it works in 3 steps" filler, and fake testimonials or logos.
- Uppercase tracked labels as a default. Allowed in at most one role (small section eyebrows). Form labels are sentence case.
- Breadcrumbs, labels, or tooltips that state the obvious.
- Stacks of identical bordered cards.
- Controls that do nothing: toggles, filters, tabs, or buttons not wired to real behavior.

7. COPY
- Plain, specific, short. Sentence case everywhere ("Add item", not "Add Item").
- State facts, not hype. Describe what the thing is or does, not how amazing it is.
- Banned words and phrases: seamless, unlock, powerful, elevate, supercharge, revolutionize, effortless, next-level, cutting-edge, game-changer, "all-in-one", "take X to the next level", "streamline your workflow", "built for the modern X".
- Proofread all hardcoded text. No typos, no inconsistent capitalization.
- Use realistic sample data. Never "John Doe", "Lorem ipsum", "Acme Inc", or suspiciously round numbers.
- Greetings, dates, and times must be real and time-aware, never hardcoded.
- Error and empty-state messages say what happened and what to do next, in one line.

8. DATA HONESTY
- No contradictory states. Never show a positive label ("Active", "Top performer", "Best", "On track") when the underlying data is zero or empty. Below a minimum data threshold, show "—" and a short muted explanation.
- Format numbers sensibly: no trailing decimals unless meaningful ("0 days", not "0.00 days"). Use locale-aware formatting for currency, dates, and large numbers.
- Dates, "today", relative times, and highlighted days must use the real current date and the user's timezone. Verify by testing with a different date.
- Charts show one meaningful series over a meaningful axis. Never put unrelated metrics (counts, totals, averages, different units) on the same axis. One or two colors, labeled axes, no clipped labels, tooltip on hover, and an empty state instead of an empty chart.
- Summary stats must match the detail data shown elsewhere on the page.
- Remove any control that doesn't change real data.

9. FORMS
- Sentence-case labels above inputs, 14px/500. 8px radius.
- Visible focus ring (2px accent outline, 2px offset), inline error messages under the field, show/hide toggle on password fields.
- Correct input types, autocomplete attributes, and keyboard behavior (Enter submits, Escape closes).
- Disable the submit button while submitting and show progress. Never double-submit.

10. STATES AND INTERACTION
- Design every state: empty (one muted line plus a clear next action), loading (skeletons, not spinners), error (message plus retry), disabled, success.
- Every interactive element has visible hover, active, focus-visible, and disabled styles.
- Transitions 150-200ms ease-out on color, background-color, opacity, and transform only. No bounce, confetti, pulsing, parallax, or decorative animation. Respect prefers-reduced-motion.
- Destructive actions require confirmation or offer undo.
- Minimum 44px touch targets.
- Fully responsive from 360px up, no horizontal scroll, no clipped or overlapping text. Wide tables scroll inside their own container.

11. ACCESSIBILITY
- Semantic HTML (button, nav, main, label, headings in order). Keyboard-navigable with logical tab order.
- Alt text on meaningful images, aria-labels on icon-only buttons.
- Never convey meaning by color alone.
