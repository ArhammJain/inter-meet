<h1 align="center" id="title">InterMeet</h1>

<div align="center">
   
<p align="center"><img src="https://socialify.git.ci/ArhammJain/inter-meet/image?custom_language=Next.js&language=1&name=1&owner=1&pattern=Solid&stargazers=1&theme=Dark" alt="inter-meet" width="640" height="320" /></p>

**InterMeet: A sophisticated, real time video conferencing platform built for the modern web**

[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![LiveKit](https://img.shields.io/badge/LiveKit-2.17.1-00A4CC?style=for-the-badge)](https://livekit.io/)
[![Supabase](https://img.shields.io/badge/Supabase-2.95.3-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
</div>

---

## ✨ Overview

InterMeet is a production ready video conferencing application that combines **enterprise-grade security** with a **premium user experience**. Built on Next.js 16's App Router with LiveKit's WebRTC infrastructure and Supabase's real time database, it delivers sub second latency communication with a sophisticated "Pure Black" OLED optimized interface.

### Design Philosophy

- 🎨 **Pure Black Aesthetic**: True `#000000` backgrounds with glassmorphism effects for OLED displays
- 📱 **Mobile-First**: Responsive design using `dvh` (Dynamic Viewport Height) units
- ⚡ **Performance-Driven**: React 19 Server Components with optimistic UI updates
- 🔒 **Security-First**: Row-Level Security (RLS) policies, rate limiting, and encrypted sessions

---

## 🎯 Key Features

### 🎥 Real-Time Communication

- **WebRTC Video/Audio**: LiveKit-powered with automatic bandwidth adaptation and sub-second latency
- **Active Speaker Detection**: Visual emerald ring glow effect with smooth CSS transitions
- **Adaptive Grid Layouts**: Responsive participant grids (1×1, 2×2, up to 3×3) with focus view
- **Screen Sharing**: Browser display capture with `getDisplayMedia` API (desktop only)
- **Pin Participants**: Click to pin any participant to the main stage view

### 💬 Interactive Features

- **Emoji Reactions**: 8 floating emojis (`👍 👏 😂 ❤️ 🎉 🔥 😮 ✋`) via LiveKit data channels
- **Real-Time Chat**: Persistent messaging with 1000-character limit, stored in Supabase
- **Hand Raise System**: Non-verbal signaling with visual indicators and data channel sync
- **Participant List**: Live roster with mic/camera/speaking status and hand-raised indicators

### 🛡️ Advanced Room Features

- **Waiting Room (Lobby)**: Host can admit/reject participants before they join
- **Password Protection**: Optional room passcodes with creator exemption
- **Room Expiry**: 24-hour automatic expiration for non-persistent rooms
- **Participant Limits**: Configurable max participants (1-50, default 10)
- **Rate Limiting**: 10 token requests per user per minute (in-memory)

### 🎨 Premium UI/UX

- **Multi-Stage Flow**: Pre-join device check → Password/Lobby (if needed) → Connecting → Meeting
- **Glassmorphism Design**: `backdrop-blur-2xl` overlays with `bg-white/80` (light) or `bg-zinc-900/60` (dark)
- **Camera Preview**: Live video/audio preview with toggle controls before joining
- **Keyboard Shortcuts**: `M` (mute), `V` (video), `L` (leave) while in meeting
- **Mobile Optimizations**: Touch-friendly controls, portrait layout, iOS zoom prevention (`text-base` inputs)

---

## 🏗️ Architecture

### Tech Stack

```
┌─────────────────────────────────────────────────────────┐
│            Next.js 16.1.6 App Router                    │
│     (React 19.2.3 + Server Components)                  │
├─────────────────────────────────────────────────────────┤
│  LiveKit Client 2.17.1    Supabase 2.95.3               │
│  - useTracks()            - @supabase/ssr 0.8.0         │
│  - useSpeakingParticipants - auth.getUser()             │
│  - VideoTrack             - PostgreSQL + RLS            │
│  - RoomAudioRenderer      - Storage API                 │
├─────────────────────────────────────────────────────────┤
│  LiveKit Server SDK 2.15.0 (Token Generation)           │
│  - AccessToken class with metadata & grants             │
├─────────────────────────────────────────────────────────┤
│  Tailwind CSS 4.1.18 + TypeScript 5 + Framer Motion 12  │
└─────────────────────────────────────────────────────────┘
```

### Core Dependencies

| Package                     | Purpose                                    | Version     |
| --------------------------- | ------------------------------------------ | ----------- |
| `next`                      | React framework with App Router            | **16.1.6**  |
| `react` / `react-dom`       | UI library with latest features            | **19.2.3**  |
| `@livekit/components-react` | Pre-built video conferencing UI components | **2.9.19**  |
| `livekit-client`            | WebRTC client SDK                          | **2.17.1**  |
| `livekit-server-sdk`        | Server-side token generation               | **2.15.0**  |
| `@supabase/ssr`             | Server-side auth for Next.js               | **0.8.0**   |
| `@supabase/supabase-js`     | Supabase client library                    | **2.95.3**  |
| `tailwindcss`               | Utility-first CSS framework                | **4.1.18**  |
| `framer-motion`             | Animation library                          | **12.34.0** |
| `lucide-react`              | Icon library                               | **0.563.0** |
| `next-themes`               | Theme switching utility                    | **0.4.6**   |

### Development Tools

| Tool               | Purpose            |
| ------------------ | ------------------ |
| `@playwright/test` | End-to-end testing |
| `eslint`           | Code linting       |
| `typescript`       | Type safety        |

---

## 📂 Project Structure

```
inter-meet/
│
├── app/
│   ├── (auth)/                 # Authentication routes group
│   │   ├── login/              # Login page
│   │   └── signup/             # Signup page
│   │
│   ├── dashboard/
│   │   ├── page.tsx            # Main hub (Create/Join meeting, 6-char codes)
│   │   └── profile/
│   │       └── page.tsx        # User profile management, avatar upload
│   │
│   ├── room/[code]/
│   │   └── page.tsx            # Multi-stage meeting room component
│   │                           # Stages: prejoin → lobby → password →
│   │                           #         connecting → connected → error
│   │
│   ├── api/
│   │   ├── livekit/
│   │   │   └── route.ts        # POST: Token generation with JWT
│   │   │                       # Features: rate limit, room validation,
│   │   │                       #          password check, lobby check,
│   │   │                       #          participant tracking
│   │   └── chat/
│   │       └── route.ts        # GET/POST: Chat messages API
│   │
│   ├── globals.css             # Tailwind imports + CSS variables
│   ├── layout.tsx              # Root layout with Supabase provider
│   └── page.tsx                # Landing page with hero + animated grid
│
├── components/
│   ├── MeetingView.tsx         # Core meeting UI (819 lines)
│   │                           # - Grid layout logic (mobile/desktop)
│   │                           # - Control bar (mic, cam, screen, reactions)
│   │                           # - Active speaker detection
│   │                           # - Pin participant feature
│   │                           # - Emoji reactions system
│   │
│   ├── ChatSidebar.tsx         # Real-time chat panel
│   │                           # - Message polling (3s interval)
│   │                           # - Send messages with 1000 char limit
│   │                           # - Visual distinction: me vs others
│   │
│   ├── ParticipantList.tsx     # Live participant roster
│   │                           # - Mic/camera/speaking indicators
│   │                           # - Hand raise badges
│   │                           # - Participant count
│   │
│   ├── Navbar.tsx              # Dynamic navigation bar
│   │                           # - User menu dropdown
│   │                           # - Theme switcher
│   │
│   ├── Background.tsx          # Animated gradient backgrounds
│   ├── Toast.tsx               # Toast notification system
│   │
│   └── ui/
│       ├── GlassCard.tsx       # Reusable glassmorphism container
│       └── ...                 # Other UI primitives
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser Supabase client
│   │   ├── server.ts           # Server-side client (cookies)
│   │   └── middleware.ts       # Auth middleware
│   │
│   └── utils.ts                # Helper functions (cn, etc.)
│
├── public/
│   ├── grid.svg                # Grid pattern overlay
│   └── ...                     # Static assets
│
├── package.json                # Dependencies and scripts
├── tailwind.config.ts          # Tailwind configuration
├── tsconfig.json               # TypeScript configuration
└── next.config.ts              # Next.js configuration
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.17 or later
- **npm** / **yarn** / **pnpm** / **bun**
- **LiveKit Cloud** account (or self-hosted instance)
- **Supabase** project

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/inter-meet.git
   cd inter-meet
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Configure environment variables**

   Create `.env.local` in the project root:

   ```env
   # ========================================
   # LiveKit Configuration
   # ========================================
   # Get these from: https://cloud.livekit.io/projects

   NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
   LIVEKIT_API_KEY=APIxxxxxxxxxx
   LIVEKIT_API_SECRET=your_secret_key_here

   # ========================================
   # Supabase Configuration
   # ========================================
   # Get these from: https://supabase.com/dashboard/project/_/settings/api

   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

   # Optional: For server-side operations (if needed)
   # SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   **Security Notes**:
   - Never commit `.env.local` to version control
   - Use different credentials for development vs production
   - The `NEXT_PUBLIC_*` variables are exposed to the browser
   - Keep `LIVEKIT_API_SECRET` and service role keys private

4. **Set up Supabase database**

   Run the following SQL in your Supabase SQL Editor:

   ```sql
   -- =====================================================
   -- InterMeet Database Schema
   -- =====================================================

   -- Profiles table (user metadata)
   CREATE TABLE profiles (
     id UUID NOT NULL,
     email TEXT NOT NULL UNIQUE,
     full_name TEXT,
     avatar_url TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW(),
     CONSTRAINT profiles_pkey PRIMARY KEY (id),
     CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
   );

   -- Rooms table (meeting rooms)
   CREATE TABLE rooms (
     id UUID NOT NULL DEFAULT uuid_generate_v4(),
     name TEXT NOT NULL,
     room_code TEXT NOT NULL UNIQUE,
     creator_id UUID NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     is_active BOOLEAN DEFAULT TRUE,
     max_participants INTEGER DEFAULT 10 CHECK (max_participants > 0 AND max_participants <= 50),
     parent_room_id UUID,  -- For future breakout room support
     is_persistent BOOLEAN DEFAULT FALSE,
     password_hash TEXT,
     waiting_room_enabled BOOLEAN DEFAULT FALSE,
     CONSTRAINT rooms_pkey PRIMARY KEY (id),
     CONSTRAINT rooms_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES auth.users(id),
     CONSTRAINT rooms_parent_room_id_fkey FOREIGN KEY (parent_room_id) REFERENCES rooms(id)
   );

   -- Participants table (track who joined/left)
   CREATE TABLE participants (
     id UUID NOT NULL DEFAULT uuid_generate_v4(),
     room_id UUID NOT NULL,
     user_id UUID NOT NULL,
     joined_at TIMESTAMPTZ DEFAULT NOW(),
     left_at TIMESTAMPTZ,
     CONSTRAINT participants_pkey PRIMARY KEY (id),
     CONSTRAINT participants_room_id_fkey FOREIGN KEY (room_id) REFERENCES rooms(id),
     CONSTRAINT participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
   );

   -- Lobby table (waiting room entries)
   CREATE TABLE lobby (
     id UUID NOT NULL DEFAULT gen_random_uuid(),
     room_id UUID NOT NULL,
     user_id UUID NOT NULL,
     display_name TEXT NOT NULL DEFAULT 'Anonymous',
     status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'admitted', 'rejected')),
     created_at TIMESTAMPTZ DEFAULT NOW(),
     CONSTRAINT lobby_pkey PRIMARY KEY (id),
     CONSTRAINT lobby_room_id_fkey FOREIGN KEY (room_id) REFERENCES rooms(id),
     CONSTRAINT lobby_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
   );

   -- Messages table (in-meeting chat)
   CREATE TABLE messages (
     id UUID NOT NULL DEFAULT uuid_generate_v4(),
     room_id UUID NOT NULL,
     user_id UUID NOT NULL,
     sender_name TEXT NOT NULL,
     content TEXT NOT NULL CHECK (char_length(content) <= 1000),
     created_at TIMESTAMPTZ DEFAULT NOW(),
     CONSTRAINT messages_pkey PRIMARY KEY (id),
     CONSTRAINT messages_room_id_fkey FOREIGN KEY (room_id) REFERENCES rooms(id),
     CONSTRAINT messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
   );

   -- =====================================================
   -- Row Level Security (RLS) Policies
   -- =====================================================

   -- Enable RLS on all tables
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
   ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
   ALTER TABLE lobby ENABLE ROW LEVEL SECURITY;
   ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

   -- Profiles policies
   CREATE POLICY "Users can view own profile"
     ON profiles FOR SELECT
     USING (auth.uid() = id);

   CREATE POLICY "Users can insert own profile"
     ON profiles FOR INSERT
     WITH CHECK (auth.uid() = id);

   CREATE POLICY "Users can update own profile"
     ON profiles FOR UPDATE
     USING (auth.uid() = id);

   -- Rooms policies
   CREATE POLICY "Anyone can view active rooms"
     ON rooms FOR SELECT
     USING (is_active = TRUE);

   CREATE POLICY "Authenticated users can create rooms"
     ON rooms FOR INSERT
     WITH CHECK (auth.uid() = creator_id);

   CREATE POLICY "Creators can update their rooms"
     ON rooms FOR UPDATE
     USING (auth.uid() = creator_id);

   CREATE POLICY "Creators can delete their rooms"
     ON rooms FOR DELETE
     USING (auth.uid() = creator_id);

   -- Participants policies
   CREATE POLICY "Users can view participants in their rooms"
     ON participants FOR SELECT
     USING (TRUE);  -- Public read for room participants

   CREATE POLICY "Users can insert themselves as participants"
     ON participants FOR INSERT
     WITH CHECK (TRUE);

   CREATE POLICY "Users can update their own participation"
     ON participants FOR UPDATE
     USING (auth.uid() = user_id);

   -- Lobby policies
   CREATE POLICY "Users can read own lobby status"
     ON lobby FOR SELECT
     USING (auth.uid() = user_id);

   CREATE POLICY "Users can request to join lobby"
     ON lobby FOR INSERT
     WITH CHECK (auth.uid() = user_id);

   CREATE POLICY "Creators can read lobby for their rooms"
     ON lobby FOR SELECT
     USING (
       EXISTS (
         SELECT 1 FROM rooms
         WHERE rooms.id = lobby.room_id
         AND rooms.creator_id = auth.uid()
       )
     );

   CREATE POLICY "Creators can update lobby for their rooms"
     ON lobby FOR UPDATE
     USING (
       EXISTS (
         SELECT 1 FROM rooms
         WHERE rooms.id = lobby.room_id
         AND rooms.creator_id = auth.uid()
       )
     );

   -- Messages policies
   CREATE POLICY "Participants can view messages"
     ON messages FOR SELECT
     USING (TRUE);

   CREATE POLICY "Participants can insert messages"
     ON messages FOR INSERT
     WITH CHECK (auth.uid() = user_id);

   -- =====================================================
   -- Indexes for Performance
   -- =====================================================

   CREATE INDEX idx_rooms_code ON rooms(room_code);
   CREATE INDEX idx_rooms_creator ON rooms(creator_id);
   CREATE INDEX idx_participants_room ON participants(room_id);
   CREATE INDEX idx_participants_user ON participants(user_id);
   CREATE INDEX idx_lobby_room ON lobby(room_id);
   CREATE INDEX idx_messages_room ON messages(room_id);
   ```

   **Note**: The `parent_room_id` column in `rooms` is reserved for future breakout room functionality but is not currently implemented in the UI.

5. **Configure Supabase Storage (for avatars)**

   In your Supabase Dashboard:
   1. Go to **Storage** → **Create Bucket**
   2. Bucket name: `avatars`
   3. Enable **Public bucket**
   4. Save

   Add this RLS policy for the storage bucket:

   ```sql
   -- Allow users to upload their own avatars
   CREATE POLICY "Users can upload own avatar"
   ON storage.objects FOR INSERT
   WITH CHECK (
     bucket_id = 'avatars' AND
     auth.uid()::text = (storage.foldername(name))[1]
   );

   -- Allow public read access to avatars
   CREATE POLICY "Public avatar access"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'avatars');
   ```

6. **Run the development server**

   ```bash
   npm run dev
   ```

7. **Open the application**

   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 🎨 Customization

### Theme Configuration

InterMeet uses a custom "Pure Black" theme. Modify `app/globals.css`:

```css
:root {
  --background: 0 0% 0%; /* Pure black (#000000) */
  --foreground: 0 0% 100%; /* White text */
  --accent: 142 76% 36%; /* Green accent */
  /* ... */
}
```

### Tailwind Configuration

Extend `tailwind.config.ts` for custom utilities:

```typescript
export default {
  theme: {
    extend: {
      colors: {
        "pure-black": "#000000",
        "glass-white": "rgba(255, 255, 255, 0.1)",
      },
      backdropBlur: {
        glass: "20px",
      },
    },
  },
};
```

---

## 🔧 Key Implementation Details

### 1. LiveKit Token Generation (API Route)

**File**: `app/api/livekit/route.ts`

```typescript
// Token generation with full security checks
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Rate limiting (10 requests/min per user)
  if (!checkRateLimit(user.id)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // 2. Room validation (6-char code, active status)
  const { roomCode, password } = await request.json();
  const room = await fetchRoomWithFallback(roomCode);

  // 3. Room expiry check (24h for non-persistent rooms)
  if (!room.is_persistent && isExpired(room.created_at)) {
    await deactivateRoom(room.id);
    return NextResponse.json({ error: "Meeting expired" }, { status: 410 });
  }

  // 4. Password verification (creator exempt)
  if (room.password_hash && room.creator_id !== user.id) {
    if (password !== room.password_hash) {
      return NextResponse.json(
        {
          error: "Incorrect password",
          requiresPassword: true,
        },
        { status: 403 },
      );
    }
  }

  // 5. Lobby/waiting room check
  if (room.waiting_room_enabled && room.creator_id !== user.id) {
    const lobbyEntry = await checkLobbyStatus(room.id, user.id);
    if (lobbyEntry?.status !== "admitted") {
      return NextResponse.json(
        {
          error: "Waiting for host",
          requiresLobby: true,
        },
        { status: 403 },
      );
    }
  }

  // 6. Participant limit enforcement
  const currentCount = await getActiveParticipantCount(room.id);
  if (currentCount >= room.max_participants) {
    return NextResponse.json({ error: "Meeting is full" }, { status: 403 });
  }

  // 7. Generate JWT token with metadata
  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    {
      identity: user.id,
      name: user.user_metadata?.full_name || user.email,
      metadata: JSON.stringify({ avatar_url: profile?.avatar_url }),
      ttl: "6h",
    },
  );

  token.addGrant({
    roomJoin: true,
    room: roomCode,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true, // Required for reactions & hand raise
  });

  return NextResponse.json({
    token: await token.toJwt(),
    isCreator: room.creator_id === user.id,
  });
}
```

---

### 2. Active Speaker Detection

**File**: `components/MeetingView.tsx`

```typescript
import { useSpeakingParticipants } from '@livekit/components-react'

const activeSpeakers = useSpeakingParticipants()

// Border ring with emerald glow for active speakers
<div className={`
  ${activeSpeakers.some(p => p.identity === track.participant.identity)
    ? 'border-emerald-500 ring-2 ring-emerald-500/50 shadow-[0_0_30px_-10px_rgba(16,185,129,0.5)]'
    : 'border-white/5 ring-1 ring-white/5'
  }
`}>
```

---

### 3. Emoji Reactions System

**Broadcasting reactions**:

```typescript
const sendReaction = useCallback(
  (emoji: string) => {
    // Local state update for immediate feedback
    setReactions((prev) => new Map(prev).set(localParticipant.identity, emoji));

    // Broadcast to all participants via data channel
    room.localParticipant.publishData(
      new TextEncoder().encode(JSON.stringify({ type: "reaction", emoji })),
      { reliable: true },
    );

    // Auto-clear after 4 seconds
    setTimeout(() => {
      setReactions((prev) => {
        const newMap = new Map(prev);
        newMap.delete(localParticipant.identity);
        return newMap;
      });
    }, 4000);
  },
  [room],
);
```

**Receiving reactions**:

```typescript
useEffect(() => {
  const onData = (payload: Uint8Array, participant?: Participant) => {
    const msg = JSON.parse(new TextDecoder().decode(payload));
    if (msg.type === "reaction") {
      setReactions((prev) =>
        new Map(prev).set(participant.identity, msg.emoji),
      );
    }
  };
  room.on(RoomEvent.DataReceived, onData);
  return () => room.off(RoomEvent.DataReceived, onData);
}, [room]);
```

---

### 4. Mobile Viewport Handling

**Problem**: iOS Safari's address bar causes layout shifts when using `vh` units.

**Solution**: Use `dvh` (Dynamic Viewport Height) in Tailwind:

```tsx
// app/room/[code]/page.tsx
<div className="h-[100dvh]">
  {" "}
  {/* Instead of h-screen or h-[100vh] */}
  {/* Meeting content */}
</div>
```

**Prevent iOS zoom on input focus**:

```tsx
<input
  type="password"
  className="text-base" // Critical: 16px prevents iOS auto-zoom
  placeholder="Enter Passcode"
/>
```

---

### 5. Chat Implementation

**File**: `components/ChatSidebar.tsx`

- **Polling**: Messages fetch every 3 seconds when chat is open
- **Character Limit**: 1000 chars enforced in both UI and database
- **Visual Distinction**: Blue bubbles for current user, gray for others

```typescript
// Message fetching with polling
useEffect(() => {
  if (!isOpen) return;
  fetchMessages();
  const interval = setInterval(fetchMessages, 3000);
  return () => clearInterval(interval);
}, [isOpen]);

// Send message with optimistic UI
const handleSend = async () => {
  const res = await fetch("/api/chat", {
    method: "POST",
    body: JSON.stringify({ roomCode, content: newMessage }),
  });
  if (res.ok) {
    setNewMessage("");
    await fetchMessages(); // Refresh to get server-confirmed message
  }
};
```

---

### 6. Hand Raise Feature

```typescript
const toggleHand = useCallback(() => {
  const raised = !myHand;
  setMyHand(raised);

  // Broadcast hand state via data channel
  room.localParticipant.publishData(
    new TextEncoder().encode(JSON.stringify({ type: "hand", raised })),
    { reliable: true },
  );

  // Update local state
  setHands((prev) => {
    const s = new Set(prev);
    if (raised) s.add(localParticipant.identity);
    else s.delete(localParticipant.identity);
    return s;
  });
}, [room, myHand]);
```

---

### 7. Keyboard Shortcuts

**File**: `app/room/[code]/page.tsx`

```typescript
useEffect(() => {
  if (stage !== "connected") return;

  const handler = (e: KeyboardEvent) => {
    // Ignore shortcuts when typing in inputs
    const tag = (e.target as HTMLElement).tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;

    if (e.key === "m" || e.key === "M") {
      setAudioEnabled((prev) => !prev);
      toast(!audioEnabled ? "Mic on" : "Mic muted", "info");
    }
    if (e.key === "v" || e.key === "V") {
      setVideoEnabled((prev) => !prev);
    }
    if (e.key === "l" || e.key === "L") {
      router.push("/dashboard"); // Leave meeting
    }
  };

  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
}, [stage]);
```

**Shortcuts Summary**:

- `M` - Toggle microphone
- `V` - Toggle video
- `L` - Leave meeting

---

## 📡 API Routes

### POST `/api/livekit`

**Purpose**: Generate LiveKit access token for joining a room

**Request Body**:

```json
{
  "roomCode": "ABC123", // Required: 6-character room code
  "password": "secret" // Optional: Required if room is password-protected
}
```

**Response** (Success - 200):

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "roomName": "Team Standup",
  "roomCode": "ABC123",
  "isCreator": false,
  "participantCount": 3,
  "maxParticipants": 10,
  "waitingRoomEnabled": false
}
```

**Error Responses**:

- `401 Unauthorized` - User not authenticated
- `400 Bad Request` - Invalid room code format
- `404 Not Found` - Room doesn't exist or is inactive
- `410 Gone` - Room has expired (>24h old, non-persistent)
- `403 Forbidden` - Wrong password, waiting for lobby admission, or room full
- `429 Too Many Requests` - Rate limit exceeded (10/min)

---

### GET `/api/chat?roomCode={code}`

**Purpose**: Fetch messages for a specific room

**Response**:

```json
{
  "messages": [
    {
      "id": "uuid",
      "content": "Hello everyone!",
      "created_at": "2025-02-13T10:30:00Z",
      "user_id": "uuid",
      "sender_name": "Alice",
      "room_id": "uuid"
    }
  ]
}
```

---

### POST `/api/chat`

**Purpose**: Send a message to a room

**Request Body**:

```json
{
  "roomCode": "ABC123",
  "content": "Hello everyone!" // Max 1000 characters
}
```

**Response** (201 Created):

```json
{
  "success": true,
  "message": {
    /* message object */
  }
}
```

---

## 📊 Performance Optimizations

- **React 19 Server Components**: Reduced client JS bundle size with RSC
- **Code Splitting**: Automatic route-based splitting via Next.js App Router
- **Image Optimization**: Supabase Storage serves optimized avatars
- **In-Memory Rate Limiting**: Prevents token generation abuse (10 req/min per user)
- **Debounced Updates**: Chat polling throttled to 3-second intervals
- **Connection Pooling**: Supabase client reused across requests

---

## 🧪 Testing

### Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build
npm run start

# Linting
npm run lint

# End-to-end tests (Playwright)
npm run test:e2e
```

### E2E Testing with Playwright

**Installed**: `@playwright/test` v1.58.2

Example test structure (create in `/tests`):

```typescript
// tests/room-join.spec.ts
import { test, expect } from "@playwright/test";

test("user can join a meeting room", async ({ page }) => {
  await page.goto("/room/ABC123");

  // Wait for pre-join screen
  await expect(page.locator("text=Ready to Join?")).toBeVisible();

  // Click join button
  await page.click('button:has-text("Join Meeting")');

  // Verify we're connected
  await expect(page.locator("text=Leave Meeting")).toBeVisible({
    timeout: 10000,
  });
});
```

Run tests:

```bash
npx playwright test
npx playwright test --ui  # Interactive mode
```

---

## 📡 API Routes

### POST `/api/livekit`

**Purpose**: Generate LiveKit access token for joining a room

**Request Body**:

```json
{
  "roomCode": "ABC123", // Required: 6-character room code
  "password": "secret" // Optional: Required if room is password-protected
}
```

**Response** (Success - 200):

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "roomName": "Team Standup",
  "roomCode": "ABC123",
  "isCreator": false,
  "participantCount": 3,
  "maxParticipants": 10,
  "waitingRoomEnabled": false
}
```

**Error Responses**:

- `401 Unauthorized` - User not authenticated
- `400 Bad Request` - Invalid room code format
- `404 Not Found` - Room doesn't exist or is inactive
- `410 Gone` - Room has expired (>24h old, non-persistent)
- `403 Forbidden` - Wrong password, or waiting for lobby admission, or room full
- `429 Too Many Requests` - Rate limit exceeded (10/min)

---

### GET `/api/chat?roomCode={code}`

**Purpose**: Fetch messages for a specific room

**Response**:

```json
{
  "messages": [
    {
      "id": "uuid",
      "content": "Hello everyone!",
      "created_at": "2025-02-13T10:30:00Z",
      "user_id": "uuid",
      "sender_name": "Alice",
      "room_id": "uuid"
    }
  ]
}
```

---

### POST `/api/chat`

**Purpose**: Send a message to a room

**Request Body**:

```json
{
  "roomCode": "ABC123",
  "content": "Hello everyone!" // Max 1000 characters
}
```

**Response** (201 Created):

```json
{
  "success": true,
  "message": {
    /* message object */
  }
}
```

---

- **Server Components**: Default to RSC for reduced client JS bundle
- **Dynamic Imports**: Lazy-load heavy components (e.g., `MeetingView`)
- **Image Optimization**: Next.js `<Image>` with automatic WebP conversion
- **Code Splitting**: Route-based splitting via App Router
- **Debounced Updates**: Chat input and search fields use debounce (300ms)

---

## 🧪 Testing (Recommended Setup)

```bash
# Install testing dependencies
npm install -D @testing-library/react @testing-library/jest-dom vitest

# Run tests
npm run test
```

Example test structure:

```typescript
// __tests__/components/GlassCard.test.tsx
import { render, screen } from '@testing-library/react';
import GlassCard from '@/components/ui/GlassCard';

test('renders children correctly', () => {
  render(<GlassCard>Test Content</GlassCard>);
  expect(screen.getByText('Test Content')).toBeInTheDocument();
});
```

---

## 🚢 Deployment

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Add environment variables** in Project Settings
3. **Deploy** with zero configuration

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Follow code style**: Use Prettier and ESLint configs
4. **Write tests** for new features
5. **Commit** with conventional commits: `feat: add emoji picker`
6. **Push** and create a Pull Request

### Code Style Guidelines

- Use **TypeScript** strict mode
- Follow **React best practices** (hooks rules, component composition)
- Prefer **Server Components** unless interactivity is required
- Use **Tailwind classes** over custom CSS (except for complex animations)

---

## 📝 Roadmap

### ✅ Completed Features

- [x] WebRTC video/audio with LiveKit
- [x] Active speaker detection with visual indicators
- [x] Emoji reactions system (8 emojis)
- [x] Real-time chat with persistent storage
- [x] Hand raise signaling
- [x] Pin participant to main view
- [x] Screen sharing (desktop browsers)
- [x] Password-protected rooms
- [x] Waiting room / lobby system
- [x] Participant limits (1-50)
- [x] Room expiry (24h for non-persistent)
- [x] Mobile-responsive UI
- [x] Keyboard shortcuts
- [x] Avatar support
- [x] Rate limiting on API

### 🚧 Planned Features

- [ ] **Breakout Rooms**: Database schema ready (`parent_room_id`), UI not implemented
- [ ] **Cloud Recording**: Record meetings with playback
- [ ] **Virtual Backgrounds**: AI-powered background replacement
- [ ] **Live Transcription**: Real-time captions using Whisper API
- [ ] **Meeting Analytics**: Duration, participant count, engagement metrics
- [ ] **Whiteboard**: Collaborative drawing canvas with Excalidraw
- [ ] **File Sharing**: Upload/download files during meetings
- [ ] **Polls & Q&A**: Interactive audience engagement tools
- [ ] **Noise Cancellation**: Krisp.ai or similar audio enhancement
- [ ] **Calendar Integration**: Google Calendar, Outlook sync

---

## 🔐 Security Features

InterMeet implements multiple layers of security:

### Authentication & Authorization

- **Supabase Auth**: Email/password authentication with JWT tokens
- **Row-Level Security (RLS)**: PostgreSQL policies enforce data access control
- **Server-Side Sessions**: Auth cookies managed via `@supabase/ssr`

### API Security

- **Rate Limiting**: In-memory rate limiter (10 requests/min per user)
- **Input Validation**: Room code format checks (`/^[A-Z0-9]{6}$/`)
- **Password Protection**: Optional room passcodes (stored as plain text - **not production-ready**)
  - ⚠️ **TODO**: Implement bcrypt hashing before production deployment

### Meeting Security

- **Waiting Room**: Host can review and admit participants
- **Creator Privileges**: Only room creators can end meetings and manage lobby
- **Token Expiry**: LiveKit tokens valid for 6 hours
- **Room Expiry**: Non-persistent rooms auto-deactivate after 24 hours

### Data Privacy

- **Participant Tracking**: Join/leave timestamps for audit trails
- **Message Limits**: Chat messages capped at 1000 characters
- **No Content Moderation**: ⚠️ Messages are not filtered (implement before production)

---

## 🚨 Known Limitations

1. **Password Storage**: Currently uses plain text comparison - **must implement bcrypt before production**
2. **No Message Moderation**: Chat has no profanity filter or content moderation
3. **No E2E Encryption**: Video/audio is encrypted in transit but not end-to-end
4. **Rate Limit Reset**: In-memory rate limiter resets on server restart
5. **No User Blocking**: No ability to ban or mute disruptive participants
6. **Public Rooms**: All active rooms are visible to anyone (no private/unlisted rooms)

---

## 🙏 Acknowledgments

- **LiveKit** for the robust WebRTC infrastructure
- **Supabase** for seamless backend services
- **Vercel** for the Next.js framework and hosting
- **Tailwind Labs** for the utility-first CSS framework

---

<h2>👨‍💻 Author</h2>

**Arham Jain**
- Linkedin: [arhamchhajed](https://www.linkedin.com/in/arhamchhajed)
- Instagram: [V5Arham](https://instagram.com/v5arham)

<h2>⭐ Star History</h2>

If you find this project useful, please consider giving it a star! ⭐

---

<div align="center">

**Built with ❤️ using Next.js 16, LiveKit, and Supabase**

[Demo](https://intermeet-arham.vercel.app) • [Report Bug](https://github.com/yourusername/inter-meet/issues)

</div>
