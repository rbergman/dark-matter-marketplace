# Dev Tools & UI System

When adding dev tools, debug UI, pause screens, or settings systems.

## Additional Dependencies

```json
{
  "dependencies": {
    "@pixi/ui": "^2.0.0"
  },
  "devDependencies": {
    "tweakpane": "^4.0.0"
  }
}
```

- `tweakpane` as devDependency + dynamic import ensures tree-shaking from prod builds
- `@pixi/ui` works alongside existing `@pixi/layout`

## Lifecycle Management with Disposable Pattern

Every UI component implements `Disposable` with explicit cleanup:

```typescript
export interface Disposable {
  dispose(): void;
}

export class DisposableRegistry {
  private readonly items: Disposable[] = [];

  register<T extends Disposable>(item: T): T {
    this.items.push(item);
    return item;
  }

  disposeAll(): void {
    for (const item of this.items) {
      item.dispose();
    }
    this.items.length = 0;
  }
}
```

**Usage in Game class:**
- Create registries per UI context (e.g., `pauseUI`, `settingsUI`)
- On state exit: `registry.disposeAll()`
- PixiJS cleanup: remove from parent, call destroy(), null refs

## Dev vs Prod Separation

Use Vite's built-in detection with dynamic imports:

```typescript
export const IS_DEV = import.meta.env.DEV;

export async function initDevTools(game: Game): Promise<Disposable | null> {
  if (!IS_DEV) return null;

  const { createDevPane } = await import('./tweakpane');
  return createDevPane(game);
}
```

This tree-shakes all dev code from production builds.

## Tweakpane Integration

Group controls into logical folders:

```typescript
export function createDevPane(game: Game): Disposable {
  const pane = new Pane({ title: 'Game Dev', expanded: false });
  pane.hidden = true;  // Hidden by default

  // Viewport folder
  pane.addFolder({ title: 'Viewport' })
    .addBinding(viewport, 'scale', { min: 0.5, max: 2, step: 0.1 });

  // Physics folder
  pane.addFolder({ title: 'Physics' })
    .addBinding(CONFIG, 'thrust', { min: 100, max: 800 })
    .addBinding(CONFIG, 'maxSpeed', { min: 100, max: 500 })
    .addBinding(CONFIG, 'damping', { min: 0.9, max: 1.0 });

  // Spawn controls with action button
  pane.addFolder({ title: 'Spawning' })
    .addBinding(game, 'currentWave', { min: 1, max: 20, step: 1 })
    .addButton({ title: 'Spawn Wave' }).on('click', () => game.spawnWave());

  // Time scale
  pane.addBinding(game.clock, 'scale', { min: 0.1, max: 2, label: 'Time Scale' });

  // Keybind toggle (` or Cmd+Shift+T)
  const handleKey = (e: KeyboardEvent) => { /* toggle pane.hidden */ };
  window.addEventListener('keydown', handleKey);

  return {
    dispose: () => {
      window.removeEventListener('keydown', handleKey);
      pane.dispose();
    }
  };
}
```

## Pause System

- Pause state blocks `fixedUpdate()`, not `render()`
- Use overlay layer for pause UI (above game, below dev tools)
- ESC toggles pause
- Restart: `world.reset()`, respawn entities, unpause

```typescript
togglePause(): void {
  this.paused = !this.paused;
  if (this.paused) {
    const screen = new PauseScreen({
      width: this.viewport.width,
      height: this.viewport.height,
      onRestart: () => this.restart(),
    });
    this.layers.overlay.addChild(screen.container);
    this.pauseUI.register(screen);
  } else {
    this.pauseUI.disposeAll();
  }
}

private fixedUpdate(): void {
  if (this.paused) return;
  // ... rest unchanged
}
```

## Keybind Settings

Store in localStorage with "press key to bind" UI:

```typescript
export interface KeybindConfig {
  thrust: string;      // default: 'KeyW'
  brake: string;       // default: 'KeyS'
  rotateLeft: string;  // default: 'KeyA'
  rotateRight: string; // default: 'KeyD'
}

const STORAGE_KEY = 'gamename:keybinds';
const DEFAULTS: KeybindConfig = {
  thrust: 'KeyW', brake: 'KeyS', rotateLeft: 'KeyA', rotateRight: 'KeyD'
};

export function loadKeybinds(): KeybindConfig {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : DEFAULTS;
}

export function saveKeybinds(config: KeybindConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}
```

Input system reads from config instead of hardcoded keys.

## Standard Keybinds

| Key | Action | Module |
|-----|--------|--------|
| `` ` `` | Toggle Tweakpane | tweakpane.ts |
| `Cmd+Shift+T` | Toggle Tweakpane | tweakpane.ts |
| `Shift+`` | Toggle Stats | stats.ts |
| `Cmd+Shift+S` | Toggle Stats | stats.ts |
| `ESC` | Toggle Pause | game.ts |
| `Cmd+,` | Open Settings | game.ts |

## Design Checklist

When implementing dev tools and UI:

- [ ] Define Disposable interface with `dispose()` method
- [ ] Create DisposableRegistry for batch cleanup
- [ ] Hook cleanup into game state transitions (pause, restart, destroy)
- [ ] PixiJS objects: remove from parent, call destroy(), null refs
- [ ] Use `import.meta.env.DEV` for dev mode detection
- [ ] Dynamic import dev-only deps (tree-shakes from prod)
- [ ] Dev tools hidden by default, toggled via keybind
- [ ] Store keybinds in localStorage with fallback defaults
- [ ] Each module owns its keybinds, cleans up in dispose()
- [ ] Document all keybinds

## Key Decisions to Ask

1. **UI framework**: @pixi/ui, HTML overlay, or hand-rolled?
2. **Dev mode detection**: Vite env, custom var, or URL param?
3. **Tweakpane scope**: Minimal, tuning, or full debug?
4. **Lifecycle strictness**: Explicit dispose, ref counting, or scene-based?
5. **Keybind approach**: Presets, JSON edit, or press-to-bind?
