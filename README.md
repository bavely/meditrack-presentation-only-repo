# MediTrack Presentation Monorepo - https://github.com/bavely/meditrack-presentation-only-repo

This repository bundles the presentation assets for MediTrack—a medication tracking experience composed of a mobile app, a NestJS backend, a computer-vision unwrap service, and a lightweight verification site. Each subproject includes its own docs, but this README offers a quick map of what lives where and how to get started.

## Repository layout

- **`meditrack-app/`** – React Native + Expo mobile client with AI assistant flows, bottle-scanning guidance, reminders, and dashboard widgets. See the in-app README for feature walkthroughs and architecture notes.
- **`meditrack-server/`** – NestJS GraphQL API that powers authentication, medication schedules, dose reminders, and notification delivery via Expo push or Twilio SMS.
- **`meditrack-opencv/`** – Flask microservice that unwraps short bottle-rotation videos into sharp frames and contact sheets ready for OCR, saving results to S3.
- **`verifications/`** – Vite/React front-end for email confirmation and password reset flows against the GraphQL API.

## Quick start by project

### Mobile app (`meditrack-app`)
1. Install dependencies:
   ```bash
   cd meditrack-app
   npm install
   ```
2. Start the Expo dev server (Metro):
   ```bash
   npm start
   ```
3. Use `npm run android`, `npm run ios`, or `npm run web` for platform-specific builds. See `meditrack-app/README.md` for environment variables and detailed flow descriptions.

### Backend API (`meditrack-server`)
1. Install dependencies:
   ```bash
   cd meditrack-server
   npm install
   ```
2. Start the API in watch mode:
   ```bash
   npm run start:dev
   ```
3. The server uses PostgreSQL via Prisma. Configure database credentials and any notification provider secrets in the `.env` file before running. Additional scripts include `npm test` for Jest suites and `npm run lint` for ESLint.

### Unwrap service (`meditrack-opencv`)
1. Install Python requirements and ensure FFmpeg is on `PATH`:
   ```bash
   cd meditrack-opencv
   pip install -r requirements.txt
   ```
2. Launch the Flask app (default port `5050`):
   ```bash
   python app.py
   ```
3. Set `AWS_REGION` and `S3_BUCKET` (plus optional tuning flags) to control where extracted frames and contact sheets are stored. A Dockerfile is provided for containerized runs.

### Verification site (`verifications`)
1. Install dependencies:
   ```bash
   cd verifications
   npm install
   ```
2. Start the Vite dev server:
   ```bash
   npm run dev
   ```
3. Provide GraphQL endpoint details in a local `.env` file before developing or building with `npm run build`.

## Helpful links
- Mobile docs: [`meditrack-app/README.md`](meditrack-app/README.md)
- Backend docs: [`meditrack-server/README.md`](meditrack-server/README.md)
- Unwrap service docs: [`meditrack-opencv/README.md`](meditrack-opencv/README.md)
- Verification UI docs: [`verifications/README.md`](verifications/README.md)

