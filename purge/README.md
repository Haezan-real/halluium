# Hallulium purge

Purge work is split into **stages**. Each stage can contain multiple **phases**.

| Stage | Contents |
|---|---|
| [`phone purge/`](phone%20purge/) | Phases 01–11 + DevTools/password-manager extra (already applied on disk) |
| [`unused by electron purge/`](unused%20by%20electron%20purge/) | Scan maps for ~11 GB of src not in the Release `electron.exe` ninja inputs. **Post-cut rule:** unhook or restore real — no new empty stubs (see that README). |

## Apply (phone purge stage)

```powershell
powershell -NoProfile -File purge\apply.ps1
# same as:
powershell -NoProfile -File "purge\phone purge\apply.ps1"
```

Shared helper: [`apply-phase.ps1`](apply-phase.ps1) — reads a phase’s `REMOVED.md` (`## Remove` bullets) then any `fix*.md` (`## Stub:` bodies).

## Unused-by-electron stage

Not auto-applied yet. See [`unused by electron purge/README.md`](unused%20by%20electron%20purge/README.md).
