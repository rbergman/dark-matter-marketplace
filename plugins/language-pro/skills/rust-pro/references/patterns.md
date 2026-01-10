# Rust Patterns Reference

## Error Handling

### Custom Error Types with thiserror

```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum GameError {
    #[error("Entity {0} not found")]
    EntityNotFound(u64),

    #[error("Invalid state transition from {from} to {to}")]
    InvalidTransition { from: String, to: String },

    #[error("Resource exhausted: {0}")]
    ResourceExhausted(String),

    #[error(transparent)]
    Io(#[from] std::io::Error),
}

pub type Result<T> = std::result::Result<T, GameError>;
```

### Result Propagation

```rust
// GOOD: Use ? for propagation
fn process_entity(id: u64) -> Result<Entity> {
    let raw = load_from_disk(id)?;
    let parsed = parse_entity(&raw)?;
    validate_entity(&parsed)?;
    Ok(parsed)
}

// BAD: unwrap/expect
fn process_entity_bad(id: u64) -> Entity {
    let raw = load_from_disk(id).unwrap(); // NEVER
    parse_entity(&raw).expect("parse failed") // NEVER
}
```

## Ownership Patterns

### Builder Pattern

```rust
#[derive(Default)]
pub struct ProbeBuilder {
    faction: Option<FactionId>,
    archetype: Option<ProbeArchetype>,
    health: f32,
    speed: f32,
}

impl ProbeBuilder {
    pub fn new() -> Self {
        Self::default()
    }

    #[must_use]
    pub fn faction(mut self, faction: FactionId) -> Self {
        self.faction = Some(faction);
        self
    }

    #[must_use]
    pub fn archetype(mut self, archetype: ProbeArchetype) -> Self {
        self.archetype = Some(archetype);
        self
    }

    pub fn build(self) -> Result<Probe> {
        let faction = self.faction.ok_or(GameError::MissingField("faction"))?;
        let archetype = self.archetype.ok_or(GameError::MissingField("archetype"))?;

        Ok(Probe {
            faction,
            archetype,
            health: self.health,
            speed: self.speed,
        })
    }
}
```

### Newtype Pattern

```rust
// Type-safe IDs prevent mixing up different ID types
#[derive(Clone, Copy, PartialEq, Eq, Hash, Debug)]
pub struct ProbeId(u64);

#[derive(Clone, Copy, PartialEq, Eq, Hash, Debug)]
pub struct FactionId(u32);

#[derive(Clone, Copy, PartialEq, Eq, Hash, Debug)]
pub struct SystemId(u32);

// Can't accidentally pass ProbeId where FactionId expected
fn get_faction(id: FactionId) -> Option<Faction> { ... }
```

### Type State Pattern

```rust
// Connection states as zero-sized types
pub struct Disconnected;
pub struct Connected;
pub struct Authenticated;

pub struct Client<State> {
    address: String,
    _state: std::marker::PhantomData<State>,
}

impl Client<Disconnected> {
    pub fn new(address: String) -> Self {
        Self { address, _state: std::marker::PhantomData }
    }

    pub fn connect(self) -> Result<Client<Connected>> {
        // ... connection logic
        Ok(Client { address: self.address, _state: std::marker::PhantomData })
    }
}

impl Client<Connected> {
    pub fn authenticate(self, token: &str) -> Result<Client<Authenticated>> {
        // ... auth logic
        Ok(Client { address: self.address, _state: std::marker::PhantomData })
    }
}

impl Client<Authenticated> {
    pub fn send_command(&self, cmd: Command) -> Result<Response> {
        // Only authenticated clients can send commands
    }
}
```

## Iterator Patterns

### Functional Transformations

```rust
// GOOD: Iterator chains
let total_damage: f32 = probes
    .iter()
    .filter(|p| p.archetype == ProbeArchetype::Reaper)
    .filter(|p| p.faction == target_faction)
    .map(|p| p.damage * p.mutation_bonus())
    .sum();

// BAD: Manual loop
let mut total_damage = 0.0;
for probe in &probes {
    if probe.archetype == ProbeArchetype::Reaper {
        if probe.faction == target_faction {
            total_damage += probe.damage * probe.mutation_bonus();
        }
    }
}
```

### Custom Iterators

```rust
pub struct NeighborIter<'a> {
    spatial_hash: &'a SpatialHash,
    center: Vec2,
    radius: f32,
    current_cell: (i32, i32),
    cell_index: usize,
}

impl<'a> Iterator for NeighborIter<'a> {
    type Item = Entity;

    fn next(&mut self) -> Option<Self::Item> {
        // ... iteration logic
    }
}
```

## Trait Patterns

### Extension Traits

```rust
// Add methods to foreign types
pub trait Vec2Ext {
    fn distance_squared(&self, other: &Vec2) -> f32;
    fn normalize_or_zero(&self) -> Vec2;
}

impl Vec2Ext for Vec2 {
    fn distance_squared(&self, other: &Vec2) -> f32 {
        let dx = self.x - other.x;
        let dy = self.y - other.y;
        dx * dx + dy * dy
    }

    fn normalize_or_zero(&self) -> Vec2 {
        let len = self.length();
        if len > 0.0 {
            *self / len
        } else {
            Vec2::ZERO
        }
    }
}
```

### Trait Objects vs Generics

```rust
// Use generics when you need:
// - Maximum performance (monomorphization)
// - Compile-time guarantees
// - Type-specific behavior

fn process_all<T: Processable>(items: &[T]) {
    for item in items {
        item.process();
    }
}

// Use trait objects when you need:
// - Heterogeneous collections
// - Runtime polymorphism
// - Reduced binary size

fn process_mixed(items: &[Box<dyn Processable>]) {
    for item in items {
        item.process();
    }
}
```

## Concurrency Patterns

### Message Passing

```rust
use std::sync::mpsc;

enum GameEvent {
    ProbeSpawned(ProbeId),
    CombatResolved { attacker: ProbeId, defender: ProbeId, damage: f32 },
    GateSevered(GateId),
}

fn spawn_event_processor() -> mpsc::Sender<GameEvent> {
    let (tx, rx) = mpsc::channel();

    std::thread::spawn(move || {
        while let Ok(event) = rx.recv() {
            match event {
                GameEvent::ProbeSpawned(id) => { /* ... */ }
                GameEvent::CombatResolved { attacker, defender, damage } => { /* ... */ }
                GameEvent::GateSevered(id) => { /* ... */ }
            }
        }
    });

    tx
}
```

### Parallel Iteration with Rayon

```rust
use rayon::prelude::*;

// Parallel map
let results: Vec<_> = probes
    .par_iter()
    .map(|p| expensive_calculation(p))
    .collect();

// Parallel filter + map
let reapers: Vec<_> = probes
    .par_iter()
    .filter(|p| p.archetype == ProbeArchetype::Reaper)
    .map(|p| p.clone())
    .collect();
```

## Testing Patterns

### Property-Based Testing

```rust
#[cfg(test)]
mod tests {
    use proptest::prelude::*;

    proptest! {
        #[test]
        fn spatial_hash_finds_inserted(x in -1000.0f32..1000.0, y in -1000.0f32..1000.0) {
            let mut hash = SpatialHash::new(100.0);
            let entity = Entity::from_raw(42);
            let pos = Vec2::new(x, y);

            hash.insert(entity, pos);

            let found = hash.query_radius(pos, 1.0);
            prop_assert!(found.contains(&entity));
        }
    }
}
```

### Test Fixtures

```rust
#[cfg(test)]
mod tests {
    fn create_test_probe() -> Probe {
        Probe {
            id: ProbeId(1),
            faction: FactionId(1),
            archetype: ProbeArchetype::Harvester,
            health: 100.0,
            ..Default::default()
        }
    }

    fn create_test_world() -> World {
        let mut world = World::new();
        // ... setup
        world
    }

    #[test]
    fn probe_takes_damage() {
        let mut probe = create_test_probe();
        probe.take_damage(25.0);
        assert_eq!(probe.health, 75.0);
    }
}
```
