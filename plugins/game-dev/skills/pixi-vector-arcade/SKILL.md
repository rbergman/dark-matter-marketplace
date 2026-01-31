---
name: pixi-vector-arcade
description: Bootstrap browser-based games with PixiJS 8 and a modern retro/vector aesthetic (Geometry Wars, Asteroids, Tempest, Tron). This skill should be used when the user asks to "create a new game", "start a browser game project", "build an arcade game", "prototype a game", "set up PixiJS", or mentions wanting vector graphics, neon aesthetics, or arcade-style gameplay. Provides project scaffolding, ECS-lite architecture, performance patterns (pooling, spatial hashing, fixed timestep), and visual design system.
---

# PixiJS Vector Arcade Game Bootstrapping

**Purpose:** Scaffold browser-based games with PixiJS 8 and modern retro/vector aesthetics. Produces architecture that handles 500+ entities at 60fps with no memory growth over 30+ minute sessions.

---

## When to Use

Activate this skill when:
- Creating a new browser-based game with arcade/retro aesthetics
- Prototyping a game idea with solid architecture
- Building a PixiJS 8 project with proper performance patterns
- Setting up a TypeScript game project with ECS architecture

**Keywords:** game, arcade, retro, vector, pixijs, pixi, ecs, prototype, browser game, neon, glow

---

## Tech Stack

### Core Dependencies

```json
{
  "dependencies": {
    "pixi.js": "^8.6.6",
    "@pixi/layout": "^2.0.0",
    "stats.js": "^0.17.0"
  },
  "devDependencies": {
    "typescript": "^5.7.3",
    "typescript-eslint": "^8.21.0",
    "@eslint-community/eslint-plugin-eslint-comments": "^4.4.1",
    "eslint": "^9.18.0",
    "vite": "^6.0.7",
    "vitest": "^3.0.4",
    "husky": "^9.1.7"
  }
}
```

### PixiJS 8 API (Critical Changes from v7)

```typescript
// Application init is now async
const app = new Application();
await app.init({
  resizeTo: window,
  backgroundColor: 0x000000,
  preference: 'webgpu',  // Falls back to WebGL
});

// Graphics API is chainable
const g = new Graphics()
  .rect(0, 0, 100, 50)
  .fill({ color: 0xff0000 })
  .stroke({ width: 2, color: 0xffffff });

// ParticleContainer uses Particle objects, not Sprites
const particles = new ParticleContainer({
  dynamicProperties: {
    position: true,
    scale: true,
    rotation: false,
    tint: false,
    alpha: true,
  },
});
const particle = new Particle({ texture, anchorX: 0.5, anchorY: 0.5 });
particles.addParticle(particle);
```

### Context7 Documentation

When querying up-to-date PixiJS docs, use library IDs:
- `/pixijs/pixijs/v8_12_0`
- `/llmstxt/pixijs_llms-full_txt`

---

## Project Structure

```
project/
├── src/
│   ├── index.ts              # Entry point, app bootstrap
│   ├── game.ts               # Game class - orchestrates everything
│   │
│   ├── core/                 # Engine-level systems (game-agnostic)
│   │   ├── clock.ts          # Adjustable game timer
│   │   ├── ecs.ts            # Entity manager, component arrays
│   │   ├── pool.ts           # Generic object pooling
│   │   ├── spatial-hash.ts   # Collision broadphase
│   │   └── input.ts          # Keyboard/mouse state
│   │
│   ├── components/           # Pure data (no logic)
│   │   ├── transform.ts      # Position, rotation, scale
│   │   ├── velocity.ts       # Linear + angular velocity
│   │   ├── collider.ts       # Radius, collision mask/layer
│   │   ├── health.ts         # HP, max HP, invincibility
│   │   ├── lifetime.ts       # TTL for projectiles, particles
│   │   └── renderable.ts     # Graphics reference, layer
│   │
│   ├── systems/              # Logic that operates on components
│   │   ├── physics.ts        # Velocity → position, wrapping
│   │   ├── collision.ts      # Spatial hash queries, response
│   │   ├── render.ts         # Sync components → PIXI graphics
│   │   └── [game-specific]   # Weapon, enemy AI, etc.
│   │
│   ├── data/                 # Content definitions (pure data)
│   │   └── config.ts         # Tuning constants
│   │
│   ├── rendering/            # PIXI-specific
│   │   ├── layers.ts         # Container hierarchy
│   │   ├── viewport.ts       # Full viewport scaling
│   │   ├── particles.ts      # ParticleContainer system
│   │   ├── design-system.ts  # Colors, visual constants
│   │   └── shaders/          # Custom GLSL effects
│   │
│   ├── ui/                   # HUD, menus
│   │   └── hud.ts
│   │
│   ├── debug/                # Dev tools
│   │   └── stats.ts          # Performance monitor
│   │
│   └── types/                # Type declarations
│       └── stats.js.d.ts
│
├── references/               # Specs, original designs
├── docs/plans/               # Architecture docs
├── history/                  # Ephemeral scratch (gitignored)
└── [config files]
```

---

## Core Architecture Patterns

### 1. Adjustable Game Clock

Independent of framerate and wall clock. Supports pause, slow-mo, frame stepping.

```typescript
interface Clock {
  elapsed: number;      // Total game time (scaled)
  delta: number;        // Fixed tick duration (1/60)
  scale: number;        // 1.0 = normal, 0 = paused
  wallDelta: number;    // Real time (for UI animations)
  wallElapsed: number;
}

interface ClockController extends Clock {
  pause(): void;
  resume(): void;
  setScale(scale: number): void;
  step(delta: number): void;  // Advance one tick (debugging)
}
```

### 2. Fixed Timestep Game Loop

Physics at fixed 60Hz. Render interpolates for smooth visuals.

```typescript
const TICK_RATE = 60;
const TICK_DURATION = 1 / TICK_RATE;
let accumulator = 0;

app.ticker.add(() => {
  const wallDelta = app.ticker.deltaMS / 1000;
  accumulator += wallDelta * clock.scale;

  // Cap to prevent spiral of death
  accumulator = Math.min(accumulator, TICK_DURATION * 5);

  while (accumulator >= TICK_DURATION) {
    clock.delta = TICK_DURATION;
    clock.elapsed += TICK_DURATION;

    // Systems update in deterministic order
    inputSystem.update();
    physicsSystem.update();
    collisionSystem.update();
    // ... more systems
    world.flush();  // Apply deferred destructions

    accumulator -= TICK_DURATION;
  }

  // Render with interpolation
  const alpha = accumulator / TICK_DURATION;
  renderSystem.update(alpha);
});
```

### 3. ECS-Lite Architecture

Entities are numbers. Components are typed maps. Zero allocation in hot paths.

```typescript
type Entity = number;

class ComponentArray<T> {
  private readonly data = new Map<Entity, T>();

  set(entity: Entity, component: T): void { ... }
  get(entity: Entity): T | undefined { ... }
  has(entity: Entity): boolean { ... }
  remove(entity: Entity): void { ... }
  *entries(): IterableIterator<[Entity, T]> { yield* this.data.entries(); }
}

class World {
  private nextId = 0;
  private readonly alive = new Set<Entity>();
  private readonly toDestroy: Entity[] = [];  // Deferred

  // Component arrays
  readonly transform = new ComponentArray<Transform>();
  readonly velocity = new ComponentArray<Velocity>();
  // ...

  // Type markers (for fast iteration)
  readonly asteroids = new Set<Entity>();
  readonly projectiles = new Set<Entity>();
  // ...

  spawn(): Entity { ... }
  destroy(entity: Entity): void { this.toDestroy.push(entity); }
  flush(): void { /* Actually remove */ }
}
```

### 4. Object Pooling

Critical for preventing GC during gameplay.

```typescript
interface Pool<T> {
  acquire(): T;
  release(item: T): void;
  prewarm(count: number): void;
  readonly activeCount: number;
  readonly pooledCount: number;
}

class ObjectPool<T> implements Pool<T> {
  constructor(
    private factory: () => T,
    private reset: (item: T) => void,
    private dispose?: (item: T) => void
  ) {}
  // ...
}
```

**Rules:**
- Never create objects during gameplay—acquire from pools
- `reset()` hides but doesn't destroy (for Graphics: set visible=false, move offscreen)
- `destroy()` only on full shutdown
- Prewarm at startup based on expected max counts

### 5. Spatial Hashing

O(n) collision instead of O(n²).

```typescript
interface SpatialHash {
  cellSize: number;
  clear(): void;
  insert(entity: Entity, x: number, y: number, radius: number): void;
  queryRadius(x: number, y: number, radius: number): readonly Entity[];
}
```

- Rebuild every frame (fast with pooled cell arrays)
- Cell size ≈ largest common entity radius
- Returns candidates; caller does fine collision (circle-circle)

### 6. Separation of Concerns

- **Components**: Pure data, no methods
- **Systems**: Logic that operates on components, no PIXI imports
- **Rendering**: Reads state, never modifies it
- **Data definitions**: Pure config objects for content

---

## Performance Rules (Non-Negotiable)

These rules prevent crashes from naive implementations. See **game-perf** skill for full details.

### Hot Path Allocations

```typescript
// ❌ BAD - creates new array every frame
const nearby = entities.filter(e => e.active);

// ✅ GOOD - reuse scratch array
scratchArray.length = 0;
for (const e of entities) {
  if (e.active) scratchArray.push(e);
}
```

**Forbidden in systems:** `filter()`, `map()`, `reduce()`, spread operator (`[...arr]`), object literals in loops.

### Deferred Destruction

```typescript
// ❌ BAD - modifies collection during iteration
for (const e of world.asteroids) {
  if (dead) world.asteroids.delete(e);
}

// ✅ GOOD - defer destruction
world.destroy(e);  // Marks for deletion
// ... after all systems ...
world.flush();     // Actually removes
```

### Graphics Lifecycle

```typescript
// ❌ BAD - creates Graphics during gameplay
const explosion = new Graphics();
effectLayer.addChild(explosion);

// ✅ GOOD - acquire from pool, never destroy during gameplay
const explosion = pools.effects.acquire();
explosion.visible = true;
// ... on done ...
pools.effects.release(explosion);
```

---

## Visual Design System

For detailed design guidance, consult `references/visual-design.md`.

### Quick Reference

| Principle | Rule |
|-----------|------|
| **Glow** | Everything emits light. Lines are energy, not matter. |
| **Contrast** | Pure black void vs vivid neon. No middle ground. |
| **Motion** | Trails, particles, pulses. Nothing is static. |
| **Hierarchy** | Brightness = importance. Player brightest, debris dimmest. |
| **Feedback** | Every action has visible consequence. |

### Color Palette

```typescript
const Colors = {
  background: 0x000000,
  playerCore: 0xffffff,
  playerGlow: 0x00ffff,
  hazardPrimary: 0xffaa00,
  enemyPrimary: 0xff0044,
  rewardCore: 0x00ff00,
  uiPrimary: 0x00ffff,
};
```

### Line Weights

```typescript
const LineWeight = {
  hairline: 1,
  thin: 1.5,
  normal: 2,
  bold: 3,
  heavy: 4,
};
```

### Entity Design Rules

- Each entity type must have a **unique silhouette** for instant recognition
- Don't use simple vanilla polygons—add **internal detail lines**
- Volatile entities should **pulse** to indicate danger

### Glow Implementation

Apply BlurFilter per-layer (not per-object):

```typescript
layer.filters = [new BlurFilter({ strength: 4, quality: 2 })];
```

---

## Viewport & Responsive Design

### Full Viewport Scaling

Play area expands with viewport (not letterboxed):

```typescript
const MIN_WIDTH = 1200;
const MIN_HEIGHT = 800;
const MAX_ASPECT_RATIO = 21 / 9;
const MIN_ASPECT_RATIO = 4 / 3;
```

### HUD Layout

Use `@pixi/layout` for responsive positioning with max-width constraint:

```typescript
const HudDesign = {
  maxWidth: 1400,  // Prevents ultra-wide spreading
  padding: 20,
};
```

---

## ESLint Configuration

Strict rules that cannot be disabled via eslint-disable comments. See `references/eslint-config.md` for full configuration.

Key rules:
- `complexity: 10` max
- `max-lines-per-function: 60`
- `max-lines: 400` per file
- `@typescript-eslint/no-explicit-any: error`

---

## Dev Tools

### Stats Monitor

```typescript
// Toggle with Cmd+Shift+S (Mac) or Ctrl+Shift+S (Windows)
const stats = createStatsMonitor();
stats.begin();
// ... update ...
stats.end();
```

### Clock Controls

```typescript
clock.pause();           // Freeze game
clock.setScale(0.2);     // 20% speed (slow-mo)
clock.step(1/60);        // Advance one frame
```

---

## Scaffolding Workflow

When creating a new game project:

1. **Scaffold** - Create project structure, install deps, configure TypeScript/ESLint/Vite
2. **Core systems** - Clock, ECS, Pool, SpatialHash, Input
3. **Rendering** - Layers, Viewport, Particles, Design system
4. **Components** - Define data types for the specific game
5. **Systems** - Implement game logic (physics, collision, etc.)
6. **Content** - Data-driven definitions for entities
7. **Polish** - Particles, screen shake, glow shaders, HUD

The architecture is game-agnostic—the same foundation works for shooters, survivors, puzzle games, or anything with real-time gameplay.

---

## Related Skills

- **game-perf** - Detailed GC-free hot path patterns
- **game-design** - 5-component framework for evaluating mechanics
