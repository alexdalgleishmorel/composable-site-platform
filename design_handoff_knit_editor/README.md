# Handoff: Knit Editor — Liquid-Glass Redesign

## Overview
Knit is a **shared content editor** for a website-building platform: one editor app serves
every client. A non-technical client signs in and edits their site's CONTENT (organized as
"blocks") while a framed preview of their published website sits beside them. This handoff
redesigns the editor's **look & feel** ("liquid glass" / glassmorphism) and tightens several
interactions, **without** changing the underlying form-based editing model.

The editor is a **platform-level tool with its own identity** — it must NOT inherit any
client's branding. (The example client in the prototype, "jmdm," has its own lemon-yellow /
Arial / catalogue style that lives only inside the preview iframe and must never bleed into
the editor chrome.)

## About the Design Files
The files in this bundle are **design references built in HTML/React-UMD** — a working
prototype that demonstrates the intended look and behavior. They are **not** meant to be
shipped as-is. Your task is to **recreate this design in our real codebase** using our
existing environment (React app, our build tooling, our state-management and component
conventions). Reuse our data model, routing, and API calls; replace only the presentation
and the specific interactions described here.

If a detail isn't covered in this README, open the prototype file named in each section and
read it — it is the source of truth.

Interactive version of the full design:
https://api.anthropic.com/v1/design/h/i8dNrOGcL0e6wg-y1dggZg?open_file=Knit+Editor.html

## Fidelity
**High-fidelity.** Colors, typography, spacing, radii, shadows, and interactions are final.
Recreate the UI faithfully using our component library, but match these visual values.

---

## Architecture of the prototype (map these onto our components)
| Prototype file | Contains | Our equivalent |
|---|---|---|
| `tokens.css` | Design tokens: themes, density, colors, shadows, glass utility | global theme/tokens layer |
| `components.css` | All component styles | component styles / CSS modules |
| `app.jsx` | Root: auth, theme/density, site + published state, save/validation, toasts wiring | top-level editor container |
| `shell.jsx` | `TopBar`, `AccountMenu`, `PageTabs`, `BlockEditor`, `Preview` | shell components |
| `blocks.jsx` | Block type registry, seed content, `BlockCard`, per-type forms | block components |
| `fields.jsx` | Reusable fields: `TextField`, `TextArea`, `NumberField`, `Toggle`, `ImageUpload`, `RepeatableList`, `IconBtn` | form-field components |
| `toasts.jsx` | `ToastProvider` / `useToast` (success/error/info) | toast system |
| `confirm.jsx` | `ConfirmProvider` / `useConfirm` (glass confirmation modal) | confirm-dialog system |
| `client-site.html` | The example client's public site, rendered from the content model via postMessage | (replace with our real client site URL in the iframe) |

---

## Design Tokens
All defined in `tokens.css` for both `[data-theme="light"]` and `[data-theme="dark"]`.

### Type
- UI: **Hanken Grotesk** (`--font-ui`), weights 400–800.
- Mono (URLs, codes, paths): **JetBrains Mono** (`--font-mono`).

### Accent (platform-chosen indigo — NOT from any client)
- Light: `--accent #4f6bed`, `--accent-strong #3f59d8`, `--accent-press #3650c4`,
  `--accent-soft rgba(79,107,237,.12)`, `--accent-ring rgba(79,107,237,.32)`.
- Dark: `--accent #6f87f4`, `--accent-strong #5e78ef`, `--accent-press #5570ea`,
  `--accent-soft rgba(111,135,244,.18)`, `--accent-ring rgba(111,135,244,.38)`.
- On accent: `#ffffff`.

### Status hues
- Success `--ok #18a571` (soft `rgba(24,165,113,.14)`).
- Error `--err #e1496b` (soft `rgba(225,73,107,.14)`).
- Info = accent. Warning (unsaved/preview) amber `#e0a23c` / `#d2912a`.

### Backdrop (calm radial multi-hue the glass floats over)
- Light: layered radial-gradients of soft purple/blue/teal/pink over
  `linear-gradient(160deg,#eef1f9,#e8edf7)`.
- Dark: same hue positions, deeper, over `linear-gradient(160deg,#0f1118,#14161f)`.
- Apply to `body`, `background-attachment: fixed`. Copy the exact gradient stacks from
  `tokens.css`.

### Light surfaces / text
- Text: `--text #1b1d27`, `--text-2 #4a4f63`, `--text-3 #767c92`, `--text-faint #9aa0b4`.
- Glass: `--panel rgba(255,255,255,.58)`, `--panel-2 .46`, `--panel-solid .86`,
  `--card .52`, `--card-hover .66`.
- Fields: `--field-bg rgba(255,255,255,.60)`, `--field-bg-focus .92`,
  `--field-border rgba(20,24,50,.10)`, `--field-border-hover .18`.
- Hairline `rgba(20,24,50,.08)`; edge highlight `rgba(255,255,255,.75)`.

### Dark surfaces / text
- Text: `#f0f1f7 / #b9bdcc / #888da0 / #646980`.
- Glass: `--panel rgba(30,33,46,.55)`, `--panel-solid rgba(26,29,41,.88)`, etc.
- Fields: `--field-bg rgba(16,18,28,.45)`, `--field-bg-focus rgba(14,16,24,.72)`,
  `--field-border rgba(255,255,255,.10)`.

### Radii
`--r-xs 8 / --r-sm 11 / --r-md 16 / --r-lg 20 / --r-xl 26 / --r-pill 999`px.

### Shadows
Three diffuse tiers (`--shadow-sm/md/lg`) plus `--shadow-pop` for popovers/toasts. Copy
exact values from `tokens.css` (they differ per theme).

### Glass utility
`.glass` = `background: var(--panel)` + `backdrop-filter: blur(22px) saturate(175%)` +
1px `--field-border` + `--shadow-md` + `inset 0 1px 0 var(--edge)`.

### Density
`--density` multiplier (compact `.86` / regular `1` / comfy `1.18`) scales the `--gap-*`,
`--card-pad`, and `--field-pad-*` spacing tokens. Set on `<html>`.

### Theme application (important)
- Set `data-theme` on `<html>` **before first paint** (inline script reading
  `prefers-color-scheme`) to avoid a flash. See the inline `<script>` in `Knit Editor.html`.
- On theme/density change, add a `.theme-switching` class that sets
  `transition: none !important` for one frame so the swap is instant and never freezes
  mid-transition.

---

## Screens / Views

### 1. Sign-in (`SignIn` in `app.jsx`)
- Full-viewport centered layout over the gradient backdrop.
- A single glass card, max-width **400px**, radius `--r-xl` (26px), padding `40px 36px 30px`,
  `--shadow-lg`, centered text.
- Contents top→bottom: 64×64 rounded accent-soft tile holding the Knit logo; "Knit" title
  (30px/700); one-line subtitle (`--text-3`, ~30ch); full-width **"Sign in with Google"**
  button (48px tall, pill, glass, multicolor Google "G" SVG); fine print
  "Google is the only sign-in method for Knit."; footer line "Knit · platform editor".
- Clicking the button shows a brief spinner then enters the editor (wire to our real Google
  OAuth).

### 2. Editor shell (`App` in `app.jsx`)
Vertical stack inside a 12px-padded full-height flex column, 10px gaps:
`TopBar` → `PageTabs` → `workspace` (two panes).

#### Top bar (`TopBar`, `shell.jsx`)
Glass bar, radius `--r-lg`, `position: relative; z-index: 50` (so the account popover sits
above the workspace).
- **Left:** Knit brandmark (logo + "Knit"), a hairline divider, then site name + `·` +
  domain (domain in mono).
- **Right (ONLY three things):**
  1. Save-state indicator — a dot + "All changes published" / "Unsaved changes" (amber dot
     when dirty).
  2. **Primary "Save & publish" button** — pill, accent gradient, check icon, spinner +
     "Publishing…" while saving.
  3. **Account avatar button** — a standalone 38px **circle** with the user's initials
     (accent gradient). This is the only account control in the bar.
- Responsive: hide the save-state text, then domain, then brand name as width narrows.

#### Account menu (`AccountMenu`, `shell.jsx`)
Opens from the avatar as an **opaque** popover (272px), anchored top-right, with a full-screen
click-away scrim.
- **Must be solid, not see-through:** background `rgba(251,252,255,.97)` light /
  `rgba(28,31,44,.97)` dark, no backdrop-filter, `--shadow-pop`.
- Contents: header (40px avatar + name + email); an **Appearance** section with a **Light /
  Dark segmented control** (sun/moon icons, active option uses `--panel-solid` + accent
  text); a divider; a **Sign out** row (turns red on hover).
- Entrance animation is **transform-only** (slight translate/scale, no opacity fade) so it's
  never stuck hidden.

#### Page tabs (`PageTabs`, `shell.jsx`)
Glass bar of tabs; each tab shows page title (600) + path (mono, accent when active). Active
tab gets `--field-bg-focus` fill + border + `--shadow-sm`. A dashed "+" button adds a page.

#### Workspace
Flex row: **block editor** (left, `flex:1`, min 360px, own vertical scroll) + a 12px divider
+ **preview** (right, `flex:1.15`). Below ~900px it stacks vertically.

### 3. Block editor (left pane — `BlockEditor`, `shell.jsx` + `BlockCard`, `blocks.jsx`)
- Pane header: page title (22px/700) + block count.
- A vertical stack of glass **block cards**, gap `--gap-3`.
- **Add-a-block row:** dashed glass panel labeled "ADD A BLOCK" with a responsive grid of
  chips (one per block type: glyph tile + name + blurb). Clicking inserts a fresh empty block
  of that type, scrolls/animates it in, and fires an info toast.

**Block types** (registry in `blocks.jsx`): `richtext` (heading + body), `projectgrid`
(repeatable projects), `shop` (repeatable items), `shopnotes` (notes), `entrylist`
(year/label rows), `notecards` (title/text cards). Map these to our real block types; keep
the field composition shown in `BlockForm`.

#### Block card (`BlockCard`)
Glass card, radius `--r-md`, `overflow: hidden`. Header (left→right):
- **Drag handle** (`.blockcard__grip`, ⠿ dots, `cursor: grab`) — see Interactions.
- Disclosure button: a chevron (rotates when open) + accent-soft glyph tile + type name +
  one-line summary. Toggles the body open/closed via an animated
  `grid-template-rows: 0fr→1fr` reveal.
- **Delete button** only (trash/×, red on hover). **No up/down arrows.**

Body = the per-type form (the field components below).

### 4. Form fields (`fields.jsx`)
Consistent set, each with a label (12.5px/600, optional hint) above the control:
- **TextField** — glass input; focus lightens bg, accent border, accent ring. Optional mono.
- **TextArea** — auto-growing multi-line.
- **NumberField** — −/＋ steppers flanking a centered input; min/max/step; optional suffix.
- **Toggle** — labeled row + 44×26 switch (accent when on, knob slides).
- **ImageUpload** — empty state is a **drag-and-drop dropzone** (drag-over highlights with
  accent ring) that's also click-to-browse; filled state shows a 56px thumbnail + Replace /
  Remove. (Prototype uses object URLs; wire to our real upload.)
- **RepeatableList** — a list of rows; each row = **drag grip** + content + **Remove (×)**.
  Below the rows, a dashed pill **"+ add"**. Lists **nest** (a project row contains its own
  image list and tag list). **No up/down arrows** — reorder by dragging the grip.

### 5. Live preview (right pane — `Preview`, `shell.jsx`)
A framed view of the client's **published** site. Vertical stack: header → disclaimer →
browser.
- **Preview header:** "LIVE PREVIEW" label + a **Collapse** button.
- **Disclaimer** (`.preview__notice`, NOT collapsible): info state — "This preview shows your
  published site. New edits appear here only after you publish." When there are unsaved
  edits it switches to a **warning** (amber) — "Unsaved changes. Your edits won't show here
  until you Save & publish."
- **Browser chrome:** traffic lights, a tab (favicon + "{site} — {page}"), reload button,
  a URL pill (lock + `https://{domain}{path}` + a pulsing "live" indicator), and
  **desktop / tablet / mobile** size toggles that constrain the iframe width
  (desktop=full, tablet=800, mobile=390).
- **Iframe:** our real client site. **Do not restyle the client's site** — only frame it.

**Publish-gating (key behavior):** the preview renders the **published** snapshot, not live
edits. It updates only when the user clicks Save & publish (or switches pages). See State.

**Collapsible pane:** the whole preview folds to a slim **52px vertical rail** showing an
expand icon + vertical "LIVE PREVIEW" + an amber dot when there are unpublished changes;
clicking the rail expands it. **Keep the iframe mounted while collapsed** (hide via CSS) so it
doesn't reload.

### 6. Toasts (`toasts.jsx`)
Bottom-right stack of glass toasts with a left accent bar, icon tile, title, optional message,
optional detail list, dismiss button, and a timer bar for auto-dismissing ones.
- **success** (auto-dismiss ~3.2s): e.g. "Changes published" / "Your live preview is now up
  to date."
- **info** (auto-dismiss ~2.4s): block added / "Block removed" / "Page added" / "Signed out"
  / "Welcome back".
- **error** (**persists** until dismissed): on a failed save, title "Couldn't publish —
  please fix:" plus a **list of exactly which block/field failed**, each with a mono locator
  chip (e.g. `Index of works · Project grid · JM-001` → "needs a title").
- Support a `dedupe` key so repeated saves replace the prior save toast.

### 7. Confirmation modal (`confirm.jsx`)
`useConfirm()` returns a promise-based `confirm({title, message, confirmLabel, danger})`.
Centered glass dialog over a blurred scrim; icon tile (red for danger), title, message,
**Cancel** + **Delete** (danger gradient) actions. Esc cancels, Enter confirms; entrance is
transform-only. **Deleting a block must go through this modal** before it takes effect.

---

## Interactions & Behavior
- **Drag-to-reorder blocks:** each block card header has a draggable grip; on `dragstart`
  record the index, on `dragover` mark the hovered card (accent ring), on `drop` splice the
  dragged block into the target index. Dragged card dims to ~.45 opacity. Reordering marks
  the site dirty. (Implementation in `BlockEditor`.)
- **Drag-to-reorder list rows:** same pattern inside `RepeatableList` (grip per row).
- **Block collapse/expand:** animated `grid-template-rows` reveal; chevron rotates.
- **Delete block:** opens the confirm modal; only removes on confirm, then fires an info
  toast.
- **Add block / add page:** appends and fires an info toast; new block animates in.
- **Save & publish:** sets a saving spinner (~1s), runs validation; on errors → persistent
  error toast listing them and the site stays dirty; on success → copy `site` into
  `published`, clear dirty, success toast, and the preview updates + "live" pip pulses.
- **Theme:** Light/Dark from the account menu (and follows system on first load); instant
  swap with transitions suppressed.
- **Density:** compact/regular/comfy scales spacing tokens (exposed as a tweak in the
  prototype; wire to a real setting if desired).
- **Preview collapse / disclaimer:** as described above.
- **Reduced motion / capture safety:** entrance animations are transform-only (visible resting
  state); honor `prefers-reduced-motion`.

## State Management
Top-level state in `App`:
- `signedIn: boolean`
- `site` — the **working draft** content model `{ name, domain, activePageId, pages:[{ id,
  title, navLabel, path, works, blocks:[{ id, type, ...fields }] }] }`.
- `published` — a **deep copy** of `site` representing what the live site currently shows.
  Initialized equal to `site`. The preview renders `published` (with the live `activePageId`
  so page-switching still navigates the preview). On successful save:
  `published = structuredClone(site)`.
- `dirty: boolean` — set true on any content edit (block patch/add/delete/reorder, page add);
  cleared on successful save. Drives the save indicator and the preview disclaimer's
  warning state.
- `saving: boolean`, `justAdded: blockId | null` (for entrance animation),
  `previewCollapsed: boolean`.
- Theme (`dark`) + `density` persisted (prototype uses a tweaks hook; use our settings store).

**Validation** runs over `site` on save and returns `{where, what}` items (e.g. project
missing title, shop item missing name/price, external link not http(s), empty rich text).
Map this to our real validation rules; surface the specifics in the error toast.

The preview communicates with the iframe by `postMessage` of the page's content; the iframe
posts a "ready" message on load. In our app, point the iframe at the real client site URL and
drive it however our renderer expects — but preserve the **publish-gated** timing
(`published`, not `site`).

## Assets
- No external image assets. The Knit logo, account/field/preview icons, and the Google "G"
  are inline SVGs (see `app.jsx` / `shell.jsx` / `fields.jsx`). Reuse our icon library where
  we have equivalents; keep the Knit logo as the inline interlocking-curves mark.
- Fonts via Google Fonts: Hanken Grotesk + JetBrains Mono (self-host in our app if preferred).
- `client-site.html` is a stand-in for the customer's real site — **replace** it with our
  actual client preview; do not port its styles into the editor.

## Files
Design references in this bundle (read these for exact values/behavior):
`Knit Editor.html` (entry), `tokens.css`, `components.css`, `app.jsx`, `shell.jsx`,
`blocks.jsx`, `fields.jsx`, `toasts.jsx`, `confirm.jsx`, `client-site.html`,
`tweaks-panel.jsx`.

Open `Knit Editor.html` in a browser to interact with the full prototype.
