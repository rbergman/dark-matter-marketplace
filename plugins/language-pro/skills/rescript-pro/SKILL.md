---
name: rescript-pro
description: Expert ReScript developer specializing in type-safe functional programming, JavaScript interop, and React integration. This skill should be used PROACTIVELY when working on any ReScript code - implementing features, designing APIs, debugging type errors, or reviewing code quality. Use unless a more specific subagent role applies.
---

# ReScript Pro

Senior-level ReScript expertise for production projects. Focuses on type safety, exhaustive pattern matching, and clean JavaScript interop.

## When Invoked

1. Review `rescript.json` for project conventions and build settings
2. For build system setup, invoke the **just-pro** skill
3. Apply ReScript idioms and established project patterns

## Core Standards

**Required:**
- All pattern matches exhaustive - **NO wildcard `_` on variants you control**
- **NO `%raw` in production code** - use typed external bindings
- **NO `Obj.magic` or type coercion** - fix the types properly
- All external bindings have explicit types
- `rescript build` passes with zero warnings
- `rescript format` enforced on all code

**Foundational Principles:**
- **Single Responsibility**: One module = one purpose, one function = one job
- **No God Modules**: Split large modules; if it has 10+ top-level functions, decompose
- **Dependency Injection**: Pass dependencies as parameters, don't rely on global state
- **Pipe-First Style**: Use `->` for data transformations, reads left-to-right
- **Make Illegal States Unrepresentable**: Model domain with variants and records

---

## Project Setup (ReScript 11+)

### Version Management

Pin Node version with [mise](https://mise.jdx.dev): `mise use node@22` (creates `.mise.toml` — commit it). Team members run `mise install`. See **mise** skill for setup.

### New Project Quick Start

```bash
# Initialize
npm init -y
npm install rescript @rescript/core @rescript/react
npm install -D eslint @eslint/js eslint-plugin-react-hooks eslint-plugin-react-compiler

# Create rescript.json (see references/rescript-template.json)
# Copy configs from this skill's references/ directory:
#   references/gitignore              -> .gitignore
#   references/rescript-template.json -> use as rescript.json base
#   references/eslint.config.js       -> eslint.config.js

# Create source structure
mkdir -p src
echo 'Console.log("Hello ReScript")' > src/Main.res

# Add scripts to package.json:
npm pkg set scripts.build="rescript"
npm pkg set scripts.clean="rescript clean"
npm pkg set scripts.dev="rescript -w"
npm pkg set scripts.format="rescript format -all"

# For build system, invoke just-pro skill

# Verify
npm run build
```

### Developer Onboarding

```bash
git clone <repo> && cd <repo>
just setup         # Runs mise trust/install + npm ci
just check         # Verify everything works
```

Or manually:
```bash
mise trust && mise install  # Get pinned Node version
npm ci                      # Get dependencies
npm run build              # Build ReScript
```

**Why ReScript?** Sound type system with no `any` escape hatch. Compiles to readable JavaScript. Exhaustive pattern matching catches bugs at compile time.

---

## Build System

**Invoke the `just-pro` skill** for build system setup. It covers:
- Simple repos vs monorepos
- Hierarchical justfile modules
- Language-specific templates

**Why just?** Consistent toolchain frontend between agents and humans. Instead of remembering build commands, use `just build`.

---

## Quality Assurance

**Auto-Fix First** - Always try auto-fix before manual fixes:

```bash
just fix             # Or: npx rescript format -all && npx eslint src/ --fix
```

**Verification:**
```bash
just check           # Or: npx rescript build && npx eslint src/ && npm test
```

**Note:** ReScript compiler warnings should be treated as errors. A clean build means zero warnings. ESLint validates React hooks and enforces complexity limits on the compiled output.

---

## Linting Configuration

ReScript uses a **two-layer quality approach**:
1. **Compiler warnings** - Catch ReScript-specific issues (exhaustive matches, unused bindings)
2. **ESLint on JS output** - Validate React hooks, enforce complexity limits, React Compiler compatibility

### ESLint Setup for ReScript

Install dependencies:
```bash
npm install -D eslint @eslint/js eslint-plugin-react-hooks eslint-plugin-react-compiler
```

Copy `references/eslint.config.js` to your project root. This config:
- Targets only `.res.mjs` files (compiled ReScript output)
- Validates React hooks rules
- Enforces React Compiler compatibility
- Applies complexity limits

### Enforced Limits (via ESLint on JS output)

| Limit | Value | Purpose |
|-------|-------|---------|
| `complexity` | 15 | Cyclomatic complexity cap |
| `max-depth` | 4 | Avoid deeply nested code |
| `max-lines-per-function` | 80 | Single responsibility |
| `max-lines` | 500 | Prevent god modules |
| `max-params` | 5 | Use records for many params |
| `max-nested-callbacks` | 3 | Flatten callback chains |

### React Hooks Validation

ESLint validates React hooks on the compiled output:
- `react-hooks/rules-of-hooks` - Enforces hooks are called correctly
- `react-hooks/exhaustive-deps` - Warns about missing effect dependencies

### React Compiler Integration

The `eslint-plugin-react-compiler` validates that components are compatible with React Compiler (automatic memoization).

To opt a component into React Compiler memoization:

```rescript
@react.component
let make =
@directive("'use memo'")
(~count) => {
  <div>{React.int(count)}</div>
}
```

The `@directive` attribute emits a directive string at the start of the function in the JS output.

### Warnings Configuration

The `rescript.json` warnings config:
- `+a`: Enable ALL warnings
- `-48`: Disable "implicit elimination of optional arguments" (noisy)
- `-30`: Disable "duplicate names in mutually recursive types" (rare edge case)
- `error: +a-3-44-102`: Make all warnings errors EXCEPT:
  - `-3`: Deprecated feature (allow during migration)
  - `-44`: Open statement shadows identifier (common with React)
  - `-102`: Polymorphic comparison (sometimes necessary)

---

## Quick Reference

### Type System

| Pattern | Use |
|---------|-----|
| Variants | Model states, tagged unions, enums |
| Records | Structured data with named fields |
| `option<'a>` | Nullable values (Some/None) |
| `result<'a, 'e>` | Operations that can fail |
| Type parameters | Generic/polymorphic functions |
| Labeled arguments | Named params for clarity |

### Variants (Algebraic Data Types)

```rescript
// Simple enum
type color = Red | Green | Blue

// With payloads
type shape =
  | Circle({radius: float})
  | Rectangle({width: float, height: float})
  | Triangle({base: float, height: float})

// Pattern matching - MUST be exhaustive
let area = shape =>
  switch shape {
  | Circle({radius}) => Js.Math._PI *. radius *. radius
  | Rectangle({width, height}) => width *. height
  | Triangle({base, height}) => 0.5 *. base *. height
  // NO: | _ => 0.0  // Wildcard hides future variants!
  }
```

### Records

```rescript
// Type declaration
type user = {
  id: string,
  name: string,
  email: string,
  age: int,
}

// Creation
let user = {
  id: "123",
  name: "Alice",
  email: "alice@example.com",
  age: 30,
}

// Update (immutable by default)
let updatedUser = {...user, age: 31}

// Mutable fields when needed
type counter = {
  mutable count: int,
}
```

### Option and Result

```rescript
// Option for nullable values
let findUser = (users, id): option<user> =>
  users->Array.find(u => u.id == id)

// Handle option explicitly
let greeting = switch findUser(users, "123") {
| Some(user) => `Hello, ${user.name}!`
| None => "User not found"
}

// Result for operations that can fail
type fetchError = NetworkError | NotFound | ParseError(string)

let fetchUser = async (id): result<user, fetchError> => {
  try {
    let response = await fetch(`/users/${id}`)
    if response->Response.ok {
      let data = await response->Response.json
      Ok(parseUser(data))
    } else {
      Error(NotFound)
    }
  } catch {
  | _ => Error(NetworkError)
  }
}

// Chain results with Result module
let processUser = (id) =>
  id
  ->fetchUser
  ->Result.map(user => user.name->String.toUpperCase)
  ->Result.mapError(err => `Failed: ${errorToString(err)}`)
```

### Pipe Operator

```rescript
// Pipe-first style: data flows left to right
let result =
  users
  ->Array.filter(u => u.age >= 18)
  ->Array.map(u => u.name)
  ->Array.sort(String.compare)
  ->Array.joinWith(", ")

// Underscore placeholder for non-first position
let contains = str->String.includes("test", _)
```

### Labeled Arguments

```rescript
// Use labeled args for functions with multiple params of same type
let createRect = (~width: float, ~height: float) => {
  Rectangle({width, height})
}

// Optional with default
let greet = (~greeting="Hello", ~name) => {
  `${greeting}, ${name}!`
}

// Call with labels
let rect = createRect(~width=10.0, ~height=5.0)
let msg = greet(~name="Alice")  // Uses default greeting
```

### Modules

```rescript
// Module definition
module User = {
  type t = {
    id: string,
    name: string,
  }

  let make = (~id, ~name) => {id, name}

  let toString = (user: t) => `${user.name} (${user.id})`
}

// Module usage
let user = User.make(~id="123", ~name="Alice")
Console.log(User.toString(user))

// Open for local scope
{
  open User
  let u = make(~id="456", ~name="Bob")
  Console.log(toString(u))
}

// Module signatures (interfaces)
module type Printable = {
  type t
  let toString: t => string
}
```

---

## JavaScript Interop

### External Bindings

```rescript
// Global value
@val external document: Dom.document = "document"

// Global function
@val external parseInt: string => int = "parseInt"

// Module import
@module("lodash") external chunk: (array<'a>, int) => array<array<'a>> = "chunk"

// Default export
@module("./config") external config: {..} = "default"

// Method call on object
@send external focus: (Dom.element) => unit = "focus"
@send external getAttribute: (Dom.element, string) => Nullable.t<string> = "getAttribute"

// Property access
@get external length: array<'a> => int = "length"
@set external setTitle: (Dom.document, string) => unit = "title"

// Constructor
@new external makeDate: unit => Js.Date.t = "Date"
@new external makeDateFromString: string => Js.Date.t = "Date"
```

### Common FFI Patterns

```rescript
// Nullable values from JS
@module("./api") external getUser: string => Nullable.t<user> = "getUser"

let user = getUser("123")
switch user->Nullable.toOption {
| Some(u) => Console.log(u.name)
| None => Console.log("Not found")
}

// Variadic functions
@module("path") @variadic
external join: array<string> => string = "join"

let fullPath = join(["users", "alice", "documents"])

// Object with optional fields
type options = {
  timeout?: int,
  retries?: int,
}

@module("./fetch") external request: (string, options) => promise<response> = "request"

// Polymorphic variants for JS string enums
@module("./api")
external setMode: (@unwrap [#development | #production | #test]) => unit = "setMode"

setMode(#production)
```

### Promises and Async/Await

```rescript
// Async function
let fetchData = async (url: string): result<data, error> => {
  try {
    let response = await fetch(url)
    let json = await response->Response.json
    Ok(parseData(json))
  } catch {
  | Exn.Error(e) => Error(NetworkError(Exn.message(e)))
  }
}

// Sequential operations
let fetchUserAndPosts = async (userId) => {
  let user = await fetchUser(userId)
  let posts = await fetchPosts(userId)
  {user, posts}
}

// Parallel operations
let fetchAll = async (ids) => {
  let promises = ids->Array.map(fetchUser)
  await Promise.all(promises)
}
```

---

## React Integration

### Basic Component

```rescript
@react.component
let make = (~name: string, ~age: int) => {
  <div>
    <h1>{React.string(`Hello, ${name}!`)}</h1>
    <p>{React.string(`Age: ${Int.toString(age)}`)}</p>
  </div>
}
```

### Hooks

```rescript
@react.component
let make = () => {
  // State
  let (count, setCount) = React.useState(_ => 0)

  // Effect
  React.useEffect0(() => {
    Console.log("Component mounted")
    Some(() => Console.log("Component unmounted"))
  })

  // Effect with deps
  React.useEffect1(() => {
    Console.log(`Count changed to ${Int.toString(count)}`)
    None
  }, [count])

  // Reducer for complex state
  let (state, dispatch) = React.useReducer((state, action) =>
    switch action {
    | Increment => {...state, count: state.count + 1}
    | Decrement => {...state, count: state.count - 1}
    | Reset => {count: 0}
    }
  , {count: 0})

  // Ref
  let inputRef = React.useRef(Nullable.null)

  <div>
    <p>{React.string(Int.toString(count))}</p>
    <button onClick={_ => setCount(prev => prev + 1)}>
      {React.string("+")}
    </button>
  </div>
}
```

### Props with Variants

```rescript
type buttonVariant = Primary | Secondary | Danger

@react.component
let make = (~variant: buttonVariant, ~children: React.element) => {
  let className = switch variant {
  | Primary => "btn-primary"
  | Secondary => "btn-secondary"
  | Danger => "btn-danger"
  }

  <button className>
    {children}
  </button>
}
```

### Children and Optional Props

```rescript
@react.component
let make = (
  ~title: string,
  ~subtitle: option<string>=?,
  ~children: React.element,
) => {
  <div>
    <h1>{React.string(title)}</h1>
    {switch subtitle {
    | Some(s) => <h2>{React.string(s)}</h2>
    | None => React.null
    }}
    {children}
  </div>
}

// Usage
<Card title="Hello" subtitle="World">
  <p>{React.string("Content")}</p>
</Card>
```

---

## Project Organization

```
project/
├── src/
│   ├── Main.res              # Entry point
│   ├── Types.res             # Shared type definitions
│   ├── Utils.res             # Utility functions
│   ├── Components/           # React components
│   │   ├── Button.res
│   │   └── Card.res
│   └── Bindings/             # JS interop
│       └── LocalStorage.res
├── rescript.json
├── package.json
└── justfile
```

**Rules:** One module = one purpose. Keep bindings in separate files. Use namespaced modules for libraries.

---

## Anti-Patterns

- `%raw("...")` in production code (use typed bindings)
- `Obj.magic` for type coercion (fix the types instead)
- Wildcard `_` in switch on your own variants (add explicit cases)
- Ignoring warnings (treat them as errors)
- Mutable state everywhere (use immutable by default)
- Deep nesting instead of early returns
- Giant modules with 10+ functions (split by responsibility)
- Stringly-typed APIs (use variants for known values)
- Using `@bs.as` instead of proper binding design
- Ignoring `option` return types (always handle None)

---

## AI Agent Guidelines

**Before writing code:**
1. Read `rescript.json` for build configuration and compiler options
2. Check for existing type definitions and patterns in the codebase
3. Identify bindings patterns for JavaScript interop

**When writing code:**
1. Start with type definitions - model the domain with variants and records
2. Use exhaustive pattern matching - no wildcards on your own types
3. Handle all `option` and `result` cases explicitly
4. Create typed bindings for JS interop - avoid `%raw`

**Before committing:**
1. Run `just check` (standard for projects using just)
2. Fallback: `npx rescript build && npx eslint src/` (must have zero warnings)
3. Fallback: `npx rescript format -all` for consistent formatting

---

## References

- `references/rescript-template.json` - Strict rescript.json configuration with comprehensive warnings
- `references/eslint.config.js` - ESLint config for linting compiled JS output
- `references/patterns.md` - Additional ReScript patterns
- `references/gitignore` - ReScript-specific gitignore
