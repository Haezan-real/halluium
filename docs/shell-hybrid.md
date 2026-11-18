# Hallu shell/app hybrid — how we execute

Goal: one **`hallu.exe`** that is both shell and app:
Blink → Skia → TypeScript/HTML DOM (+ Vite in dev), with math DLLs later
([`cpp-port.md`](cpp-port.md)).

## Static UI slice (clarification)

“Just static HTML/CSS, no JS/animations” still means **run Blink (or
another layout engine) at runtime** to turn HTML into Skia draw calls —
or bake a **one-shot bitmap** (screenshot) and display that (not a real
UI). There is no days-scale “Blink compiles this HTML file into a small
Skia-only .exe” path. Smallest experiment: `content_shell` / host loads
one local HTML file and paints it.

## Timescale filter (locked)

If it can’t show value in **days (≤ ~1 week)**, and MVP is **~1 month**,
it is out of scope for now.

**Harder gate (locked):** ≤ **2 days**, and **full feature parity** (identical
app, all edge cases). That kills near-term:

- from-scratch HTML/CSS→Skia engine  
- hand-extracting Blink / content_shell spine swap  
- full C++/Qt/ImGui UI rewrite  
- Token Burner 3000  

In-scope under that gate: brand/run **`hallu.exe`** on the **current** host,
polish, bugfixes, light packaging trim. Math DLLs only if they don’t risk
parity or blow the 2-day cap.

## The spiderweb problem (real)

You cannot “find the Blink→Skia file and copy it.”  
Blink is woven into **base, cc, viz, gpu, mojo, V8, net, ui, …**.  
Hand-pulling one strand yanks a massive web. Chromium upstream says the
same thing: **Blink has no supported standalone embed**; the supported
surface is the **`content/`** API. You also cannot build Blink without V8
if you want JS (Hallu needs that).

So “additive = copy Blink only” is a fantasy shape.  
**Additive that works** = start from a **known embed target** whose
dependency ball is already defined by GN/Ninja, then grow Hallu on top
and shrink that ball.

## Do not do this

- Walk `third_party/blink` and copy folders into `hallu/` by hand  
- Rewrite every `#include` to drop deps “as you go” without a green link  
- Treat Skia as a GUI toolkit (it is the paintbrush; Blink is the brain)

## Do this instead: closure, not treasure hunt

The spiderweb **is** the product of one build target. Let the build system
list it.

```text
# Example — exact target names may vary with the checkout
gn desc out/Release //content/shell:content_shell runtime_deps
ninja -C out/Release -t deps content_shell
```

That list **is** “everything Blink→Skia needs” for that shell.  
You do not discover it with grep; you discover it with **ninja**.

## Seed choices (pick one spine)

| Seed | What it is | Fit for Hallu |
|---|---|---|
| **A. `content_shell`** | Canonical minimal embed on `content/` | Smallest honest Blink+Skia+V8 window. No Node/Electron APIs. You must re-bridge file/ffmpeg/IPC yourself. |
| **B. Electron (current tree)** | `content` + Node + app APIs Hallu already uses | Bigger ball, but Hallu **already runs**. Brand → `hallu.exe`, then shrink. |
| **C. CEF-style embed** | Another `content/` embedder | Extra project; usually no win over A/B for us. |

**Locked direction for execution:** treat the hybrid as **“embed target →
`hallu.exe`,”** not “extract Blink into a new folder.”

Practical order that matches the product model:

1. **Short term (now):** keep proving a green host binary from the current
   engine tree (Electron graph). Rename/brand the host to **`hallu.exe`**.
   This is subtractive *on a working Hallu host*, not hand-additive Blink.
2. **Measure the ball:** dump `runtime_deps` / ninja deps for `electron`
   vs `content_shell` on this checkout — know how much smaller B→A would be.
3. **If we switch spine to A:** build `content_shell` (or a Hallu fork of
   it) as `hallu.exe`, load the UI (Vite URL / file URL), then reattach
   only the bridges Hallu needs (ffmpeg, dialogs, settings) as thin native
   code + DLLs from [`cpp-port.md`](cpp-port.md).
4. **Shrink:** only after a Hallu-shaped `hallu.exe` runs, delete unused
   edges from **that** target’s closure (same purge test: Hallu-dev-env).

Hand-additive “copy Blink” stays rejected.  
**Machine-additive** = “take target closure as the unit of code.”

## How this pairs with math DLLs

```
hallu.exe          ← embed target (content_shell or electron-derived)
hallu_math.dll     ← easy C++ from cpp-port.md (in-process)
```

The shell owns Blink/Skia/V8.  
DLLs own pure Hallu math.  
JS calls DLLs through a small native bridge inside the same process.

## Compile-time pain (honest)

Any first green `hallu.exe` from Chromium guts still costs **hours**.  
You only make iteration cheaper **after** the target is small.  
Switching to `content_shell` may shrink the *steady-state* ball; it does
not remove the first big link.

## One-line strategy

**Don’t pull the spider out of the web. Adopt a spider that already
runs (embed target), put Hallu’s face on it, name it `hallu.exe`, then
cut legs the app doesn’t need.**
