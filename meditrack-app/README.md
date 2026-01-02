# 📱 MediTrack Mobile App

MediTrack is a React Native and Expo application for tracking prescriptions, reminders, and scans.

## ✨ Highlights

- 🤖 **AI assistant** that answers medication questions and guides dosage schedules.
- 📷 **Multi‑mode scanning** supporting camera, gallery, OCR, and barcode input.
- 🗃️ **Zustand stores** for lightweight global state management.
- 🌐 **GraphQL service** powering data APIs and the cylindrical‑unwrap service.

## 🏛️ Architecture

### Experience flows
- **Dashboard adherence tracking** – The home tab hydrates the calendar and daily adherence metrics from the schedule service, listens for notification responses, and mutates the visible list when a dose is marked taken or skipped. Those UI events directly drive the medication store, which persists upcoming doses, syncs medication history, and recalculates the adherence rate used by the dashboard widgets.【F:app/(tabs)/index.tsx†L1-L200】【F:store/medication-store.ts†L7-L165】
- **Medication management hub** – The Manage tab surfaces quick links whose counts are derived from the active medications in the same store, anchoring the navigation for users to curate their schedules and calendars off the shared state container.【F:app/(tabs)/manage.tsx†L1-L80】【F:store/medication-store.ts†L7-L65】
- **Profile & daily preferences** – The Profile tab bootstraps toggles and pickers from the authenticated user, requests push permissions, and persists lifestyle times back through the auth store so reminders can respect morning, meal, and exercise windows across sessions.【F:app/(tabs)/profile.tsx†L1-L200】【F:store/auth-store.ts†L200-L269】

### AI assistant lifecycle
The assistant tab loads available conversations on mount, hydrates the message history for a selected thread, and streams new exchanges into local state before re-rendering the transcript UI.【F:app/(tabs)/assistant.tsx†L69-L389】 All network operations flow through the AI assistant service, which wraps Apollo queries and mutations so the UI can fetch thread lists, retrieve message bundles, ask follow-up questions, and delete transcripts without duplicating client wiring.【F:services/aiAssistantService.ts†L1-L35】 Those calls expect the GraphQL API to return success flags, typed errors, and nested conversation payloads exactly as defined in the shared documents, ensuring every response can be merged back into the assistant state tree.【F:graphql/aiAssistant.ts†L1-L84】

### Cylindrical scanning pipeline
See the [Technical Implementation Guide](docs/TECHNICAL_IMPLEMENTATION_GUIDE.md) for the full cylindrical workflow. At a glance: the React Native scanner captures a timed rotation, overlays bottle-detection guidance, and streams metrics while recording; MLKit and helper utilities score bottle confidence frame by frame; the captured clip is posted to the backend `/unwrap` endpoint, which reconstructs the cylinder, unwraps the texture, and returns a flattened label ready for OCR and downstream GraphQL parsing so structured medication data can rehydrate the client.【F:docs/TECHNICAL_IMPLEMENTATION_GUIDE.md†L1-L200】

### Notification loop
Foreground handlers, Expo listeners, and Notifee callbacks coordinate through the notifications hook to normalize payloads, schedule snoozes, and deep link users into the correct medication context while surfacing in-app alarm modals when dose actions are due.【F:hooks/useNotifications.tsx†L1-L200】 Platform initialization then provisions the Android channels, iOS categories, and background action identifiers that power those reminder flows, ensuring the hook’s callbacks are invoked with the right capabilities.【F:services/setupNotifications.ts†L1-L159】

## 🚀 Getting Started

Install dependencies and start the development server:

```bash
npm install
npm start
```

## 🔧 Environment Variables

Create a `.env` file in the project root with:

```env
SUPABASE_URL=https://your-supabase-url.supabase.co
SUPABASE_ANON_KEY=public-anon-key
GRAPHQL_API_URL=https://api.example.com/graphql
EAS_PROJECT_ID=ce52b448-f7c7-47be-952e-cd7d61a3d102
```

These values are consumed in `app.config.js` so they surface through `expo-constants` at runtime:

- `SUPABASE_URL` and `SUPABASE_ANON_KEY` configure the Supabase client used throughout the app.
- `GRAPHQL_API_URL` targets the backend GraphQL service for all Apollo queries, mutations, and file uploads.
- `EAS_PROJECT_ID` populates `extra.eas.projectId` in `app.config.js`, which Expo uses when requesting push tokens.

Update the sample values above with the URLs, keys, and identifiers from your infrastructure before running the app.

## 🌐 GraphQL API requirements

The Apollo client is created in [`utils/apollo.ts`](utils/apollo.ts) using `GRAPHQL_API_URL` for its `createUploadLink`, so the URL must expose every GraphQL operation the app depends on. When a request returns `401`, the client triggers `refreshAccessToken`, which calls the `refreshToken` mutation at the same endpoint and, on success, retries the original request with the new access token.

Authentication state is persisted by [`store/auth-store.ts`](store/auth-store.ts). After startup it loads tokens from secure storage, calls the `getUser` query to verify the session, and falls back to a logged-out state if verification fails. Ensure your GraphQL service implements:

- `login(email, password)` and `registerUser(input)` mutations that return both `accessToken` and `refreshToken` pairs.
- `refreshToken(refreshToken: String!)` returning a new access token without invalidating the refresh token.
- `getUser` query for the logged-in account, including an `emailVerified` flag so the client can gate access.

Mirror the shapes shown in [`graphql/user.ts`](graphql/user.ts) for the expected response structure.

## 📄 Scripts

| Command | Description | Prerequisites |
| --- | --- | --- |
| `npm start` | Start the Expo development server and Metro bundler for local development. | Node.js 18+, Expo CLI (invoked via `npx expo`), and either a simulator, emulator, or the Expo Go app for device previews. |
| `npm run android` | Build and launch the Android dev client with `expo run:android`. | Android Studio with an emulator image or a USB-debuggable device, and `ANDROID_HOME`/SDK tools on your PATH. |
| `npm run ios` | Build and open the iOS dev client with `expo run:ios`. | macOS with Xcode and CocoaPods installed, plus an iOS simulator or a paired device. |
| `npm run web` | Serve the project with Expo for Web (`expo start --web`). | A modern browser (Chrome, Edge, Safari) and the same Node.js/Expo tooling as above. |
| `npm run lint` | Run the Expo-managed ESLint configuration against the codebase. | Node.js 18+; installs run automatically during `npm install`. |

## 🧪 Testing

### React Native component tests (Jest + React Native Testing Library)

Component-focused tests live in [`components/__tests__`](components/__tests__). Run them with Jest using the React Native Testing Library preset to get the right globals and serializers:

```bash
npx jest components/__tests__ --config node_modules/@testing-library/react-native/jest-preset/index.js
```

- `npx` will download a compatible Jest runtime if it is not yet installed locally; to pin it to the repo install `jest`/`jest-expo` as dev dependencies first.
- Append `--watch` for an interactive rerun loop or `--runInBand` when debugging in VS Code.

### Calendar regression harness (CommonJS + ts-node)

The calendar smoke tests under [`app/medication/__tests__`](app/medication/__tests__) execute against the TypeScript screen via Node’s CommonJS loader. They rely on `ts-node` to transpile `.tsx` files and a few globals that Metro normally injects. From the repository root run:

```bash
TS_NODE_COMPILER_OPTIONS='{"jsx":"react-jsx","module":"commonjs"}' \
  node -r ts-node/register -e "global.__DEV__=false;require('./app/medication/__tests__/calendar.test.cjs');"
```

Repeat the same invocation with `layout.test.cjs` to validate the stack titles. The inline `TS_NODE_COMPILER_OPTIONS` flag teaches `ts-node` how to transpile JSX for Node, and the `-e` shim defines the `__DEV__` global Expo supplies in-app.

### Custom mocks and stubs

These harnesses stub several React Native modules so they can run in a bare Node environment. Keep them in sync with production modules whenever APIs change:

- [`scheduleService-mock.js`](app/medication/__tests__/scheduleService-mock.js) tracks how many times dose-fetch helpers are called so the test can assert on network fan-out.
- [`calendars-stub.js`](app/medication/__tests__/calendars-stub.js) captures the last props passed to `ExpandableCalendar` via the exported `__getProps()` helper used in assertions.
- [`react-native-stub.js`](app/medication/__tests__/react-native-stub.js) and [`paper-stub.js`](app/medication/__tests__/paper-stub.js) provide lightweight stand-ins for core primitives and `Button`.
- [`medication-store-stub.js`](app/medication/__tests__/medication-store-stub.js) and [`useColorScheme-stub.js`](app/medication/__tests__/useColorScheme-stub.js) emulate hooks without touching native state.
- [`dose-card-stub.js`](app/medication/__tests__/dose-card-stub.js), [`empty-state-stub.js`](app/medication/__tests__/empty-state-stub.js), and [`theme-stub.js`](app/medication/__tests__/theme-stub.js) mirror component outputs and design tokens; update them when new props or tokens (for example, additional `borderRadius` keys) appear in the real implementation.
- [`expo-router-stub.js`](app/medication/__tests__/expo-router-stub.js) supports the layout test by mimicking the `Stack` API Expo Router normally provides.

## 📚 Project Structure

```
meditrack-app/
├── app/
├── components/
├── services/
├── store/
└── ...
```

## 🔔 Notifications

Local alarms for upcoming doses are scheduled with `scheduleUpcomingDoseAlarms`. Run this on app start and whenever schedules change to keep reminders up to date.

### Expo push & Notifee prerequisites

- [`hooks/useNotifications.tsx`](hooks/useNotifications.tsx) pulls the Expo project ID from `extra.eas.projectId` when registering for push tokens, so the ID in your `.env`/`app.config.js` must match the EAS project that owns your Expo build profile.
- [`services/setupNotifications.ts`](services/setupNotifications.ts) requests the Android `SCHEDULE_EXACT_ALARM` permission and creates Notifee channels for regular and critical alarms—ensure this permission stays in `app.config.js` and confirm your backend sends payloads that map to the `MED_DOSE`/`MED_CRITICAL` categories.
- The same setup file requests iOS critical alert capability; flip `allowCriticalAlerts` to `true` only after you secure the Apple entitlement and add it to your app ID.

## 📝 License

MIT © 2025 MediTrack Team
