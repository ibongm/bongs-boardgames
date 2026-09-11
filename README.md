# Bong's Board Games

Public tabletop rooms for Tic-Tac-Toe and Connect Four. Sign in, create or join a room, and fill empty seats with bots.

- Repository: https://github.com/ibongm/bongs-boardgames
- Firebase project: `bongs-boardgames-55d28`
- Admin email: `ivanm.ploce@gmail.com`

## Local development

```bash
npm install
npm run dev
```

Firebase web config is already in `src/lib/firebase.js`. Override with `.env` if needed.

## Firestore rules

From this folder, after `firebase login`:

```bash
npx firebase use bongs-boardgames-55d28
npx firebase deploy --only firestore:rules
```

Also add the Vercel hostname under Authentication → Settings → Authorized domains.
