# Leading School Mental Health — Live Workshop Website

A responsive React/Vite workshop website with:
- Anonymous participant access using a six-character room code or QR code
- Moderator-controlled question release (one question at a time)
- 12 MCQs split into six perceived-factor scenarios and six school-leadership practice scenarios
- Supabase database storage and realtime response updates
- Live answer distribution charts on the moderator dashboard
- A final report after the moderator ends the workshop, with perceived-factor distribution charts, leadership-practice alignment charts and discussion prompts

## Important deployment/security note

This is a deployable starter project, not a hosted website. You must connect your own Supabase project and deploy it. Moderator room creation and question release are handled by Supabase Edge Functions. Moderator PIN hashes are stored in a private table, not exposed to browser clients. For stronger public deployment security, use individual Supabase Auth moderator accounts, add rate-limiting/abuse controls, and monitor database access. Do not collect students' mental-health details or other sensitive personal information.

## 1. Create the database

1. Create a project at https://supabase.com.
2. Open **SQL Editor** in the Supabase dashboard.
3. Paste and run `supabase/schema.sql`.
4. In **Project Settings → API**, copy the Project URL and anon/publishable key.
5. Deploy the two Edge Functions in `supabase/functions/create-room` and `supabase/functions/moderator-action` using the Supabase CLI. Set the `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` function secrets. The service-role key must remain server-side and must never be added to `.env` or Vite variables.

## 2. Configure the website

1. Install Node.js (LTS).
2. In this folder, create a file named `.env` based on `.env.example`.
3. Set:
   - `VITE_SUPABASE_URL` to your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` to your Supabase anon/publishable key
4. Install dependencies and run locally:

```bash
npm install
npm run dev
```

Vite prints a local development URL. Open it to test the moderator and participant flows.

### Deploy Edge Functions

From the project folder, after installing and logging in to the Supabase CLI:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set SUPABASE_URL=https://YOUR-PROJECT.supabase.co SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
supabase functions deploy create-room
supabase functions deploy moderator-action
```

Keep the service-role key private. Do not commit it to GitHub.

## 3. Deploy to Vercel

1. Upload this project to a private GitHub repository.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Add the two environment variables from `.env` in Vercel Project Settings → Environment Variables.
4. Deploy. The `vercel.json` file provides SPA routing.
5. Open the deployed URL, create a workshop, and share the generated QR code or link.

## 4. Workshop workflow

1. Moderator opens the deployed website and selects **Create a workshop**.
2. Moderator sets a workshop title and a private PIN, then creates the room.
3. Moderator shares the QR code or six-character code.
4. Participants scan the QR code, join anonymously and wait in the lobby.
5. Moderator releases Q1, then Q2, and so on. Participants see only the currently released question.
6. The moderator dashboard updates the answer bars as responses arrive.
7. Moderator selects **End workshop** after Q12.

## 5. How the final analysis works

- Questions 1–6 map each selected option to one of six perceived influencing-factor categories: academic pressure, peer relationships, family/home circumstances, school climate and safety, teacher relationships/support, and access to help.
- The factor chart shows how often each category was selected across submitted answers to Questions 1–6.
- Questions 7–12 each map to one leadership practice domain: early identification, safeguarding/referral, privacy/trust, equity/access, collaboration/student voice, and monitoring/evaluation.
- The leadership chart shows the percentage of submitted answers that selected the recommended response in each scenario.
- The report appears in the moderator dashboard after **End workshop** is selected.

These are workshop discussion indicators, not a validated mental-health screening instrument, a measure of student prevalence, proof of causation, or a validated measure of leadership competence. Interpret findings alongside local context, student voice and qualified professional guidance.

## 6. Notes

- The current charts show counts and percentages for the currently released question.
- Question 2 accepts exactly two choices; its percentages are based on total selections for that question and can add up to 200%.
- Responses are anonymous and stored with a random browser-generated participant token, not a name.
- The prototype does not currently prevent a participant from using multiple devices/tokens, and does not provide an individual score.
- Realtime updates require the Supabase Realtime publication to include both tables.
- Do not use the platform to collect identifiable student mental-health disclosures.
