# InterMeet

A modern, high-performance video conferencing application built with Next.js 16, LiveKit, and Supabase.

![InterMeet Screenshot](https://images.unsplash.com/photo-1616588589676-60b30c3c2b0c?q=80&w=2600&auto=format&fit=crop)

## 🚀 Features

- **High-Quality Video & Audio:** Powered by LiveKit for sub-second latency.
- **Real-time Interaction:**
  - **Emoji Reactions:** Express yourself with floating emojis.
  - **Active Speaker Detection:** Visual indicators for who is talking.
  - **Screen Sharing:** Share your screen with a single click.
  - **Chat:** Built-in chat functionality (planned/in-progress).
- **Secure Authentication:** User management and auth via Supabase.
- **Modern UI/UX:**
  - **Glassmorphism Design:** Beautiful, translucent UI elements.
  - **Responsiveness:** Optimized for Desktop, Tablet, and Mobile.
  - **Dark/Light Mode:** Seamless theme switching.
- **Device Management:** Pre-join screen to test camera/microphone.

## 🛠️ Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Real-time Video/Audio:** [LiveKit](https://livekit.io/)
- **Database & Auth:** [Supabase](https://supabase.com/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Animation:** [Framer Motion](https://www.framer.com/motion/)

## 📦 Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/yourusername/inter-meet.git
    cd inter-meet
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Environment Variables:**

    Create a `.env.local` file in the root directory and add the following keys:

    ```env
    # LiveKit
    NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
    LIVEKIT_API_KEY=your_api_key
    LIVEKIT_API_SECRET=your_api_secret

    # Supabase
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run the development server:**

    ```bash
    npm run dev
    ```

5.  **Open your browser:**

    Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## 📂 Project Structure

```
inter-meet/
├── app/                  # Next.js App Router pages and layouts
│   ├── dashboard/        # Dashboard views
│   ├── room/[code]/      # Active meeting room logic
│   └── page.tsx          # Landing page
├── components/           # Reusable UI components
│   ├── MeetingView.tsx   # Core video conferencing UI
│   ├── Navbar.tsx        # Navigation bar
│   └── ...
├── lib/                  # Utilities (Supabase client, helpers)
├── public/               # Static assets
└── ...
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ using Next.js and LiveKit.
