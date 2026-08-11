# Medley Arcade Website Live Authority — Build 093

Independent .com-first shared service. Not Twitch Authority.

Build 093 preserves the Build 091 shared leaderboard, personal-best lookup, Host Dashboard shared-board moderation, presence, and duel-queue foundation.

## New in Build 093 — Live Game Rooms / Spectator Foundation
- Creates live Shooting Gallery rooms when a 2–4 player local competition begins.
- Announces active games through the existing site-wide live state stream.
- Provides room-scoped SSE streams for read-only spectators.
- Mirrors target state, shots, score events, turn changes, and the visible 60-second clock.
- Tracks live spectator counts and expires abandoned rooms automatically.
- Spectators cannot post game events because room event writes require the host token returned only to the game-starting browser.

Start: `node server.js`
Health: `/health`

For testing, Host Dashboard moderation still defaults to `host4536`. Before public production, set `HOST_CODE` in Render and replace hidden-code moderation with authenticated host access. The free Render filesystem is ephemeral; move scores to durable storage before relying on them as permanent records.
