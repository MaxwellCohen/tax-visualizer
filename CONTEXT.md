# Domain context (tax visualizer)

Vocabulary for the tax page pipeline and UI. For the full **ConfigItem** inventory, see [docs/tax-config-items.md](docs/tax-config-items.md). For Sankey edge semantics, see [docs/sankey-links.md](docs/sankey-links.md).

## Core terms

- **Tax year config** — Year-scoped numbers and limits loaded from bundled year values (`TaxYearConfig`); not user input.
- **Line item** — A user-editable money row in the form: income, pretax payroll benefit, itemized-style deduction, or credit. Implemented as typed rows in `TaxFormData.rows` (see `src/lib/tax/form/types.ts`).
- **ConfigItem** — One row in the ordered tax-page **registry**: may define a line-item `input`, a `calculate` pipeline step, Sankey/Mekko placement, and summary metadata. Composed type: identity + tax input slice + chart slice + pipeline slice (`src/lib/config/taxPage/types.ts`).
- **Registry / assembly phases** — `getConfigItems` builds the full ordered list by concatenating named **phases** (`TAX_PAGE_REGISTRY_PHASES` in `src/lib/config/taxPage/taxPage.config.ts`). Order matters for the calculation graph.
- **Calculated config** — Each `ConfigItem` plus `computedValue` from running `calculate` over current form rows (`calculateAllConfigValues` in `src/lib/tax/calc/calculateTaxes.ts`). Primary numeric **seam** for charts and summary.
- **Scenario** — Serialized `TaxFormData` (for example URL search param); see `src/lib/tax/scenario/`.
- **Line item lifecycle** — Checklist paths for adding a line type: `src/lib/tax/form/lineItemLifecycle.ts`.

## Seams (where behavior is meant to change without edits elsewhere)

- **Registry factories** — Add or change a `ConfigItem` by editing the appropriate factory under `src/lib/config/taxPage/` and keeping ids unique.
- **calculate pipeline** — All computed dollars flow through `calculateAllConfigValues`; favor tests at this boundary.
- **Sankey layout** — Pure builder `buildSankeyLayoutFromCalculatedConfig` (`src/components/tax/sankey/buildSankeyLayoutFromCalculatedConfig.ts`) separates layout from Solid rendering.
