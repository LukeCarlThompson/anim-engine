# Agent Guidelines

## Architecture

- **Functions, not classes.** Factory functions capture state in closures. No `class`, no `this`, no `new`.
- All returned methods are arrow functions (safe to pass as callbacks).
- Zero allocations in hot paths — mutate state in place.

## TypeScript

- **Explicit return types** on all exported functions.
- **`import type`** for type-only imports.
- **No type assertions** (`as Type`, `<Type>`). Use `typeof`, `in`, or other control-flow narrowing instead.
- Use discriminated unions and type guards rather than casts.
- Prefer `const` over `let` where possible.

## Naming

| What                | Convention            | Example       |
| ------------------- | --------------------- | ------------- |
| Factory functions   | `create` + PascalCase | `createTimer` |
| Types/interfaces    | PascalCase            | `UserOptions` |
| Variables/functions | camelCase             | `getUser`     |
| Callbacks           | `on` prefix           | `onUpdate`    |
| Unused params       | `_` prefix            | `_unused`     |

## Imports & Modules

- **Domain-organized** — group by feature, not by file type (e.g. `auth/login.ts` + `auth/session.ts`, not `controllers/` + `services/`).
- Barrel exports via `index.ts`.
- Descriptive variable names over brevity.
