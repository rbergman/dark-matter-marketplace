# TypeScript Integration Reference

## Build Configuration

### tsconfig.json Optimization
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "incremental": true,
    "skipLibCheck": true
  }
}
```

### Project References (Monorepo)
```json
{
  "references": [
    { "path": "./packages/shared" },
    { "path": "./packages/client" },
    { "path": "./packages/server" }
  ]
}
```

### Path Mapping
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@shared/*": ["packages/shared/src/*"]
    }
  }
}
```

## Framework Integration

### React 19+ Patterns
```typescript
// Props typing (prefer over FC)
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

function Button({ onClick, children, variant = 'primary' }: ButtonProps) {
  return <button onClick={onClick} className={variant}>{children}</button>;
}

// Event handlers
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setValue(e.target.value);
};

// Refs
const inputRef = useRef<HTMLInputElement>(null);

// Generic components
function List<T>({ items, renderItem }: {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}) {
  return <ul>{items.map(renderItem)}</ul>;
}
```

### Next.js Typing
```typescript
// Page metadata
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Page',
};

// API routes
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ data: 'value' });
}

// Server components with async
async function Page({ params }: { params: { id: string } }) {
  const data = await fetchData(params.id);
  return <div>{data}</div>;
}
```

### Express/Fastify Typing
```typescript
// Express with typed request
import { Request, Response, NextFunction } from 'express';

interface TypedRequest<T> extends Request {
  body: T;
}

app.post('/users', (
  req: TypedRequest<{ name: string; email: string }>,
  res: Response
) => {
  // req.body is typed
});

// Fastify with schema
import { FastifyRequest, FastifyReply } from 'fastify';

interface CreateUserBody {
  name: string;
  email: string;
}

fastify.post<{ Body: CreateUserBody }>('/users', async (request, reply) => {
  const { name, email } = request.body;
});
```

## Code Generation

### OpenAPI to TypeScript
```bash
# Using openapi-typescript
npx openapi-typescript ./openapi.yaml -o ./src/types/api.ts
```

### GraphQL Code Generation
```yaml
# codegen.yml
schema: "./schema.graphql"
documents: "./src/**/*.graphql"
generates:
  ./src/generated/graphql.ts:
    plugins:
      - typescript
      - typescript-operations
      - typescript-react-apollo
```

## JavaScript Interop

### Third-Party Types
```typescript
// Install types for untyped packages
// npm install --save-dev @types/lodash

// Declare types for packages without @types
declare module 'untyped-package' {
  export function doThing(input: string): number;
}
```

### Module Augmentation
```typescript
// Extend existing types
declare module 'express-serve-static-core' {
  interface Request {
    user?: { id: string; role: string };
  }
}
```

### Ambient Declarations
```typescript
// globals.d.ts
declare global {
  interface Window {
    analytics: {
      track: (event: string, data: Record<string, unknown>) => void;
    };
  }
}

export {};
```

## Migration Strategies

### Gradual Migration from JavaScript
1. Add `tsconfig.json` with `allowJs: true`
2. Rename files `.js` → `.ts` one at a time
3. Add types incrementally, starting with:
   - Public API boundaries
   - Data models
   - Utility functions
4. Enable strict mode after full migration

### Type Coverage Tracking
```bash
# Install type-coverage
npm install -g type-coverage

# Check coverage
type-coverage --detail --strict
```

## Monorepo Patterns

### Workspace Configuration (pnpm)
```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

### Shared Type Packages
```typescript
// packages/types/src/index.ts
export interface User {
  id: string;
  email: string;
}

export interface ApiResponse<T> {
  data: T;
  meta: { timestamp: number };
}
```

### Build Orchestration
```json
{
  "scripts": {
    "build": "tsc --build --verbose",
    "clean": "tsc --build --clean"
  }
}
```
