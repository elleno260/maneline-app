# ManeLine Stylist Platform MVP Files

Copy these files into your `pivot/stylist-platform` branch.

## Assumptions

- Your project uses Expo Router.
- Your project has a root `firebaseConfig.ts` file.
- Your Firebase config exports:
  - `auth`
  - `db`
  - `storage` if you use photos later
  - `geminiModel` for Firebase AI Logic / Gemini
- Your TypeScript alias supports `@/*`. If not, add it to `tsconfig.json` or replace `@/` imports with relative paths.

## File structure

```txt
types/client.types.ts
services/clientService.ts
services/clientAiService.ts
store/clientStore.ts
components/ui/Screen.tsx
components/ui/Card.tsx
components/ui/PrimaryButton.tsx
components/ui/AppTextInput.tsx
app/stylist/_layout.tsx
app/stylist/index.tsx
app/stylist/clients.tsx
app/stylist/client/new.tsx
app/stylist/client/[clientId]/index.tsx
app/stylist/client/[clientId]/log-visit.tsx
app/stylist/client/[clientId]/ai.tsx
app/client/index.tsx
app/client/regimen.tsx
firestore/firestore.rules
```

## Next build order

1. Confirm Firebase exports are correct.
2. Add the files.
3. Run TypeScript.
4. Navigate to `/stylist`.
5. Add a client.
6. Log a visit.
7. Generate an AI recommendation.
8. Share the regimen to the client profile.
