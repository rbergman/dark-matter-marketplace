# TypeScript Type Patterns Reference

## Full-Stack Type Safety

### Shared Types
- Share types between frontend/backend in isomorphic setups
- Use Zod for network and form validations with inferred types
- Type-safe API clients generated from schemas

### Data Layer
- Database query builders with type inference
- Type-safe routing with path parameters
- WebSocket message type definitions

## Type System Mastery

### Generic Patterns
```typescript
// Constrained generics
function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>

// Conditional types
type Flatten<T> = T extends Array<infer U> ? U : T;

// Mapped types with modifiers
type Mutable<T> = { -readonly [P in keyof T]: T[P] };

// Template literal types
type EventName<T extends string> = `on${Capitalize<T>}`;
```

### Discriminated Unions
```typescript
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

// Exhaustive checking
function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${x}`);
}
```

### Branded Types
```typescript
type UserId = string & { readonly __brand: 'UserId' };
type Email = string & { readonly __brand: 'Email' };

function createUserId(id: string): UserId {
  return id as UserId;
}
```

### Type Guards
```typescript
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function hasProperty<T extends object, K extends PropertyKey>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> {
  return key in obj;
}
```

## Testing Patterns

### Type-Safe Test Utilities
```typescript
// Mock factories with proper types
function createMock<T extends object>(overrides?: Partial<T>): T

// Type-safe fixtures
type TestFixture<T> = {
  given: T;
  expected: T;
  description: string;
};
```

### Assertion Helpers
```typescript
function expectType<T>(_value: T): void {}
function expectError<T>(_value: T): void {}
```

## Performance Patterns

### Optimization Techniques
- Use `const enum` for compile-time inlining
- Prefer `type` imports for type-only usage
- Lazy type evaluation with conditional types
- Flatten deep union types
- Avoid excessive intersection chains
- Monitor generic instantiation depth

### Bundle Optimization
```typescript
// Type-only imports (no runtime impact)
import type { Config } from './config';

// Const enums (inlined at compile time)
const enum Direction {
  Up = 'UP',
  Down = 'DOWN'
}
```

## Error Handling

### Result Type Pattern
```typescript
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function tryCatch<T>(fn: () => T): Result<T> {
  try {
    return { ok: true, value: fn() };
  } catch (error) {
    return { ok: false, error: error as Error };
  }
}
```

### Custom Error Classes
```typescript
class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

## Advanced Techniques

### Type-Level State Machines
```typescript
type State = 'idle' | 'loading' | 'success' | 'error';
type Transition<S extends State> =
  S extends 'idle' ? 'loading' :
  S extends 'loading' ? 'success' | 'error' :
  never;
```

### Compile-Time Validation
```typescript
// Ensure array is non-empty at compile time
type NonEmptyArray<T> = [T, ...T[]];

// Validate string literal patterns
type ValidEmail = `${string}@${string}.${string}`;
```

### Runtime Type Checking with Zod
```typescript
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  age: z.number().min(0).max(150),
});

type User = z.infer<typeof UserSchema>;
```

## Utility Types

### Common Custom Utilities
```typescript
// Make specific keys required
type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Deep partial
type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

// Extract function return type
type AsyncReturnType<T extends (...args: any) => Promise<any>> =
  T extends (...args: any) => Promise<infer R> ? R : never;

// String literal manipulation
type CamelToSnake<S extends string> =
  S extends `${infer T}${infer U}`
    ? `${T extends Capitalize<T> ? '_' : ''}${Lowercase<T>}${CamelToSnake<U>}`
    : S;
```
