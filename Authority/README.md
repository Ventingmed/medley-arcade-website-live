# Medley Arcade Website Live Authority — Build 116

Build 116 preserves Authority 113 multiplayer/results/rematch behavior and adds shared storage APIs for leaderboard scores, Games voting, and player suggestions.

## Persistence
The Authority now prefers `/var/data/medley-arcade` automatically when `/var/data` is writable (the recommended Render persistent-disk mount). You can also set `DATA_DIR` explicitly. If neither exists, it falls back to `/app/data`; that fallback is shared while the instance runs but is NOT durable across redeploys.

Recommended Render Starter setup: attach a persistent disk mounted at `/var/data`, then deploy Build 116. The startup log explicitly says whether a durable mount was detected.

Persistent files: `scores.jsonl`, `community-votes.json`, `community-suggestions.json`.

Health/state exposes the active data directory so deployment can be verified before relying on it.
