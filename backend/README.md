# Event Gate API

The backend is a separate Node.js/Express package from the Vite frontend.
Its initial endpoint is:

| Method | Path | Response |
| --- | --- | --- |
| `GET` | `/api/health` | `200 { "status": "ok" }` |

## Run locally

Use Node.js 20 or later. From this directory:

```sh
npm install
cp .env.example .env
npm run dev
```

The API listens on port `3001` by default. To run its tests:

```sh
npm test
```

Database access, authentication, authorization, and business endpoints are
intentionally not implemented until the team confirms the database interfaces
and the role/profile lookup contract. Do not put credentials in `.env.example`;
local `.env` files are ignored by Git.
