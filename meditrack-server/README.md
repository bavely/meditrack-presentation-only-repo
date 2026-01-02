# 🩺 MediTrack Backend



This is the **backend server** for the MediTrack mobile app — a smart medication tracker that sends reminders and notifications, predicts refills, and provides AI-assisted dosage parsing from prescription labels.

### Reminder & notification flow

A cron job in [`src/reminder`](src/reminder/) runs every minute to scan upcoming dose times, create or reconcile pending dose actions, and compute reminder offsets for each schedule. Every attempt is written to `notificationLog`, giving the service an audit trail it can use to skip duplicates after restarts. When a reminder is ready, the job hands it to [`src/notification`](src/notification/), which delivers Expo push notifications to all registered device tokens or Twilio SMS messages based on user preferences, capturing success and error metadata alongside each log entry.



Built with:
- 🚀 NestJS (GraphQL API)
- 🔐 JWT-based authentication
- 🧠 OpenAI GPT-4 (AI dosage interpretation)
- 🧬 Prisma + PostgreSQL (Data Layer)
- 🗓️ `schedule/` – generates future dose times from medication plans
- 💊 `dose-action/` – tracks taken, skipped, pending, and missed doses
- ⏰ `reminder/` – cron-driven reminder generation and notification logging
- 📣 `notification/` – Expo push & Twilio SMS delivery with log persistence
- 📱 `device/` – stores per-user Expo tokens and notification preferences

---

## 🔧 Tech Stack

| Layer         | Tech                                     |
|--------------|-------------------------------------------|
| Server       | NestJS + GraphQL                         |
| Auth         | JWT-based auth (Passport strategy)       |
| AI           | OpenAI GPT-4 API                         |
| DB           | PostgreSQL + Prisma ORM                  |
| Messaging    | Mailgun / Expo Push Notifications        |

---

## 📁 Project Structure

```
meditrack-server/
│
├── prisma/                  # Prisma schema + migrations
├── src/
│   ├── ai/                  # Label parsing via OpenAI
│   ├── auth/                # Auth0 JWT strategy
│   ├── medication/          # Medication CRUD + schedule bindings
│   ├── schedule/            # Dose schedule resolvers & services
│   ├── dose-action/         # Dose action history + state changes
│   ├── reminder/            # Cron job that generates reminders & logs sends
│   ├── notification/        # Delivery services for Expo push + Twilio SMS
│   ├── device/              # Registered devices & Expo push tokens
│   ├── user/                # Auth0 user registration logic

│   ├── prisma/              # PrismaService (DB abstraction)
│   ├── app.module.ts        # Main app module
│   └── main.ts              # App entry point
```

## 🔒 Password Hashing

The `UserService.create` method automatically hashes a plain text password
using bcrypt if one is provided. Supply the raw password when calling this
method—do not pre-hash it—to avoid accidentally storing a double-hashed value.

---

## ⚙️ Setup & Development

### 1. Clone & Install

```bash
git clone https://github.com/yourname/meditrack-server.git
cd meditrack-server
npm install
```

### 2. Configure Environment

Create a `.env` file in the project root. The repository does **not** ship a ready-made template such as `.env.example`, so you must create this file manually and copy in the values your environment needs. A minimal starting point looks like:

```env
# Core database + runtime
DATABASE_URL=postgresql://user:pass@localhost:5432/meditrack
PORT=8000
ALLOWED_ORIGINS=http://localhost:5173
FRONTEND_URL=http://localhost:5173

# JWT secrets
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Mailgun email delivery
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=mg.example.com

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://your-openai-resource.openai.azure.com
AZURE_OPENAI_API_KEY=your_azure_openai_key
AZURE_OPENAI_API_VERSION=2023-05-15
AZURE_OPENAI_DEPLOYMENT=your_model

# Twilio SMS (required to send SMS reminders)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_FROM_NUMBER=+1234567890

# Optional Expo push configuration (leave commented to disable Expo delivery)
# EXPO_PUSH_URL=https://exp.host
# EXPO_ACCESS_TOKEN=your_expo_access_token
```

> The service derives the Mailgun "from" address from `MAILGUN_DOMAIN`, so there is no separate `MAILGUN_FROM` setting. Legacy placeholders such as `GRAPHQL_API_URL` are not read by the current codebase and can be omitted entirely.

#### Environment Variable Descriptions

> **Required at boot:** `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_API_VERSION`, `AZURE_OPENAI_DEPLOYMENT`. SMS delivery also requires `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER`.

**Runtime & database**
- `DATABASE_URL` – PostgreSQL connection string read by Prisma.
- `PORT` – port the NestJS application listens on (defaults to `8000` when unset).
- `ALLOWED_ORIGINS` – comma-separated list of allowed CORS origins.
- `FRONTEND_URL` – base URL of the frontend app for links and redirects.

**Authentication**
- `JWT_ACCESS_SECRET` – secret used to sign access tokens.
- `JWT_REFRESH_SECRET` – secret used to sign refresh tokens.

**Email delivery**
- `MAILGUN_API_KEY` – Mailgun API key for sending email.
- `MAILGUN_DOMAIN` – Mailgun domain used to send email (provides the "from" address).

**Azure OpenAI**
- `AZURE_OPENAI_ENDPOINT` – Azure OpenAI resource endpoint.
- `AZURE_OPENAI_API_KEY` – API key for Azure OpenAI.
- `AZURE_OPENAI_API_VERSION` – version of the Azure OpenAI API.
- `AZURE_OPENAI_DEPLOYMENT` – name of the model deployment to use.

**Twilio SMS**
- `TWILIO_ACCOUNT_SID` – Twilio project SID used to authenticate API calls.
- `TWILIO_AUTH_TOKEN` – Twilio auth token paired with the account SID.
- `TWILIO_FROM_NUMBER` – verified phone number Twilio should send SMS reminders from.

**Expo push (optional)**
- `EXPO_PUSH_URL` – override the Expo push service base URL (optional; defaults to Expo Cloud when omitted).
- `EXPO_ACCESS_TOKEN` – Expo access token required to send push notifications (the service will log a warning and skip delivery if missing).

Unused legacy variables from earlier iterations such as `MAILGUN_FROM` and `GRAPHQL_API_URL` are intentionally absent—they are ignored by the current codebase and can be removed from your environment.

### 3. Setup Prisma

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Run the Server

```bash
npm run start:dev
```

GraphQL Playground: `http://localhost:8000/graphql`


### Configure Reminder Delivery

The reminder cron job is active by default when the NestJS application starts. It
uses Expo push notifications and Twilio SMS based on each user's
communication preferences:

- Expo push delivery requires `EXPO_PUSH_URL` and `EXPO_ACCESS_TOKEN`.
- Twilio SMS delivery requires `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and
  `TWILIO_FROM_NUMBER`.

If the required credentials are missing, the `ReminderService` will record the
attempt in `notificationLog` and skip the external call to avoid repeated
failures.

---

## 🐳 Docker

Build the Docker image:

```bash
docker build -t meditrack-backend .
```

Run the container:

```bash
docker run -p 8000:8000 meditrack-backend
```

---

## 🔐 JWT Authentication

- JWT is passed via `Authorization: Bearer <token>`
- NestJS uses Passport + JWT Strategy
- `userId` is extracted from the JWT `sub` claim


## 📡 GraphQL API

Every resolver returns a consistent `{ success, errors, data }` envelope. The
[`GraphqlExceptionInterceptor`](src/common/interceptors/graphql-exception.interceptor.ts)
wraps successful results and thrown errors so each resolver only has to return the
raw payload (or throw); the interceptor drops it into the `data` field, flips the
`success` flag, and normalizes error objects. This keeps client parsing logic the
same whether you are calling a CRUD mutation or an AI assistant helper.

### Authentication (`AuthResolver`)

Auth mutations return access/refresh tokens plus the authenticated user and include
helpers for email verification and password resets.

#### registerUser

```graphql
mutation {
  registerUser(
    input: {
      email: "alice@example.com"
      password: "P@ssw0rd"
      gender: "FEMALE"
      dob: "1990-01-01"
    }
  ) {
    data {
      accessToken
      refreshToken
      user {
        id
        email
      }
    }
  }
}
```

#### login

```graphql
mutation {
  login(email: "alice@example.com", password: "P@ssw0rd") {
    data {
      accessToken
      refreshToken
      user {
        id
        email
      }
    }
  }
}
```

#### refreshToken

> Requires `Authorization: Bearer <accessToken>` header

```graphql
mutation {
  refreshToken(refreshToken: "<refresh_token>") {
    data {
      accessToken
    }
  }
}
```

#### verifyEmail

```graphql
mutation {
  verifyEmail(token: "<verification_token>") {
    data {
      message
    }
  }
}
```

#### resendVerificationEmail

```graphql
mutation {
  resendVerificationEmail(token: "<existing_token>") {
    data {
      message
    }
  }
}
```

#### forgotPassword

```graphql
mutation {
  forgotPassword(email: "alice@example.com") {
    data {
      message
    }
  }
}
```

#### resetPassword

```graphql
mutation {
  resetPassword(token: "<reset_token>", password: "N3wPass!") {
    data {
      message
    }
  }
}
```

Additional auth helpers exposed by `AuthResolver` include `logout` for session
termination.

### Medication management (`MedicationResolver`)

- `medications` (`MedicationListResponse`) – lists the authenticated user's
  medications with linked schedule metadata under `data`.
- `medication(id: ID!)` (`MedicationResponse`) – loads a single medication the user
  owns, including schedule context.
- `createMedication`, `updateMedication`, `deleteMedication` – persist medication
  records; each returns a `MedicationResponse` so `data` is the saved medication.
- `registerMedicationWithAi` (`MedicationWithScheduleResponse`) – invokes the AI
  plan analyzer plus `ScheduleService` to create the medication, create an initial
  schedule, and return both objects (and generated `doseTimes`) inside `data`.

### Schedule planning (`ScheduleResolver`)

- `schedule(medicationId: ID!)` (`ScheduleResponse`) – fetches the active schedule
  tied to a medication the user owns.
- `createSchedule`, `updateSchedule`, `deleteSchedule` – manage cadence settings and
  generated dose times; each mutation returns the latest `Schedule` instance in
  the `data` field.

### Dose tracking (`DoseActionResolver`)

- `doseActions(medicationId: ID!)` (`DoseActionListResponse`) – lists recorded dose
  actions for the requested medication.
- `logDoseAction`, `updateDoseAction`, `deleteDoseAction` – create or adjust dose
  adherence outcomes; each mutation returns the affected `DoseAction` in `data`.
- `doseTimesByDate(date: String!)` (`DoseTimeWithActionsListResponse`) – aggregates
  scheduled dose times and their recorded actions for a single calendar day.
- `doseTimesByDateRange(startDate: String!, endDate: String!)` – produces the same
  aggregation across a broader range so clients can build adherence charts.
- `doseActionsByDoseTime(doseTimeId: ID!)` (`DoseActionListResponse`) – shows every
  action that references a particular scheduled time.

### AI assistance & conversations (`AiResolver`)

- `parseMedicationLabel(label: String!)` (`ParselabelResponse`) – converts free-form
  label text into normalized fields like `name`, `strength`, `quantity`, and
  `instructions` inside `data`.
- `structureMedicationInstruction(instruction: String!, medicationName?: String)`
  (`InstructionResponse`) – restructures natural-language directions into a
  codified `MedicationInstruction` (`doseUnit`, timing hints, `asNeeded`, etc.).
- `getMedicationInfo(prompt: String!, conversationId?: String)`
  (`MedicationInfoResponse`) – continues or starts an AI-powered medication
  conversation, returning the updated message history and `conversationId`.
- `aiConversations()` (`AiConversationListResponse`) – lists stored conversation
  summaries for the authenticated user so clients can render history screens.
- `aiConversation(conversationId: String!)` (`AiConversationResponse`) – retrieves a
  single conversation and its messages.
- `deleteConversation(conversationId: String!)` (`DeleteConversationResponse`) –
  removes a saved session and echoes the deleted `conversationId` in `data`.

### Device tokens (`DeviceResolver`)

- `registerPushToken(input: RegisterPushTokenInput!)` (`DeviceResponse`) – upserts
  Expo push tokens along with platform metadata so reminders can be delivered.

### User preferences (`UserResolver`)

- `getUser()` (`UserResponse`) – returns the authenticated user's profile and
  stored notification preferences under `data`.
- `updateUserPreferences(input: UpdateUserPreferencesInput!)` (`UserResponse`) –
  persists breakfast, lunch, dinner, exercise, and bedtime routines that tailor
  AI schedule generation.

---

## 🤖 AI-Powered Label Parsing

1. Expo client scans prescription label text
2. Frontend sanitizes text (removes PHI)
3. Calls the `parseMedicationLabel` GraphQL mutation:

```graphql
mutation {
  parseMedicationLabel(label: "Take Lisinopril 10mg daily at 9 AM for 30 days") {
    data {
      name
      strength
      quantity
      instructions
      therapy
    }
  }
}
```

**Sample Response**

```json
{
  "data": {
    "parseMedicationLabel": {
      "data": {
        "name": "Lisinopril",
        "strength": "10 mg",
        "quantity": "30",
        "instructions": "Take 1 tablet daily at 9 AM",
        "therapy": ""
      },
      "success": true,
      "errors": []
    }
  }

}
```

This example explicitly requests the `strength` field so clients receive the
normalized dosage amount alongside the other label details returned in `data`.

Beyond label parsing, the `AiResolver` includes helpers for instruction
structuring and medication-information conversations:

```graphql
mutation {
  structureMedicationInstruction(
    instruction: "Take 2 tablets twice daily as needed for headaches",
    medicationName: "Ibuprofen"
  ) {
    data {
      medicationName
      doseQuantity
      doseUnit
      timing {
        frequency
        periodUnit
        timeOfDay
      }
      asNeeded {
        boolean
        reason
      }
    }
  }
}
```

```graphql
mutation {
  getMedicationInfo(
    prompt: "What side effects should I watch for with Lisinopril?"
  ) {
    data {
      conversationId
      title
      messages {
        role
        content
      }
    }
  }
}
```

Pair the `getMedicationInfo` mutation with the `aiConversations` and
`aiConversation` queries (and `deleteConversation` mutation) documented above to
restore earlier chats or clean up saved AI sessions on behalf of the user.

### Reminder Dispatch (`ReminderService`)

The `generateReminders` cron job evaluates each scheduled dose within the next
24 hours, guaranteeing that every upcoming time has a corresponding
`DoseAction` marked as `PENDING`. For each reminder window it:

1. Checks existing `notificationLog` entries to avoid duplicate sends.
2. Sends Expo push notifications or Twilio SMS when the user has opted in.
3. Records misses for users who prefer a channel but cannot be reached (for
   example, missing Expo credentials or phone numbers).

When a reminder succeeds, the log captures metadata about the delivery channel
and payload so the mobile client can present an accurate history.


---

## 🔔 Reminder Roadmap

The current reminder workflow focuses on generating pending dose actions,
logging delivery attempts, and dispatching push/SMS alerts. Future iterations
may extend this module with snooze actions and richer analytics. Contributions
are welcome—see [`src/reminder`](src/reminder) for entry points.


---

## 🚧 Todo / Enhancements

- [ ] Snooze reminders via app action
- [ ] Dashboard analytics (adherence rate)
- [ ] Refill request workflow
- [ ] Support multi-device push

---

## 🌟 Credits
- ❤️ Powered by NestJS, Prisma, JWT-based auth, and OpenAI

---

## 📝 License

MIT
