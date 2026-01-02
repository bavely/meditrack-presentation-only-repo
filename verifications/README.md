# Verification Front-End

A React-based interface for verifying user accounts and resetting passwords. It communicates with a GraphQL API to confirm email addresses and allow users to set new passwords.

## Key Features
- Email verification
- Password reset

## Tech Stack
- React
- TypeScript
- Vite
- Apollo Client
- React Router
- Tailwind CSS

## Environment Variables
Create a `.env` file in the project root and define:

```
VITE_GRAPHQL_API_URL=<GraphQL endpoint>
```

## Installation
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Build for production:
   ```bash
   npm run build
   ```
4. Preview the production build:
   ```bash
   npm run preview
   ```

## Project Structure
```
├── src
│   ├── components
│   │   └── ui
│   ├── pages
│   └── lib
├── public
└── ...
```

## Available Scripts
- `npm run dev` – start development server
- `npm run build` – type-check and bundle the app
- `npm run preview` – preview the production build
- `npm run lint` – run ESLint on the codebase

## Contributing
1. Fork the repository and create a branch for your feature or fix.
2. Run `npm run lint` and `npm run build` before submitting a PR.
3. Describe your changes in the pull request.

## Testing
No automated test suite is currently provided. Please rely on linting and the build process to catch issues.
