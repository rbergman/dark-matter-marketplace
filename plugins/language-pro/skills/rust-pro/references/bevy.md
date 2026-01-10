# Bevy ECS Patterns

Game development patterns for the Bevy engine. Apply these when working on Bevy projects.

## Core Concepts

- **Components** are data, **Systems** are behavior
- Prefer composition over complex component hierarchies
- Use Bevy's change detection to avoid unnecessary work

## Query Patterns

```rust
// Read-only query
fn display_health(query: Query<&Health, With<Player>>) {
    for health in &query {
        info!("Player health: {}", health.current);
    }
}

// Mutable query
fn damage_enemies(mut query: Query<&mut Health, With<Enemy>>) {
    for mut health in &mut query {
        health.current -= 10;
    }
}

// Multiple components
fn update_positions(mut query: Query<(&Velocity, &mut Transform)>) {
    for (velocity, mut transform) in &mut query {
        transform.translation += velocity.0;
    }
}
```

## Resources

```rust
// Shared immutable resource
fn check_game_state(state: Res<GameState>) {
    if state.is_paused {
        return;
    }
}

// Mutable resource
fn update_score(mut score: ResMut<Score>, events: EventReader<ScoreEvent>) {
    for event in events.read() {
        score.value += event.points;
    }
}
```

## Commands (Entity/Component Changes)

```rust
fn spawn_enemy(mut commands: Commands, assets: Res<GameAssets>) {
    commands.spawn((
        Enemy,
        Health { current: 100, max: 100 },
        SpriteBundle {
            texture: assets.enemy_sprite.clone(),
            ..default()
        },
    ));
}

fn despawn_dead(mut commands: Commands, query: Query<(Entity, &Health)>) {
    for (entity, health) in &query {
        if health.current <= 0 {
            commands.entity(entity).despawn_recursive();
        }
    }
}
```

## Events

```rust
// Define event
#[derive(Event)]
struct DamageEvent {
    target: Entity,
    amount: u32,
}

// Send events
fn attack_system(mut events: EventWriter<DamageEvent>, /* ... */) {
    events.send(DamageEvent { target, amount: 10 });
}

// Receive events
fn damage_system(
    mut events: EventReader<DamageEvent>,
    mut query: Query<&mut Health>,
) {
    for event in events.read() {
        if let Ok(mut health) = query.get_mut(event.target) {
            health.current = health.current.saturating_sub(event.amount);
        }
    }
}
```

## Change Detection

```rust
// Only process changed components
fn on_health_changed(query: Query<&Health, Changed<Health>>) {
    for health in &query {
        info!("Health changed to: {}", health.current);
    }
}

// Detect newly added components
fn on_enemy_spawned(query: Query<Entity, Added<Enemy>>) {
    for entity in &query {
        info!("New enemy: {:?}", entity);
    }
}
```

## Plugin Organization

```rust
pub struct CombatPlugin;

impl Plugin for CombatPlugin {
    fn build(&self, app: &mut App) {
        app
            .add_event::<DamageEvent>()
            .add_systems(Update, (
                attack_system,
                damage_system.after(attack_system),
                death_system.after(damage_system),
            ));
    }
}
```

## Derive Macros

```rust
#[derive(Component)]
struct Health {
    current: u32,
    max: u32,
}

#[derive(Resource, Default)]
struct GameState {
    score: u32,
    is_paused: bool,
}

#[derive(Component, Default)]
#[require(Transform, Visibility)]  // Bevy 0.15+
struct Player;
```
