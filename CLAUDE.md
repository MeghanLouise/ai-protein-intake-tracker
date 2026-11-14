# Component guidelines

Any UI element that appears in more than one place in the app must be a shared component in
`client/src/components/`, and must be reused rather than rebuilt.

## Rules

1. **Reuse before you create.** Before writing a new `<button>`, `<select>`, input, card, chip, etc.,
   check `client/src/components/` for one that already does the job. If it nearly fits, add a prop or
   variant to it instead of making a near-duplicate.
2. **Anything that is the same lives in `components/`.** If you notice the same markup and styling
   in two or more places, extract it into a component in that folder and replace every copy.
3. **One component, one look.** Styling for a shared component lives in one place (`index.css`, keyed
   by the component's classes). Don't restyle an instance with one-off CSS; add a variant instead.
4. **No raw elements where a shared component exists.** Use `<Button>` and `<Select>`, not bare
   `<button>` / `<select>`, for anything that matches their styles.
5. **Name by purpose, not by page.** Components are named for what they are (`Button`, `Select`),
   not where they first appeared.

## Current shared components

| Component | Use for |
| --- | --- |
| `Button` | Every button that shares the app's button styling. Variants: `primary` (default), `secondary`, `link`, `google`, `chip`, `category`, `icon`. `loading` shows a spinner and disables the button; `selected` marks the active choice on `chip` / `category`. |
| `Select` | Every dropdown form field (label, value, options, optional placeholder). |
| `Spinner` | Loading indicators. |

## Intentionally separate

These buttons have their own one-off layouts and aren't shared with anything else, so they stay
bespoke: the bottom nav, the calendar day cells, the header menu, the per-set kebab menu, the
supplement checklist rows and the saved-meal list rows. If one of these ever gets a second use,
promote it into `components/` rather than copying it.
