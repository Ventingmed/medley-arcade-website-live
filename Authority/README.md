# Medley Arcade Website Live Authority — Build 081

Independent .com-first shared service. This is not the Twitch Authority.

Provides:
- shared Shooting Gallery leaderboard
- persistent public Arcade Name keyed to a browser-generated player ID
- live website presence count
- recent-score activity
- Head-to-Head Duel waiting queue foundation

Start: `node server.js`
Health: `/health`

Attach persistent storage (or later a managed database) before relying on scores long-term.
