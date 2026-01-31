# Visual Design System

Modern retro/vector aesthetic inspired by Geometry Wars, Asteroids, Tempest, and Tron.

---

## Design Principles

### 1. GLOW
Everything emits light. Lines are energy, not matter. The screen should feel like a phosphor display or oscilloscope—bright vectors against infinite darkness.

### 2. CONTRAST
Pure black void vs vivid neon. No middle ground. The background is #000000, always. Objects pop by their brightness, not their color complexity.

### 3. MOTION
Trails, particles, pulses. Nothing is static. Even idle objects should breathe or shimmer subtly. Movement creates life.

### 4. HIERARCHY
Brightness = importance. Player is brightest, UI elements next, enemies after, debris dimmest. Players should be able to find themselves instantly in chaos.

### 5. FEEDBACK
Every action has visible consequence. Shots produce muzzle flash. Hits spray particles. Deaths explode. Pickups pulse before collection.

---

## Color Palette

### Primary Palette

```typescript
const Colors = {
  // Void - The infinite darkness
  background: 0x000000,

  // Player - Cyan/White (brightest, most important)
  playerCore: 0xffffff,
  playerGlow: 0x00ffff,
  playerTrail: 0x00ccff,

  // Hazards - Orange/Amber (warm, terrestrial)
  hazardPrimary: 0xffaa00,
  hazardSecondary: 0xff6600,
  hazardGlow: 0xff8800,

  // Rewards - Green (life, growth, positive)
  rewardCore: 0x00ff00,
  rewardGlow: 0x88ff88,
  rewardPulse: 0x44ff44,

  // Enemies - Red spectrum (danger, aggression)
  enemyPrimary: 0xff0044,
  enemySecondary: 0xff6600,
  enemyGlow: 0xff2266,

  // UI - Cyan (matches player, information)
  uiPrimary: 0x00ffff,
  uiSecondary: 0x0088ff,
  uiDanger: 0xff0000,
  uiSuccess: 0x00ff00,
  uiWarning: 0xffaa00,

  // Neutral - Grays for debris, inactive elements
  neutralBright: 0x888888,
  neutralDim: 0x444444,
  neutralDark: 0x222222,
};
```

### Color Usage Rules

| Entity Type | Core Color | Glow Color | Brightness |
|-------------|------------|------------|------------|
| Player | White | Cyan | 100% |
| Player projectiles | Cyan | Blue | 90% |
| Enemies | Red | Orange-red | 70% |
| Enemy projectiles | Orange | Red | 80% |
| Hazards | Orange | Amber | 60% |
| Rewards | Green | Light green | 85% |
| Debris | Gray | None | 30% |
| UI | Cyan | None | 75% |

---

## Line Weights

```typescript
const LineWeight = {
  hairline: 1,     // Fine detail, grids, faint trails
  thin: 1.5,       // Secondary details, UI elements
  normal: 2,       // Standard entity outlines
  bold: 3,         // Important entities, player
  heavy: 4,        // Major elements, boss outlines
};
```

### Line Weight Guidelines

- Player ship: `bold` (3px) outline
- Standard enemies: `normal` (2px) outline
- Projectiles: `thin` (1.5px) outline
- Particles: `hairline` (1px)
- UI borders: `thin` (1.5px)
- Boss entities: `heavy` (4px)

---

## Entity Design Rules

### Silhouette First
Each entity type must have a **unique silhouette** recognizable at a glance. In chaotic combat, players rely on shape recognition, not color.

- Player ship: Angular with distinct cockpit and engine
- Enemies: Each type gets unique shape (arrow, diamond, hexagon, etc.)
- Projectiles: Small, directional (player vs enemy differentiated)
- Pickups: Circular or organic shapes (contrast with angular combat)

### Internal Detail
Don't use simple vanilla polygons. Add **internal detail lines** to create visual interest:

```typescript
// BAD: Plain triangle
graphics.poly([0, -20, 15, 15, -15, 15]).stroke({ width: 2, color: 0x00ffff });

// GOOD: Triangle with cockpit and engine details
graphics
  .poly([0, -20, 15, 15, -15, 15])
  .stroke({ width: 3, color: 0x00ffff })
  // Cockpit
  .moveTo(0, -10).lineTo(5, 5).lineTo(-5, 5).lineTo(0, -10)
  .stroke({ width: 1.5, color: 0x00ffff })
  // Engine section
  .moveTo(-8, 15).lineTo(-8, 10)
  .moveTo(8, 15).lineTo(8, 10)
  .stroke({ width: 1.5, color: 0x0088ff });
```

### Pulsing for Volatility
Volatile entities (bombs, charging enemies, expiring powerups) should **pulse** to indicate danger or urgency:

```typescript
// Pulse alpha between 0.5 and 1.0
const pulse = 0.75 + Math.sin(time * 8) * 0.25;
graphics.alpha = pulse;

// Or pulse scale
const scaleBase = 1.0;
const scalePulse = 1.0 + Math.sin(time * 6) * 0.1;
graphics.scale.set(scaleBase * scalePulse);
```

---

## Glow Implementation

### Per-Layer Blur (Performance)
Apply BlurFilter to entire layers, not individual objects:

```typescript
// Create glow layer
const glowLayer = new Container();
glowLayer.filters = [new BlurFilter({ strength: 4, quality: 2 })];

// Add bright objects to glow layer
glowLayer.addChild(playerGraphics);
glowLayer.addChild(projectilesContainer);
```

### Dual-Layer Technique
For intense glow, render objects twice:

```typescript
// Base layer - sharp, full brightness
const baseLayer = new Container();
// Glow layer - blurred, slightly dimmer
const glowLayer = new Container();
glowLayer.filters = [new BlurFilter({ strength: 6, quality: 2 })];
glowLayer.alpha = 0.6;

// Each entity adds graphics to BOTH layers
const baseGraphics = createShipGraphics();
const glowGraphics = createShipGraphics();
baseLayer.addChild(baseGraphics);
glowLayer.addChild(glowGraphics);
```

### Performance Note
BlurFilter is GPU-intensive. Use sparingly:
- Max 2-3 blur layers
- Keep quality at 2-3 (not higher)
- Reduce strength on lower-end devices

---

## Particles

### Visual Roles

| Particle Type | Purpose | Lifetime | Count |
|---------------|---------|----------|-------|
| Thrust | Player movement feedback | 0.1-0.3s | 2-5/frame |
| Muzzle flash | Shooting feedback | 0.05-0.1s | 3-8 burst |
| Hit sparks | Damage feedback | 0.2-0.4s | 10-20 burst |
| Explosion | Death feedback | 0.3-0.8s | 30-100 burst |
| Trail | Movement visualization | 0.2-0.5s | 1/frame |
| Ambient | Atmosphere | 2-5s | Constant background |

### Particle Properties

```typescript
interface ParticleConfig {
  // Initial state
  position: Vec2;
  velocity: Vec2;
  scale: number;
  alpha: number;
  rotation: number;

  // Rates of change
  velocityDecay: number;  // 0.95 = slow decay, 0.8 = fast
  scaleDecay: number;
  alphaDecay: number;
  rotationSpeed: number;

  // Lifetime
  lifetime: number;       // Seconds
}
```

### Use ParticleContainer for Volume
For 1000+ particles, use PixiJS 8's ParticleContainer:

```typescript
const particles = new ParticleContainer({
  dynamicProperties: {
    position: true,
    scale: true,
    rotation: false,  // Disable if not needed
    tint: false,      // Disable if not needed
    alpha: true,
  },
});

// Particles share a single texture
const particle = new Particle({
  texture: dotTexture,
  anchorX: 0.5,
  anchorY: 0.5,
});
particles.addParticle(particle);
```

---

## Screen Effects

### Screen Shake

```typescript
class ScreenShake {
  private trauma = 0;
  private readonly maxOffset = 20;
  private readonly maxAngle = 0.05;

  add(amount: number): void {
    this.trauma = Math.min(1, this.trauma + amount);
  }

  update(delta: number): void {
    if (this.trauma <= 0) return;

    const shake = this.trauma * this.trauma;  // Quadratic falloff
    const offsetX = (Math.random() * 2 - 1) * this.maxOffset * shake;
    const offsetY = (Math.random() * 2 - 1) * this.maxOffset * shake;
    const angle = (Math.random() * 2 - 1) * this.maxAngle * shake;

    gameContainer.position.set(offsetX, offsetY);
    gameContainer.rotation = angle;

    this.trauma = Math.max(0, this.trauma - delta * 2);  // Decay rate
  }
}

// Usage
screenShake.add(0.3);  // Small hit
screenShake.add(0.7);  // Big explosion
screenShake.add(1.0);  // Player death
```

### Flash Effects
Brief full-screen flash on major events:

```typescript
class ScreenFlash {
  private flash: Graphics;
  private alpha = 0;

  trigger(color: number, intensity: number): void {
    this.flash.clear().rect(0, 0, app.screen.width, app.screen.height).fill(color);
    this.alpha = intensity;
  }

  update(delta: number): void {
    this.alpha = Math.max(0, this.alpha - delta * 5);
    this.flash.alpha = this.alpha;
  }
}
```

---

## Typography

### Font Choice
Use monospace or pixel-perfect fonts for the retro aesthetic:
- System monospace as fallback
- Custom pixel font for authentic look

### Text Styling

```typescript
const uiTextStyle = {
  fontFamily: 'monospace',
  fontSize: 24,
  fill: Colors.uiPrimary,
  letterSpacing: 2,
};

const scoreTextStyle = {
  fontFamily: 'monospace',
  fontSize: 48,
  fill: Colors.playerCore,
  letterSpacing: 4,
};
```

---

## Visual Inspiration

- **Geometry Wars** - Particle-heavy, grid warping, color-coded enemies
- **Asteroids** - Clean vector lines, phosphor glow, wraparound space
- **Tempest** - Perspective tunnels, wireframe tubes, bright against black
- **Tron** - Neon trails, grid floors, cyber aesthetic

### Reference Links
- [Geometry Wars aesthetic discussion](https://www.resetera.com/threads/geometry-wars-retro-evolved-is-the-goat-and-other-arcade-retro-aesthetic-inspired-games.826773/)
- [Vector arcade history](https://bitvint.com/pages/the-rise-and-fall-of-vector-graphics)
- [Asteroids phosphor glow effect](https://arcadeblogger.com/2018/10/24/atari-asteroids-creating-a-vector-arcade-classic/)
