---
name: audio-design
description: >
  Use when designing how audio communicates game state, creates emotion, and serves as a
  feedback system. Activate for sound effect design, adaptive music systems, spatial audio,
  ambient soundscapes, audio priority and ducking, emotional audio design, and audio
  accessibility. Also activate when audio feels disconnected from gameplay, when players
  routinely play on mute (a design failure signal), when evaluating whether the audio stack
  has appropriate layering and variation, or when planning how music responds to gameplay
  context. This skill treats audio as a design system — not audio engineering or production,
  but the intentional design of what players hear, when, and why. Covers the full audio
  stack from music and ambience through sound effects, UI audio, and voice.
---

# Audio Design

Audio is the fastest feedback channel in a game. Players process sound faster than
visual information — audio tells them what is happening before they see it, behind
them, and outside their field of view. A game where players mute the audio and lose
nothing has failed at audio design.

This skill covers audio as a **design system**: deciding what sounds exist, when they
play, how they relate to gameplay state, and how they serve the player's understanding
of the game world. Production concerns (recording, mastering, compression formats) are
out of scope.

---

## When to Activate

- Designing sound effects for player actions, enemies, or environment
- Building adaptive music systems that respond to gameplay
- Planning spatial audio for directional awareness and immersion
- Creating ambient soundscapes that establish atmosphere
- Diagnosing why audio feels disconnected from gameplay
- Noticing that players routinely play on mute
- Adding audio accessibility features
- Evaluating audio feedback coverage across game systems
- Balancing the audio mix and priority system

---

## Core Principle: Audio as Information System

Sound is not decoration — it is an information channel that operates independently from
the visual field. Design audio with the same rigor applied to any other game system.

**What audio communicates that visuals cannot:**

| Advantage | Example |
|---|---|
| 360-degree awareness | Footsteps behind the player |
| Off-screen events | Explosion around a corner |
| Anticipation/warning | Audio wind-up before an attack lands |
| Emotional context | Minor-key shift signaling danger |
| Confirmation | Satisfying click confirming a successful action |
| Pacing | Tempo change signaling urgency |

**The mute test:** If a player can play the game on mute with no loss of information or
enjoyment, the audio design is not carrying its weight. Every audio element should either
convey information, create emotion, or both. Purely decorative audio that does neither is
wasted bandwidth in the mix.

---

## The Audio Stack

Audio architecture uses independent layers, each serving a distinct purpose. Every layer
must be independently controllable — players need per-layer volume sliders, not just a
master volume knob.

### Layer 1: Music

**Purpose:** Emotional context, tension management, pacing.

Music tells the player how to *feel* about what is happening. It operates on slower
timescales than other audio — setting mood across minutes rather than reacting frame by
frame.

- Establishes emotional tone for areas, encounters, and story beats
- Manages tension arcs (build, sustain, release)
- Creates anticipation for events that have not happened yet
- Signals safety or danger before the player has evidence

### Layer 2: Ambience

**Purpose:** Spatial context, atmosphere, world presence.

Ambience is the audio foundation that makes a space feel real. Without it, environments
feel sterile regardless of visual quality.

- Area-specific ambient beds (forest, cave, city, dungeon)
- Time-of-day variation (dawn chorus, night insects)
- Weather audio (rain, wind, thunder)
- Incidental environmental sounds (distant bird, creaking wood)

### Layer 3: Sound Effects

**Purpose:** Game state feedback, player action confirmation.

Sound effects are the primary feedback channel for moment-to-moment gameplay. They confirm
actions, communicate results, and signal state changes.

- Player action sounds (attack, jump, dash, interact)
- Impact and result sounds (hit, miss, block, break)
- Enemy feedback (telegraph, attack, damage, death)
- Environmental interaction (doors, switches, pickups)

### Layer 4: UI Audio

**Purpose:** Interface feedback, notifications, system communication.

UI audio confirms interface actions and draws attention to important system events. It
should be clean, consistent, and never fatiguing.

- Menu navigation (hover, select, back, error)
- HUD notifications (low health, buff applied, cooldown ready)
- Achievement and progression sounds
- Inventory and crafting feedback

### Layer 5: Voice

**Purpose:** Dialogue, barks, callouts, narrative delivery.

Voice is the most attention-demanding audio layer. When voice plays, everything else
should defer.

- Story dialogue and cutscene speech
- Companion/NPC barks (contextual one-liners)
- Combat callouts (enemy spotted, low ammo, revive request)
- Tutorial and hint voiceover

---

## Sound Effect Design

Every significant player action needs an audio response. Missing audio feedback creates
a disconnect that players feel even if they cannot articulate it.

### Feedback Principles

**Match visual weight.** A massive explosion with a thin pop sound creates cognitive
dissonance. A small UI toggle with a booming thud feels wrong. Audio and visual weight
must be proportional.

**Immediate onset.** Audio feedback should begin within 1–2 frames of the corresponding
visual onset. The perception-action cycle depends on audio and visual alignment — see
**game-feel** for timing reference tables. Late audio feels sluggish; early audio feels
disconnected.

**Priority ordering:**

| Priority | Category | Rationale |
|---|---|---|
| 1 | Player actions | The player must hear confirmation of their own inputs |
| 2 | Enemy feedback | Threats need clear audio communication |
| 3 | Environment | World interaction supports immersion |
| 4 | Ambience | Atmosphere fills gaps but yields to gameplay |

### Variation

Any sound that plays more than twice within a 10-second window needs at minimum 3
variants. Repetition fatigue is one of the fastest ways to make audio annoying.

**Variation techniques:**

- **Pitch randomization:** ±5–15% pitch shift on each play (cheap, effective)
- **Alternate clips:** 3–5 recorded or synthesized variants, round-robin or random
- **Layered randomization:** Randomize individual layers of a composite sound
- **Velocity scaling:** Vary volume and EQ based on action intensity

### Layering Complex Sounds

Complex actions deserve composite audio built from multiple layers:

```
Sword hit = impact layer + material layer + environment layer
         = [metal clang]  + [flesh thud]   + [room reverb tail]
```

Each layer can be swapped independently — the same impact with a different material
layer communicates hitting stone vs. wood vs. armor.

---

## Adaptive Music System

Static music that ignores gameplay state is a missed opportunity. Music should respond
to what the player is experiencing.

### Music States

Define discrete music states tied to gameplay context:

| State | Character | Typical Triggers |
|---|---|---|
| Exploration | Calm, open, melodic | No threats, traversal, discovery |
| Tension | Building, uneasy, rhythmic | Threat proximity, low resources, time pressure |
| Combat | Intense, driving, percussive | Active combat engagement |
| Resolution | Release, exhale, thinning layers | Combat end, threat eliminated |
| Victory | Triumphant, ascending, major key | Boss defeat, objective complete |
| Defeat | Somber, descending, sparse | Player death, mission failure |

### Transition Techniques

| Technique | Description | Best For |
|---|---|---|
| Crossfade | Blend out current, blend in next | Gradual mood shifts |
| Stinger-to-track | Short musical hit bridges to new track | Sudden state changes |
| Horizontal re-sequencing | Same tempo, swap musical layers | Intensity changes within a state |
| Vertical layering | Add/remove instrument layers | Smooth intensity scaling |

### Intensity Layers

The most flexible adaptive music approach uses vertical layering:

- **Base layer** always plays (establishes key, tempo, harmonic foundation)
- **Layer 2** adds rhythmic drive (percussion, bass patterns)
- **Layer 3** adds melodic tension (strings, synth leads)
- **Layer 4** adds full intensity (full orchestra, heavy percussion)

Layers add or remove based on a gameplay intensity value (0.0–1.0). This produces
smooth, musically coherent transitions because all layers share tempo and key.

### Timing and Silence

- **Never cut music abruptly.** Always transition through a musical phrase boundary
  (beat, bar, or phrase end). Abrupt cuts sound like bugs.
- **Silence is a design tool.** Strategic silence after intense music makes the next
  sound dramatically more impactful. The contrast between presence and absence is one
  of the most powerful tools in audio design.
- **The earned silence technique:** After sustained high-intensity music, insert a
  brief window of silence (1–3 seconds) before resolution music begins. The silence
  functions as an emotional exhale.

---

## Spatial Audio

Sound in physical space provides directional information that the visual field cannot.
In any game with combat or threats, players should be able to locate dangers by audio
alone.

### Directional Design

- **Stereo panning** at minimum: sounds shift left/right based on source position
- **HRTF (head-related transfer function)** for full 3D positioning when supported
- **Front/back differentiation:** Subtle high-frequency filtering for sounds behind
  the listener
- **Vertical positioning** for games with significant height variation

### Distance Modeling

Distance affects more than just volume:

| Distance | Volume | Frequency Content | Character |
|---|---|---|---|
| Close (0–5m) | Full | Full spectrum | Detailed, present |
| Medium (5–20m) | Reduced | High-frequency rolloff begins | Clear but receding |
| Far (20–50m) | Low | Significant HF loss | Muffled, ambient |
| Distant (50m+) | Minimal | Low frequencies only | Atmospheric, rumble |

### Occlusion and Obstruction

- **Occlusion** (full obstruction): Sound through a wall — heavy low-pass filtering,
  significant volume reduction
- **Obstruction** (partial blocking): Sound around a corner — moderate filtering,
  less volume reduction
- **Transmission** varies by material: wood transmits more than stone, glass more
  than metal

### Environment Acoustics

Reverb and reflection communicate space:

| Environment | Reverb Character | Decay Time |
|---|---|---|
| Small room | Tight, short reflections | 0.3–0.8s |
| Large hall | Wide, diffuse | 1.5–3.0s |
| Cave | Dense, colored | 2.0–5.0s |
| Outdoor open | Minimal reverb, natural echo | 0.1–0.5s |
| Underwater | Heavy low-pass, long decay | 3.0–6.0s |

**Design rule:** In any game with combat, a blindfolded player using only audio should
be able to determine threat direction and approximate distance.

---

## Audio Priority and Ducking

When many sounds compete for the player's attention, the mix becomes noise. A priority
system ensures the most important audio always cuts through.

### Priority Levels

| Priority | Examples | Mix Behavior |
|---|---|---|
| Critical | Player damage, death, critical alert | Ducks everything else |
| High | Combat impacts, dialogue, important callouts | Ducks ambient and music |
| Medium | Footsteps, environmental, UI feedback | Normal mix level |
| Low | Ambient loops, distant events, decorative | Ducked by all higher priorities |

### Ducking Rules

- **Voice always wins.** When dialogue plays, duck music and sound effects. Never
  force the player to choose between hearing dialogue and hearing gameplay.
- **Player sounds over enemy sounds.** The player's own actions take priority in the
  mix because they are the primary feedback loop.
- **Ducking depth:** Critical sounds duck others by 6–12 dB. High-priority sounds
  duck by 3–6 dB. Adjust by feel — the goal is clarity, not silence.
- **Duck speed:** Fast attack (10–50ms), slower release (100–300ms) to avoid pumping.

### Polyphony Budget

Define a maximum number of simultaneous sounds the game will play. For most games,
16–32 concurrent voices is a practical budget.

When the budget is exceeded:
1. Drop lowest-priority sounds first
2. Steal voices from sounds nearest to completion
3. Never steal from critical-priority sounds
4. Hybrid approach: soften nearly-complete low-priority sounds rather than cutting them

---

## Emotional Audio Design

Music and sound are direct emotional tools. Used intentionally, they shape how the
player feels moment to moment.

### Musical Emotion Vocabulary

| Tool | Effect | Application |
|---|---|---|
| Minor key/mode | Tension, sadness, unease | Danger zones, loss, mystery |
| Major key/mode | Triumph, safety, joy | Victory, home areas, discovery |
| Tempo increase | Urgency, excitement, anxiety | Chase sequences, time pressure |
| Tempo decrease | Calm, contemplation, dread | Safe zones, ominous slow build |
| Dissonance | Wrongness, horror, instability | Corruption, madness, glitch |
| Drone/pad sustain | Sustained tension, unease | Ambient threat, anticipation |

These are simplified associations — context and execution matter more than formula. A
major-key piece at slow tempo can be deeply melancholic. Use these as starting points,
not rules.

### Punctuation: Stingers

Short musical hits that mark significant moments:

- **Discovery stinger:** A bright, ascending phrase when the player finds something
- **Achievement stinger:** A triumphant brass or synth hit on milestone completion
- **Failure stinger:** A descending, minor phrase on death or mission failure
- **Danger stinger:** A sharp, dissonant hit when a new threat appears

Stingers should be brief (0.5–2 seconds) and distinctive enough to be recognizable
after a few exposures.

### Leitmotif and Audio Memory

Recurring musical themes create emotional associations over time:

- Assign a short melodic motif to key characters, locations, or concepts
- Reintroduce the motif in variations (different instrumentation, key, tempo)
- Players build unconscious associations — hearing the motif triggers the emotion
  of its original context
- Use this intentionally: a villain's motif played softly in a peaceful scene
  creates unease without any visual cue

### The Earned Silence Technique

After sustained intensity (30+ seconds of high-energy music and dense SFX):
1. Music fades or stops
2. Sound effects thin to near-silence (1–3 seconds)
3. A single meaningful sound breaks the silence (resolution chord, environmental
   detail, character breath)
4. New music state begins

The silence amplifies whatever follows it. This technique is most powerful when used
sparingly — if every combat ends with silence, it loses impact.

---

## Audio for Accessibility

Audio design must account for players with varying hearing ability. Reference
**accessibility-design** for the complete accessibility framework — this section
covers audio-specific measures.

### Visual Sound Indicators

- Directional indicators showing where sounds originate (on-screen arrows or arcs)
- Type-based icons distinguishing threat sounds from ambient sounds
- Intensity visualization showing relative loudness or urgency
- These indicators should be optional, not forced on all players

### Subtitle and Caption System

- **Subtitles** for all dialogue (speaker identification, text)
- **Closed captions** for significant non-dialogue sounds: [footsteps approaching],
  [explosion in distance], [alarm sounding]
- Configurable text size, background opacity, and speaker colors
- Positional information in captions when relevant: [gunfire — left]

### Audio Settings

- **Per-layer volume controls:** Music, SFX, Voice, Ambience, UI — at minimum
- **Master volume** as a convenience, not a replacement for per-layer
- **Mono audio option** for players with single-sided hearing loss
- **Audio description option** for visual events (narrated description of important
  visuals during gameplay pauses or cutscenes)
- Settings should be available before gameplay begins, not locked behind a menu
  that requires playing first

---

## Audio Health Check

Use this checklist when evaluating a game's audio design:

### Feedback Coverage
- [ ] Every significant player action has immediate audio feedback
- [ ] Audio weight matches visual weight across all actions
- [ ] Audio onset is within 1–2 frames of visual onset

### Spatial Awareness
- [ ] Players can identify threat direction by audio alone
- [ ] Distance attenuation includes frequency content change, not just volume
- [ ] Occlusion and environment acoustics are modeled

### Music System
- [ ] Music changes state in response to gameplay context
- [ ] Transitions use musical phrase boundaries, not hard cuts
- [ ] There is strategic use of silence

### Variation and Mix
- [ ] Frequently repeated sounds have 3+ variants
- [ ] Audio priority system prevents cacophony in busy scenes
- [ ] Polyphony budget is defined and enforced
- [ ] Voice always ducks music and SFX

### Accessibility
- [ ] Per-layer volume controls are available
- [ ] Visual sound indicators exist for directional audio
- [ ] Subtitle/caption system covers dialogue and important sounds
- [ ] Mono audio option is available

### The Mute Test
- [ ] Game is still playable on mute (visual redundancy exists)
- [ ] Game loses meaningful information or emotion on mute (audio is carrying weight)

Both mute-test items should pass. The first ensures accessibility; the second confirms
the audio design is contributing real value.

---

## Anti-Patterns

| Anti-Pattern | Problem | Fix |
|---|---|---|
| Uniform volume | Everything equally loud — no hierarchy, just noise | Implement priority and ducking system |
| Missing action feedback | Player acts but hears nothing — feels unresponsive | Audit all player actions for audio coverage |
| Static music | Music ignores gameplay state — emotionally disconnected | Implement adaptive music with state transitions |
| Repetition fatigue | Same sound plays unchanged hundreds of times | Add 3+ variants, pitch randomization |
| Audio-only critical info | Essential information has no visual backup | Add visual redundancy for all critical audio |
| Fighting the mix | Too many sounds at full volume simultaneously | Enforce polyphony budget and priority ducking |
| Abrupt music cuts | Music stops mid-phrase on state change — sounds broken | Transition at phrase boundaries, use crossfades |
| No silence | Constant wall of sound with no breathing room | Design intentional quiet moments between intensity |
| One volume slider | Only master volume, no per-layer control | Provide per-layer sliders (music, SFX, voice, ambience) |

---

## Cross-References

- **game-feel** — Feedback layers and timing tables; audio onset timing within the
  perception-action cycle
- **encounter-design** — Spatial awareness requirements; audio cues for threat
  positioning and encounter pacing
- **accessibility-design** — Complete accessibility framework; audio accessibility
  sits within broader inclusive design
- **experience-design** — Emotion design and pacing arcs; audio is a primary tool
  for both
- **player-ux** — Perception pillars; audio as a channel in the player's information
  processing model
- **narrative-design** — Dialogue systems, voice acting, and how audio serves story
  delivery
