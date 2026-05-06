---
name: BaseSkill
last_updated: 2026-05-06
---

# BaseSkill Strategy

## Target problem

Parents of young children (4-8) need to help their kids learn foundational reading and maths, but they aren't teachers — they don't know what to teach next, can't diagnose what their child has mastered vs where the gaps are, and often don't have time to sit with the child. The kids themselves lack motivation for traditional learning and would rather play games. Existing apps don't let parents override the default learning path when their child's real-world needs (a different curriculum, a school goal, a specific weakness) diverge from the built-in sequence.

## Our approach

Make the app adaptive enough that a parent doesn't need to be a teacher — the system learns the child while still giving the adult control. SRS surfaces gaps automatically, built-in curriculum paths provide a default sequence, and goal-setting lets parents or teachers override when real-world needs diverge. The game layer makes kids choose to engage voluntarily, so the parent doesn't need to be present for learning to happen.

## Who it's for

**Primary:** Busy parents of 4-8 year olds whose child is either preparing for school or falling behind the curriculum. They're hiring BaseSkill to teach foundational reading and maths through games — so the child engages without being forced and the parent doesn't need teaching expertise or time to sit alongside them.

**Secondary:** Homeschool parents who are present but aren't trained teachers. They're hiring BaseSkill to handle sequencing and gap detection so they can focus on support rather than curriculum design.

## Key metrics

- **Item mastery rate** — percentage of SRS items reaching mastered state within N sessions. Measures whether the adaptive engine is working. On-device (SRS DB); backend phase 2.
- **Session retention** — frequency and average session length per child. Measures whether the game layer keeps kids coming back. On-device; backend real-time monitoring in phase 2.
- **Curriculum coverage** — percentage of the built-in path a child has progressed through. Measures whether sequencing is driving completion. On-device.
- **Goal completion rate** — when a parent sets a custom goal, does the child reach it? Measures whether adult-control surface is effective. On-device; backend phase 2.
- **Parent feedback** — qualitative signal via in-app forms and email. Measures trust and perceived value. No child data collected.

All metrics are client-side in phase 1. Backend (phase 2) adds sync, real-time monitoring, and aggregate engagement analytics — subject to child-data privacy constraints (no PII, on-device-first architecture).

## Tracks

### Adaptive Learning Engine

SRS v1 (SM-2 item scheduling for WordSpell), SRS v2 (skill-pattern aggregation and mistake-pattern detection), custom goal-setting by parents/teachers, built-in curriculum paths with pre-path level selection on first load.

_Why it serves the approach:_ This is the "system learns the child" core — without it, the app is just random practice. With it, every session is personalised and parents can trust the sequencing or override it.

### Game Platform & Engagement

useGameRound extraction, TTS/Instructions UX overhaul, tap-select mode, collectables system (19 characters unlocked via mini-games on level/game completion), and new mini-game prototypes.

_Why it serves the approach:_ Kids who'd rather play video games need a reason to open BaseSkill instead. Collectables and mini-games turn learning sessions into something they choose to do, not something they're forced to do.

### Backend & Sync

Data syncing across devices, real-time engagement monitoring, multi-device support. Foundation for premium features and future expansion.

_Why it serves the approach:_ Parents need progress to persist across devices and the team needs visibility into whether the product is working at scale. Also the infrastructure gate for monetisation.

### Monetisation

Freemium model. Free and open-source base product; premium tier for customisation, data sync, and structured curriculum paths.

_Why it serves the approach:_ Keeps the product accessible to any family while funding development. Premium features (sync, structured paths) are the ones that require backend infrastructure and ongoing operational cost.

## Not working on

- **School/teacher accounts** — future horizon, not current investment. Architecture supports it but building the admin surface and billing model is out of scope.
- **Non-English languages** — platform supports regions (`src/data/words/curriculum/<region>/`), but only English is tested and targeted.
- **Regions beyond Australia** — architecture is region-aware so US/UK/etc can use the app, but curriculum paths are only validated for Australian standards. Expanding deliberately later rather than shipping untested paths.

## Marketing

**One-liner:** Fun lessons that adapt to your child's level — reading and maths they'll actually want to do.

**Key message:** Parents aren't teachers and shouldn't need to be. BaseSkill adapts to each child — surfacing gaps, sequencing the right content, and letting kids learn through lessons they actually enjoy. Parents stay in control without needing expertise.
