import Link from 'next/link'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import { 
  Video, Lock, MicOff, PhoneOff, 
  Smile, CloudLightning, PenTool
} from 'lucide-react'

export default function Home() {
  return (
    <div className="h-screen flex flex-col bg-white dark:bg-[#0a0a0a] text-slate-900 dark:text-white font-sans selection:bg-indigo-500/30 overflow-hidden">
      
      {/* Background Contour Lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <svg className="absolute top-0 left-0 w-full h-full opacity-[0.03] dark:opacity-[0.05]" viewBox="0 0 100 100" preserveAspectRatio="none">
           <path d="M0 50 Q 25 30 50 50 T 100 50" stroke="currentColor" fill="none" strokeWidth="0.5"/>
           <path d="M0 70 Q 25 50 50 70 T 100 70" stroke="currentColor" fill="none" strokeWidth="0.5"/>
           <path d="M-20 20 Q 30 80 80 20" stroke="currentColor" fill="none" strokeWidth="0.5"/>
        </svg>
      </div>

      {/* Navbar */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 max-w-7xl mx-auto w-full z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg shadow-indigo-600/20">I</div>
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-indigo-900 dark:text-white">Inter Meet</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeSwitcher />
          <Link href="/auth/signup" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all shadow-md hover:shadow-lg shadow-indigo-600/20">
            Sign up
          </Link>
          <Link href="/auth/login" className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-full border border-indigo-200 dark:border-white/10 hover:border-indigo-600 dark:hover:border-indigo-500 text-indigo-600 dark:text-indigo-400 text-xs sm:text-sm font-semibold transition-all">
            Login
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col">
        
        {/* HERO SECTION */}
        <section className="relative flex-1 px-4 sm:px-6 grid lg:grid-cols-12 gap-6 sm:gap-12 items-center">
          
          {/* LEFT: Text Content */}
          <div className="col-span-12 lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left z-10 justify-center">
            <h1 className="text-[2.75rem] leading-[1.15] sm:text-6xl md:text-7xl lg:text-[5.5rem] font-bold tracking-tight mb-6 sm:mb-10 sm:leading-[1.1] text-slate-800 dark:text-white">
              Meet 
              {/* Cyan Pill with Pen */}
              <span className="inline-flex align-middle ml-2 sm:ml-4 w-12 sm:w-20 h-7 sm:h-12 bg-cyan-400 rounded-full items-center justify-center relative -rotate-12 transform translate-y-0.5 sm:translate-y-1 shadow-lg shadow-cyan-400/30">
                <PenTool className="w-3.5 h-3.5 sm:w-6 sm:h-6 text-white fill-white" />
              </span>
              <br />
              Without a <br />
              Hitch
              {/* Purple Pill with Lightning */}
              <span className="inline-flex align-middle ml-2 sm:ml-4 w-14 sm:w-24 h-7 sm:h-12 bg-indigo-600 rounded-full items-center justify-center relative rotate-6 transform translate-y-0.5 sm:translate-y-1 shadow-lg shadow-indigo-600/30">
                <CloudLightning className="w-3.5 h-3.5 sm:w-6 sm:h-6 text-yellow-400 fill-yellow-400" />
              </span>
            </h1>

            <p className="text-sm sm:text-lg text-slate-500 dark:text-slate-400 mb-8 sm:mb-12 max-w-sm sm:max-w-md font-medium leading-relaxed px-2 sm:px-0">
              Distance doesn&apos;t matter, it&apos;s the meeting that matters the most.
            </p>

            {/* Input Field Box */}
            <div className="w-full max-w-[480px] flex flex-col sm:flex-row gap-3 sm:gap-0 sm:bg-white sm:dark:bg-zinc-900 sm:p-2 sm:pl-8 sm:rounded-full sm:shadow-[0_8px_30px_rgb(0,0,0,0.06)] sm:dark:shadow-none sm:border sm:border-slate-100 sm:dark:border-white/10">
              <input 
                type="text" 
                placeholder="Insert your meeting link" 
                className="w-full sm:flex-1 min-w-0 bg-white dark:bg-zinc-900 sm:bg-transparent sm:dark:bg-transparent border border-slate-200 dark:border-white/10 sm:border-none rounded-full px-5 py-3.5 sm:p-0 outline-none text-sm sm:text-base text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600"
              />
              <button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-sm sm:text-base font-bold transition-all flex items-center justify-center gap-2 sm:gap-3 shadow-lg shadow-indigo-600/25 whitespace-nowrap">
                <Video className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
                Start meeting
              </button>
            </div>
          </div>

          {/* RIGHT: Avatar Network Grid */}
          <div className="hidden lg:flex lg:col-span-7 relative h-[500px] md:h-[600px] w-full items-center justify-center select-none">
             
            {/* Connector Lines Layer (SVG) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 700 600" preserveAspectRatio="xMidYMid meet">
               {/* Center to top-left */}
               <path d="M350 270 Q 290 200 220 80" fill="none" stroke="#c4b5fd" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.5"/>
               {/* Center to top-right */}
               <path d="M350 270 Q 420 200 500 80" fill="none" stroke="#c4b5fd" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.5"/>
               {/* Center to mid-left */}
               <path d="M350 270 Q 200 250 60 260" fill="none" stroke="#c4b5fd" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.5"/>
               {/* Center to mid-right */}
               <path d="M350 270 Q 500 250 640 260" fill="none" stroke="#c4b5fd" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.5"/>
               {/* Center to bottom-left */}
               <path d="M350 270 Q 310 380 260 480" fill="none" stroke="#c4b5fd" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.5"/>
               {/* Center to bottom-right */}
               <path d="M350 270 Q 400 380 470 480" fill="none" stroke="#c4b5fd" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.5"/>
            </svg>

            {/* Floating Icon Chips along the lines */}
            <div className="absolute top-[22%] left-[28%] z-10 bg-black text-white p-1.5 sm:p-2 rounded-full shadow-xl hidden sm:block"><MicOff className="w-3 h-3 sm:w-4 sm:h-4" /></div>
            <div className="absolute top-[20%] right-[28%] z-10 bg-black text-white p-1.5 sm:p-2 rounded-full shadow-xl hidden sm:block"><Video className="w-3 h-3 sm:w-4 sm:h-4" /></div>
            <div className="absolute top-[38%] left-[20%] z-10 bg-zinc-800 text-white p-1.5 sm:p-2.5 rounded-xl shadow-xl hidden sm:block"><Lock className="w-3 h-3 sm:w-4 sm:h-4" /></div>
            <div className="absolute top-[42%] right-[22%] z-10 bg-zinc-800 text-white p-1.5 sm:p-2.5 rounded-full shadow-xl hidden sm:block"><Smile className="w-3 h-3 sm:w-4 sm:h-4" /></div>
            <div className="absolute top-[62%] left-[35%] z-10 bg-zinc-800 text-white p-1.5 sm:p-2.5 rounded-xl shadow-xl rotate-12 hidden sm:block"><PhoneOff className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" /></div>
            <div className="absolute top-[60%] right-[33%] z-10 bg-zinc-800 text-white p-1.5 sm:p-2.5 rounded-full shadow-xl -rotate-12 hidden sm:block"><Video className="w-3 h-3 sm:w-4 sm:h-4" /></div>

            {/* Avatars — 2-3-2 diamond layout matching the reference */}
            <div className="relative w-full h-full">
              
              {/* TOP ROW — two avatars side by side near top */}
              <Avatar 
                src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&h=200&fit=crop" 
                className="absolute top-[3%] left-[22%]"
                bg="bg-purple-200"
              />
              <Avatar 
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop" 
                className="absolute top-[3%] right-[18%]"
                bg="bg-orange-100"
                badge={<div className="absolute -top-2 -right-6 sm:-right-10 bg-black text-white text-xs sm:text-sm font-bold px-3 sm:px-4 py-1 sm:py-1.5 rounded-full flex items-center gap-1 shadow-xl z-50">LOL <span>🤣</span></div>}
              />

              {/* MIDDLE ROW — three avatars, center one is the anchor */}
              <Avatar 
                src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop" 
                className="absolute top-[32%] left-[2%]"
                bg="bg-blue-100"
              />
              {/* CENTER ANCHOR */}
              <Avatar 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop" 
                className="absolute top-[28%] left-[50%] -translate-x-1/2 scale-110 z-20 shadow-2xl ring-4 ring-white dark:ring-black"
                bg="bg-orange-50"
              />
              <Avatar 
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop" 
                className="absolute top-[32%] right-[2%]"
                bg="bg-purple-100"
              />

              {/* BOTTOM ROW — two avatars below center */}
              <Avatar 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop" 
                className="absolute top-[64%] left-[24%]"
                bg="bg-yellow-100"
                badge={<div className="absolute -top-4 -left-4 sm:-left-8 bg-black text-white text-xs sm:text-sm font-bold px-3 sm:px-4 py-1 sm:py-2 rounded-full flex items-center gap-1 shadow-xl -rotate-6 z-50">Wow <span>😲</span></div>}
              />
              <Avatar 
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop" 
                className="absolute top-[64%] right-[20%]"
                bg="bg-blue-100"
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

// Avatar component
interface AvatarProps {
  src: string
  className: string
  bg: string
  badge?: React.ReactNode
}

function Avatar({ src, className, bg, badge }: AvatarProps) {
  return (
    <div className={`transition-all hover:z-30 hover:scale-105 duration-300 ${className}`}>
      {badge}
      <div className={`w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-lg ${bg}`}>
         {/* eslint-disable-next-line @next/next/no-img-element */}
         <img src={src} alt="User" className="w-full h-full object-cover mix-blend-multiply opacity-90" />
      </div>
    </div>
  )
}