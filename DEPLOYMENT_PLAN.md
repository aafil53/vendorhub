# Production Deployment Plan (Vercel + Render + MySQL)

This plan prepares the codebase for public hosting using free tier services.

## User Review Required

> [!IMPORTANT]
> - **MySQL Provider**: You will need to sign up for a free MySQL provider like **[Aiven](https://aiven.io/free-plans)** to get a "forever free" database.
> - **Environment Variables**: You will need to copy your specific database connection details from Aiven into the Render dashboard.

## Proposed Changes

### Backend (Render)
Make the backend robust for environment variables and satisfy Render's requirements.

#### [MODIFY] [database.js](file:///c:/Users/mdaaf/OneDrive/Desktop/Volvitech/vendorhub/backend/src/config/database.js)
- Ensure all connection parameters are primary from `process.env`.
- Ensure it handles connection strings if provided by a host.

#### [MODIFY] [package.json](file:///c:/Users/mdaaf/OneDrive/Desktop/Volvitech/vendorhub/backend/package.json)
- Add `engines` field for Node version.

### Frontend (Vercel)
Ensure the frontend can communicate with the backend on Render.

#### [MODIFY] [api.ts](file:///c:/Users/mdaaf/OneDrive/Desktop/Volvitech/vendorhub/src/lib/api.ts)
- Update code to use `import.meta.env.VITE_API_URL || '/api'` as the base URL.

## Verification Plan

### Automated Tests
- Run `npm run build` in both frontend and backend to ensure production builds are successful.
- Verify environment variable loading locally by mocking production values.

### Manual Verification
1. Deploy to a test branch.
2. Confirm the frontend at `<vercel-url>` can successfully log in using a database hosted at `<mysql-url>`.
