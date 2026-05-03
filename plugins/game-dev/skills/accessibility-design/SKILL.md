---
name: accessibility-design
description: "Use when designing any player-facing feature, evaluating a game for accessibility, responding to accessibility feedback, designing difficulty or assist options, adding subtitle/caption systems, implementing input remapping, or when a player reports they can't play. Covers the four accessibility pillars (visual, auditory, motor, cognitive), implementation tiers, colorblind design, subtitle standards, input accessibility, and testing methodology. Accessibility is a design discipline, not a post-launch checklist."
---

# Accessibility Design

**Purpose:** Make games playable by the widest possible audience through deliberate, integrated design. Accessibility isn't a feature you bolt on — it's a lens you design through. Games designed for the margins are better for everyone.

**Standards:** This skill draws on WCAG (Web Content Accessibility Guidelines), the Xbox Accessibility Guidelines (XAG), and the Game Accessibility Guidelines (gameaccessibilityguidelines.com). These represent industry consensus, not aspirational ideals — major platforms now require or incentivize compliance.

---

## When to Activate

Use this skill **proactively** — not after someone reports a problem:

- Designing any player-facing feature (UI, controls, feedback, narrative delivery)
- Evaluating an existing game or prototype for accessibility gaps
- Responding to player feedback about barriers ("I can't read the text", "I can't tell these apart")
- Designing difficulty options, assist systems, or adaptive mechanics
- Implementing subtitles, captions, or audio description systems
- Designing or reviewing input systems (remapping, sensitivity, alternate schemes)
- Planning a colorblind mode or high-contrast mode
- Reviewing a feature that uses color, sound, or timing to convey critical information
- When the answer to "can a player with [disability] complete this?" is uncertain

**When a player says "I can't play this" — that's a design failure, not a player limitation.**

---

## Core Principle: Accessibility Is Design

Accessibility features aren't accommodations for edge cases. They're design improvements that happen to be essential for some players and beneficial for all.

| "Accessibility" Feature | Who It Was "For" | Who Actually Uses It |
|------------------------|-------------------|----------------------|
| Subtitles | Deaf/hard-of-hearing players | Everyone on public transit, in noisy rooms, or with sleeping partners |
| Remappable controls | Players with motor disabilities | Everyone with a preference or non-standard controller |
| High contrast mode | Low-vision players | Everyone on a mobile screen in sunlight |
| Adjustable text size | Vision-impaired players | Everyone sitting far from a TV |
| Difficulty options | Cognitive accessibility | Everyone whose skill level doesn't match one preset |
| Motion reduction | Vestibular disorders | Everyone who gets motion sick from excessive camera shake |

This is the curb-cut effect: design for the margins and the center benefits automatically.

**Design rule:** If a feature helps 5% of players and harms 0%, ship it.

---

## The Four Pillars

Accessibility barriers organize into four categories based on the player need they address. Most games have gaps in all four — prioritize by the tiers in the next section.

### Pillar 1: Visual

Players who are blind, have low vision, are colorblind, or are photosensitive.

| Barrier | Solution | Standard |
|---------|----------|----------|
| Color-only information | Add shape, pattern, text, or position as redundant channel | WCAG 1.4.1, XAG 106 |
| Small text | Scalable text, minimum 28px at 1080p for body text | XAG 102 |
| Low contrast | 4.5:1 ratio for text, 3:1 for large UI elements | WCAG 1.4.3 (AA) |
| No screen reader support | Semantic UI structure, text alternatives for images | WCAG 1.1.1 |
| Fixed UI scale | Independent UI scaling separate from resolution | XAG 102 |
| Photosensitive content | No flashing above 3Hz, option to disable screen effects | WCAG 2.3.1 |
| Motion-intensive effects | Motion reduction toggle (camera shake, screen bob, parallax) | WCAG 2.3.3 |

### Pillar 2: Auditory

Players who are deaf, hard of hearing, or playing without sound.

| Barrier | Solution | Standard |
|---------|----------|----------|
| Audio-only critical info | Visual equivalent for every audio cue (directional indicators, alerts) | XAG 107 |
| No subtitles | Subtitle system with speaker identification | XAG 107 |
| No captions | Descriptive captions for non-speech sounds [explosion nearby] | GAG intermediate |
| Mixed audio levels | Independent volume sliders per channel (music, SFX, voice, ambient) | XAG 107 |
| Directional audio cues | Visual directional indicators (damage direction, footstep radar) | GAG advanced |
| Voice chat dependency | Text chat alternative, ping systems, visual callouts | XAG 107 |

### Pillar 3: Motor

Players with limited mobility, dexterity, or stamina — including temporary conditions (broken arm, RSI).

| Barrier | Solution | Standard |
|---------|----------|----------|
| Hardcoded controls | Full remapping for ALL inputs, no exceptions | XAG 104 |
| Hold-to-activate only | Toggle/hold option for every sustained input (sprint, aim, crouch) | XAG 104 |
| Rapid button mashing | Alternative input (hold, auto-complete, reduced threshold) | GAG intermediate |
| Precision timing | Adjustable timing windows, generous input buffers | XAG 109 |
| Complex simultaneous inputs | Simplification options, sequential alternatives | GAG advanced |
| Fixed sensitivity | Adjustable dead zones, sensitivity curves, acceleration | XAG 104 |
| No one-handed play | Alternative control schemes, copilot mode | GAG advanced |

### Pillar 4: Cognitive

Players with cognitive disabilities, learning differences, ADHD, anxiety — or anyone overwhelmed by complexity.

| Barrier | Solution | Standard |
|---------|----------|----------|
| Single difficulty preset | Multiple options, ideally granular per-parameter | XAG 109 |
| Unforgiving timing | Pauseable gameplay, adjustable game speed | XAG 109 |
| Unclear objectives | Objective markers, quest logs, waypoint systems | GAG basic |
| No save flexibility | Save anywhere, generous autosave | GAG basic |
| Unreplayable tutorials | Tutorial replay from menu, contextual hints | GAG basic |
| Information overload | Adjustable HUD density, progressive disclosure | See **player-ux** |
| Distressing content | Content warnings, option to skip/reduce intensity | GAG intermediate |
| Complex navigation | Minimap, breadcrumbs, "return to path" button | GAG intermediate |

Cognitive accessibility has the broadest overlap with general UX quality — this is where accessibility and **player-ux** (cognitive load management) directly converge.

---

## Implementation Tiers

Prioritize by ratio of players impacted to implementation cost.

### Tier 1: Must-Have (Ship Before Launch)

| Pillar | Feature | Why Tier 1 |
|--------|---------|------------|
| Visual | No color-only information | ~8-10% of males colorblind; free if designed in |
| Visual | Scalable text (min 28px at 1080p) | Large-screen and mobile players need this |
| Visual | Contrast ratios (4.5:1 text, 3:1 UI) | WCAG AA baseline |
| Visual | Motion reduction option | Vestibular disorders affect ~35% of adults over 40 |
| Motor | Remappable controls (every input) | Platform certification requirement |
| Motor | Toggle/hold for sustained inputs | Minimal cost, major RSI/mobility impact |
| Auditory | Subtitles with speaker identification | ~15% of adults have hearing loss |
| Auditory | Independent volume sliders | Standard player expectation |
| Cognitive | Difficulty options | Benefits the widest player range |
| Cognitive | Pauseable gameplay | Essential for parents, interruptions, anxiety |
| Cognitive | Clear objective/waypoint system | Reduces frustration universally |

### Tier 2: Should-Have (First Major Update)

| Pillar | Feature | Why Tier 2 |
|--------|---------|------------|
| Visual | High contrast mode | Growing platform expectation |
| Visual | Independent UI scaling | Important for complex HUDs |
| Motor | Adjustable timing windows | Major motor accessibility lever |
| Motor | One-handed control scheme | Temporary injury, one-arm holds |
| Auditory | Visual sound indicators | Essential for deaf/HoH in action games |
| Auditory | Descriptive captions | Ambient narrative for deaf/HoH |
| Cognitive | Adjustable game speed | Broad benefit; doubles as difficulty lever |
| Cognitive | Tutorial replay from menu | Low cost, high value |
| Cognitive | Content warnings | Increasingly expected; trivial to implement |

### Tier 3: Best-in-Class (Industry Leadership)

| Pillar | Feature | Notes |
|--------|---------|-------|
| Visual | Screen reader support | Requires semantic UI architecture; plan early if targeting this |
| Visual | Full audio descriptions for cutscenes | Significant production cost; high impact for blind players |
| Motor | Full input device customization (curves, macros) | Power-user feature with accessibility benefit |
| Motor | Copilot mode (two controllers, one character) | Enables assisted play; social accessibility |
| Auditory | Text-to-speech for in-game text | Leverages platform TTS APIs |
| Cognitive | Adaptive difficulty (invisible) | See **progression-systems** for implementation patterns |
| All | Comprehensive accessibility menu with previews | Let players see the effect of each option before committing |

---

## Colorblind Design

Common, frequently implemented poorly, and fixable at the design level rather than through post-hoc filters.

### Prevalence and Types

| Type | Affects | Confusion Pairs | Prevalence (Males) |
|------|---------|-----------------|-------------------|
| Protanopia/protanomaly | Red perception | Red-green, red-brown, red-orange | ~6% |
| Deuteranopia/deuteranomaly | Green perception | Green-red, green-brown, green-yellow | ~5% |
| Tritanopia/tritanomaly | Blue perception | Blue-yellow, blue-green | ~0.01% |

**Combined:** roughly 1 in 12 males and 1 in 200 females have some form of color vision deficiency.

### The Design Rule

**Never use color as the sole channel for information.** Pair every color distinction with shape, pattern, text, position, size, or brightness. Examples: team indicators use circle vs. triangle (not just red vs. blue), rarity uses border patterns (not just color tints), status effects show names (not just colored icons).

### Implementation Approaches (Worst to Best)

| Approach | Problems |
|----------|----------|
| **Hue shift** (rotate palette) | Breaks art direction, creates new conflicts |
| **Palette swap** (preset palettes) | Requires maintenance, still color-dependent |
| **Symbol overlay** (shapes on top of color) | Good redundancy, but feels bolted on |
| **Universal design** (base palette works for all) | Best — no "mode" needed, benefits everyone |

### Contrast Requirements

| Element | Minimum Ratio | Standard |
|---------|--------------|----------|
| Body text | 4.5:1 against background | WCAG AA |
| Large text (24px+ or 18px+ bold) | 3:1 against background | WCAG AA |
| UI components and graphical objects | 3:1 against adjacent colors | WCAG 1.4.11 |
| Enhanced (Tier 3 goal) | 7:1 text, 4.5:1 UI | WCAG AAA |

### Testing Colorblind Design

Simulate all three types during development using OS-level filters (macOS: Accessibility > Display > Color Filters; Windows: Color Filters). Test every screen where color conveys meaning — minimaps, rarity indicators, health bars, team colors, status effects, quest markers. If you can't distinguish two elements in simulation, players can't either.

---

## Difficulty and Assist Systems

### Difficulty Is an Access Ramp

Difficulty options are the same category of design as remappable controls — different players have different needs, and a single fixed experience excludes people. Reframe: "easy mode" → "flexible difficulty respecting player time and ability"; "assist features" → "player agency over their own experience."

### Granular > Preset

Simple Easy/Medium/Hard presets are better than nothing, but granular options give players agency over their specific barriers:

| Parameter | What It Controls | Why Separate |
|-----------|-----------------|--------------|
| Damage received | Incoming damage multiplier | Player may want challenge but bruise easily |
| Damage dealt | Outgoing damage multiplier | Player may want long fights but not impossible ones |
| Timing windows | Parry/dodge/QTE timing | Motor accessibility without changing difficulty of everything else |
| Resource scarcity | Drop rates, ammo, healing | Exploration vs. survival tension is taste, not skill |
| Enemy aggression | How often enemies attack | Pace control |
| Navigation assist | Waypoints, pathfinding hints | Cognitive load management |
| Aim assist | Auto-aim strength, snap-to-target | Motor + precision accessibility |
| Puzzle hints | Hint frequency and directness | Cognitive accessibility without skipping content |

### Content Locking

**Never lock story, areas, or abilities behind difficulty.** Achievements, cosmetics, and leaderboard eligibility are fine difficulty gates — narrative content is not.

### Adaptive Difficulty

Invisible adjustment based on player performance — the most accessible approach because it requires zero configuration. Track death frequency, completion time, and resource usage; adjust subtly (fewer spawns, wider timing windows, better drop rates). Never reveal the adaptation and always provide opt-out. See **progression-systems** for flow channel targeting.

---

## Subtitle and Caption Design

Bad subtitles are worse than none — they create false confidence that deaf/HoH players are getting the full experience.

### Subtitle Requirements

| Element | Requirement | Rationale |
|---------|-------------|-----------|
| Speaker identification | Name label and/or consistent color per speaker | Players can't identify speakers by voice |
| Font size | Adjustable, minimum 24px at 1080p, recommended default 28px | Readability at distance and on small screens |
| Background | Semi-transparent letterbox, adjustable opacity (0-100%) | Ensures readability over any scene |
| Line count | Maximum 2 lines on screen simultaneously | More lines overwhelm reading speed |
| Reading speed | Maximum 150-170 words per minute | Based on comfortable reading pace research |
| Positioning | Bottom-center default, adjustable | Different games/screens need different placement |
| Formatting | No ALL CAPS for full sentences (reduces readability by ~10%) | Mixed case is faster to read |

### Caption Design (Beyond Subtitles)

Captions describe non-speech audio — essential for deaf/HoH ambient narrative and threat awareness.

| Audio Type | Example |
|------------|---------|
| Environmental | [distant thunder], [rain on metal roof] |
| Directional | [footsteps approaching from behind] |
| Music/mood | *tense orchestral music builds* |
| Gameplay SFX | [alarm blaring], [shield breaking] |
| Off-screen speech | Guard [off-screen]: "Did you hear something?" |

### Scaling Reference

Scale proportionally with resolution: 24px minimum at 1080p → 48px at 4K. Recommended defaults: 28px at 1080p, 56px at 4K. Always offer a generous maximum (2x the default).

---

## Input Accessibility

### Remapping Requirements

- **Every** input must be remappable — no exceptions for "core" actions
- Support per-context remapping (menu vs. gameplay can differ)
- Allow multiple inputs bound to the same action
- Show current bindings in tutorials (don't show "Press X" if rebound to B)
- Detect and warn about conflicts, but allow them
- Persist bindings across sessions

### Toggle vs. Hold

Every sustained input needs a toggle/hold setting:

| Action | Hold (Default) | Toggle (Accessible) |
|--------|---------------|---------------------|
| Sprint | Hold stick + button | Click once to start, once to stop |
| Aim down sights | Hold trigger | Click to enter, click to exit |
| Crouch | Hold button | Click to crouch, click to stand |
| Fly/hover | Hold button | Click to engage, click to disengage |

### Input Timing

| Setting | What It Controls | Range |
|---------|-----------------|-------|
| Dead zone | How far a stick moves before registering | 0-50% (default 15-20%) |
| Sensitivity | Input-to-camera/cursor speed | 0.1x-3.0x |
| Acceleration | Sensitivity increase with input duration | Off to aggressive |
| Input buffer | How long before an action that an input is accepted | 0-500ms |
| QTE timing | Time window for quick-time events | 0.5x-3.0x (multiplier on base window) |

### Copilot Mode

Two controllers control one character simultaneously — no switching. Enables parent-child assisted play, friend-assisted play for motor disabilities, and therapeutic use. Implementation: merge inputs from both devices, resolve conflicts by last-input-wins.

### Touch Accessibility

For mobile/touch-enabled games: minimum 44x44px touch targets (48x48px recommended), 8px minimum spacing between targets, tap alternatives for every swipe/pinch gesture, adjustable touch-and-hold duration (200-1000ms).

---

## Testing Accessibility

Accessibility testing is not general playtesting — "any 5 players" won't surface accessibility barriers.

### Testing Methods

| Method | What It Catches | When to Use |
|--------|----------------|-------------|
| **Automated tools** | Contrast violations, missing alt text, color-only indicators | Every build (integrate into CI if possible) |
| **Simulation testing** | Colorblind issues, motion sensitivity, audio-off playthrough | Weekly during active development |
| **Expert review** | Systemic patterns, standard compliance, missed edge cases | Pre-alpha milestone, pre-launch |
| **Player testing with disabilities** | Real-world barrier discovery, assistive tech compatibility | Beta, pre-launch |
| **Assistive tech testing** | Screen reader compatibility, switch controller support | If targeting Tier 3 features |

### Simulation Testing Checklist

- [ ] Sound muted — can you complete every objective?
- [ ] Colorblind simulation (all three types) — can you distinguish all meaningful elements?
- [ ] One hand only — is it physically possible?
- [ ] Minimum text size at TV distance — can you read everything?
- [ ] Photosensitive check — any flashing above 3Hz?
- [ ] Keyboard-only (no mouse) — are any features inaccessible?
- [ ] Easiest difficulty — can a player struggling with timing/precision finish the game?

### Recruiting Players with Disabilities

Standard playtest recruitment won't surface accessibility barriers. Partner with disability advocacy and gaming organizations, post in disability-focused gaming communities, compensate fairly, and ensure the testing environment itself is accessible. Don't combine accessibility testing with general playtesting — the goals and recruitment differ.

See **playtest-design** for general methodology, but treat accessibility testing as a specialized discipline.

---

## Accessibility Health Check

### Tier 1 Checklist (Must-Have)

- [ ] No information conveyed by color alone — every color distinction has a redundant channel
- [ ] Text scales to at least 28px at 1080p — body text, UI labels, item descriptions
- [ ] Contrast ratios meet WCAG AA — 4.5:1 for text, 3:1 for UI
- [ ] All controls are remappable — no hardcoded bindings
- [ ] Toggle/hold option exists for every sustained input
- [ ] Subtitles are available with speaker identification
- [ ] Independent volume controls for music, SFX, voice (minimum)
- [ ] At least three difficulty options, or granular difficulty parameters
- [ ] Game can be paused at any time during gameplay (exception: competitive multiplayer)
- [ ] Clear objective/waypoint system is available (can be toggled off for players who prefer exploration)
- [ ] Motion reduction option exists (camera shake, screen effects, parallax)
- [ ] No flashing content above 3Hz, or a reliable skip/reduce option
- [ ] Tutorials explain mechanics clearly and can be dismissed

### Tier 2 Checklist (Should-Have)

- [ ] High contrast mode available for UI elements
- [ ] UI scales independently from game resolution
- [ ] Timing windows for QTE/parry/dodge are adjustable
- [ ] One-handed control scheme is possible (even if simplified)
- [ ] Visual indicators exist for all gameplay-relevant sounds
- [ ] Descriptive captions available for non-speech audio
- [ ] Game speed is adjustable (0.5x-1.0x minimum)
- [ ] Tutorials can be replayed from the menu
- [ ] Content warnings precede distressing scenes
- [ ] Subtitle font size, background opacity, and position are adjustable

---

## Anti-Patterns

| Anti-Pattern | Better Approach |
|-------------|-----------------|
| Single "Accessibility Mode" toggle | Individual toggles per feature — players need some but not all |
| Colorblind mode = hue shift filter | Redesign palette for universal clarity; use redundant channels |
| "Git gud" as response to accessibility requests | Offer options; never gatekeep the experience |
| Unskippable cutscenes | Always skippable or pauseable |
| Rapid button-mashing with no alternative | Hold-to-complete or auto-complete alternative |
| Tiny text, no scaling | Always support text scaling with a generous range |
| "We'll add accessibility later" | Design accessible from the start — retrofitting is expensive |
| Accessibility settings buried in sub-menus | Surface in first-run setup; dedicated section in main settings |
| Fixed subtitle appearance | Adjustable font size, background opacity, color, and position |
| Audio-only threat indicators | Pair every audio cue with a visual indicator |
| Auto-advancing dialogue | Player-paced advancement (press to continue) |

---

## Cross-References

| Skill | Intersection |
|-------|-------------|
| **player-ux** | Cognitive load overlaps cognitive accessibility; perception framework informs visual |
| **game-feel** | Juice/feedback must include motion reduction; screen shake needs opt-out |
| **encounter-design** | Difficulty and pacing are primary motor/cognitive accessibility levers |
| **progression-systems** | Adaptive difficulty is invisible accessibility; flow channel targeting |
| **game-design** | 5-Component Filter Clarity overlaps cognitive/visual accessibility |
| **experience-design** | Pacing must accommodate players needing more time or different inputs |
| **playtest-design** | Accessibility testing needs specialized recruitment |
| **narrative-design** | Subtitles/captions, content warnings, dialogue pacing |
| **multiplayer-design** | Communication accessibility, competitive fairness with assists |
| **game-balance** | Granular difficulty parameters need their own balance passes |
