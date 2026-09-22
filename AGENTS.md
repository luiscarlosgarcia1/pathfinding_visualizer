## Agent skills

### Issue tracker

Issues and specifications are tracked in Linear under the `Luis Garcia` team (`T`) and its `Pathfinder` project. See `docs/agents/issue-tracker.md`.

### Domain docs

This is a single-context repository. See `docs/agents/domain.md`.

## Coding conventions

These are repository defaults. Instructions from an applicable skill take precedence whenever they conflict.

### Structure and modules

- Keep the repository root for project-wide configuration, documentation, package metadata, entry points, and major components. Put code in the existing subsystem that owns it; create a root-level directory only for a genuinely new top-level component.
- Give each file one clear, cohesive purpose. Aim for roughly 350 lines per source file. A small overage is acceptable when splitting would harm cohesion; substantially larger files should be split at meaningful domain boundaries before growing further.
- Use concise, meaningful names. Avoid catch-all modules such as `utils`, `helpers`, `common`, or `misc`; shared code must represent a real named concept with clear ownership.
- Use kebab-case filenames where the language and tooling support it. Follow language-required conventions where they do not: C++ headers and source files may follow the subsystem's established naming; JavaScript modules follow the web/server conventions already present.
- Group code by feature or domain, keeping closely related behavior, validation, models, and support code together when that clarifies ownership.
- Keep dependencies directional: the React UI and Express server may depend on engine contracts, but C++ grid and algorithm logic must remain independent of the HTTP and UI layers.
- Define each API contract, constant, schema, and externally meaningful rule once at its canonical owner. Consumers import or reference it rather than duplicating it.
- Keep public APIs small and intentional; keep implementation helpers internal unless they serve a clear public boundary.

### Change quality

- Prefer simple, direct, readable code over clever indirection, premature abstraction, or generalization.
- Keep small duplication until a proven shared domain concept emerges. When extracting shared behavior, name it after that responsibility rather than a generic technical category.
- Every addition, edit, or removal leaves its affected area coherent: remove obsolete code, stale tests, unused imports, unreachable branches, outdated documentation, dead configuration, and fractured interfaces created by the change. Do not perform unrelated cleanup.
- Keep diffs scoped to the Linear issue. Complete necessary cleanup within the affected boundary, but create a separate Linear issue for broader, separable refactoring and label it `refactor-needed`.
- Use comments for constraints, invariants, and non-obvious decisions. Create or update an ADR for lasting decisions that affect multiple modules, establish a contract, or involve meaningful tradeoffs.

### Tests and verification

- Use judgment, guided by the applicable skill, when deciding whether a change needs tests. When tests are created or changed, keep them near the relevant behavior where sensible, name them for observable outcomes, and favor public behavior over implementation details.
- Follow applicable skill verification instructions first. Otherwise, verify proportionately to the change's size and risk, and report only checks actually performed.
