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


Build 091 adds shared player-best lookup plus Host Dashboard shared-board clear/delete endpoints. For testing, host code defaults to host4536; set HOST_CODE in Render before public production and replace hidden-code moderation with authenticated host access.
