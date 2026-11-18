# Token Burner 3000

**Status:** parked until Hallu ships and can fund a serious token burn.  
**Spirit:** theory says this is a long shot; the only real falsification is to
**run it**. This file is the bet we make with surplus money, not the MVP path.

## The bet

Autonomous agent loop (hsalsom2-like), left running for **days**:

1. Keep **TypeScript Hallu** as the reference UI.  
2. Keep a **C++ Hallu** growing beside it.  
3. Agent incessantly:
   - drives every reachable UI (buttons, hovers, drags, edge cases — as far
     as a finite tour script can go),
   - screenshots **TS vs C++**,
   - diffs them,
   - reads TS logic and ports / patches C++ (“wing it” + visual oracle),
   - repeats until the C++ UI matches (or money/tokens run out).

Optional add-on from earlier brainstorms: capture Skia (or framebuffer)
draw lists while touring, to seed or check the C++ draw path — still with
TS logic ported by the agent, not a pure cold HTML→C++ compiler.

**Claim to test:** raw tokens + screenshot oracle + TS as spec might grind
out a C++ replica even if humans think it “won’t work.”

## Why we might still try (after revenue)

- Screenshot diff is a real, automatable signal.  
- Hallu’s TS is an executable spec.  
- Long unattended runs are exactly what agents are for.  
- “Won’t work” from chat is a prior, not a proof. **Practice decides.**

## Why it might fail anyway (so we don’t cry)

- UI state space isn’t fully enumerable.  
- Pixel match ≠ logic match.  
- Needs a real C++ shell/stack first (nothing to screenshot against).  
- Agents stall, regress, and burn cash on loops.  
- Full twin in “3 days” is the fantasy; “weeks of burn → partial port” is
  the sober upside.

## Do not do this before ship

Month MVP / days-or-week bets stay on **polish the running TS Hallu** (+
optional `hallu.exe` branding). Token Burner 3000 is **post-revenue R&D**.

## Minimum setup when we light the burner

1. **Money / token budget** capped (burn limit, kill switch).  
2. **C++ baseline** already opens a window and can show *something*
   (Qt / ImGui / Skia / embed — pick one and freeze it).  
3. **Fixed tour script** first (named screens + actions). “Every edge case”
   only expands after the tour is green.  
4. **Oracle:** screenshot diff (SSIM / pixel budget) + a few logic checks.  
5. **hsalsom2-like protocol:** session branch, one goal per loop, verify,
   commit, no asking the human mid-burn.  
6. **Artifacts:** failing pair screenshots, patch log, “known gaps” list.  
7. **Stop conditions:** budget hit, tour green N times, or stuck same
   failure K times.

## Protocol sketch (later)

```text
Token Burner 3000 — run 1 of N
Stack: TS Hallu (ref) + C++ Hallu (candidate)
Tour: token-burner-tour.md  (write when activating)
Budget: $X / Y M tokens hard cap
Loop:
  - reset both apps to tour checkpoint
  - perform next tour step
  - screenshot both
  - if diff > threshold: read TS for that surface, patch C++, rebuild, retry
  - record result; advance or retry per stuck rules
  - never ask human until budget/stop
```

## Related docs

- [`shell-hybrid.md`](shell-hybrid.md) — `hallu.exe` / embed reality  
- [`cpp-port.md`](cpp-port.md) — what to port as DLLs when native exists  
- [`plan.md`](plan.md) — ship-first timescale lock  

## One-liner

**Ship Hallu → make money → burn tokens on an autonomous TS↔C++ UI grind
and find out.** Until then, this file is the bookmark, not the build.
