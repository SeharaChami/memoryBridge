# MemoryBridge

MemoryBridge is a gentle, single-user web companion for one older adult living with Alzheimer’s dementia. A caregiver enters a handful of true life memories once; after that, the person simply opens MemoryBridge and talks with **Mia**—a warm, familiar voice and face who never sounds clinical, never “corrects” confusion, and never talks about being artificial intelligence.

This repository contains a small **Express** API (`backend/`) and a **React + Vite** single-page app (`frontend/`). Mia’s words are generated with **Google Gemini**, grounded in the saved memories stored in **Supabase**. Mia’s voice is synthesized with **ElevenLabs** on the server so API keys stay private. **Beyond Presence** can be embedded as Mia’s visual presence when you configure an agent ID.

## Prerequisites

- **Node.js 18+** (recommended 20 LTS) and npm
- A **Supabase** project
- A **Google Gemini** API key with access to `gemini-1.5-pro` (or update the model string in `backend/src/services/gemini.js` if your account requires a newer model name)
- An **ElevenLabs** API key (for server-side text-to-speech)
- A **Beyond Presence** account if you want the embedded avatar experience (optional but recommended)

## Supabase setup

1. Create a new Supabase project.
2. Open the SQL editor and run the migration in `[backend/supabase/migrations/init.sql](supabase/migrations/init.sql)`.
3. Choose **one** of the following approaches so the API can read and write data:

### Option A (recommended): service role key on the server only

Add `**SUPABASE_SERVICE_ROLE_KEY`** to `backend/.env` (copy from Supabase **Project Settings → API → service_role**). **Never** expose this key in the browser or commit it to git.

The backend automatically prefers `SUPABASE_SERVICE_ROLE_KEY` and falls back to `SUPABASE_ANON_KEY` if the service role is not set.

### Option B: anon key with permissive policies (demo only)

If you insist on using only the anon key from the backend, you must add Row Level Security policies that allow the anon role to read/write these tables. The following is intentionally broad and is suitable only for a tightly controlled demo:

```sql
alter table user_profile enable row level security;
alter table memories enable row level security;
alter table conversation_logs enable row level security;

create policy "demo_all_user_profile" on user_profile for all using (true) with check (true);
create policy "demo_all_memories" on memories for all using (true) with check (true);
create policy "demo_all_conversation_logs" on conversation_logs for all using (true) with check (true);
```

## Backend setup

```bash
cd backend
cp .env.example .env
# Fill in SUPABASE_URL, keys, GEMINI_API_KEY, ELEVENLABS_API_KEY, optional ELEVENLABS_VOICE_ID, PORT
npm install
npm run dev
```

The API listens on `http://localhost:5000` by default.

### Health check

`GET http://localhost:5000/health` returns `{ "ok": true }`.

## Frontend setup

```bash
cd frontend
cp .env.example .env
# Set VITE_API_BASE_URL to your API (default http://localhost:5000)
# Optionally set VITE_BEYOND_PRESENCE_AGENT_ID for the embedded avatar iframe
npm install
npm run dev
```

The SPA runs on `http://localhost:5173` by default.

## Caregiver: first-time setup

1. Start the backend and frontend dev servers.
2. Open the MemoryBridge site. If no profile exists yet, you will land on `**/setup**` automatically.
3. Enter the name Mia should use (for example, “Maria”).
4. Add at least **five** meaningful memories with categories and emotional weights.
5. Tap **Save & Start Mia →**. You will be taken to `**/home`**, where Mia greets automatically.

From `**/home`**, the small **settings** control opens a caregiver panel where you can **edit setup** or **reset everything**.

## Daily use for the older adult

1. Open MemoryBridge on a familiar device (tablet or laptop works well).
2. Wait a moment: Mia greets by name and mentions a warm memory.
3. **Press and hold** “Talk to Mia,” speak, then release. Mia answers in short, gentle sentences and her words appear on screen as well as through the speaker.
4. If the browser blocks autoplay audio the first time, tap **Tap to hear Mia** once—after that, audio should behave more predictably on that device.

## API overview


| Method   | Path                | Purpose                                                                      |
| -------- | ------------------- | ---------------------------------------------------------------------------- |
| `GET`    | `/api/status`       | Whether setup is complete and the preferred name                             |
| `POST`   | `/api/setup`        | Save profile + memories (minimum five)                                       |
| `GET`    | `/api/memories`     | List saved memories (used for editing)                                       |
| `POST`   | `/api/conversation` | Send a user line (or the internal greeting sentinel) and receive Mia’s reply |
| `POST`   | `/api/tts`          | Synthesize Mia’s latest reply as MP3 audio (ElevenLabs)                      |
| `DELETE` | `/api/setup/reset`  | Remove all profile, memories, and conversation logs                          |


## Beyond Presence + ElevenLabs note

The embedded Beyond Presence iframe (`https://bey.chat/{agent-id}`) provides a rich visual agent experience. MemoryBridge **always** plays Mia’s **Gemini-authored** lines through the **ElevenLabs** pipeline so the spoken words match the on-screen text exactly. If your Beyond Presence agent is also configured to speak out loud, you may hear two voices; in that case, adjust or mute the agent inside the Beyond Presence dashboard.

## Model compatibility

If Google returns an error that the `gemini-1.5-pro` model is unavailable for your key or project, update the model name in `[backend/src/services/gemini.js](src/services/gemini.js)` to the closest supported replacement suggested in the error message.