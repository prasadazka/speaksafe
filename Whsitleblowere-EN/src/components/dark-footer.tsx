import Link from "next/link";

export function DarkFooter() {
  return (
    <footer className="bg-[#00254A]">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none" aria-hidden>
              <rect width="28" height="28" rx="6" fill="#5B94DE" />
              <path d="M14 5L5 9V15C5 20.5 9.1 25.6 14 27C18.9 25.6 23 20.5 23 15V9L14 5Z" fill="white" />
              <rect x="11" y="11" width="6" height="6" rx="1.5" fill="#5B94DE" />
            </svg>
            <span className="text-white font-bold font-[family-name:var(--font-sora)]">SpeakSafe</span>
          </div>
          <p className="text-white/50 text-sm text-center font-[family-name:var(--font-sora)]">
            &copy; {new Date().getFullYear()} SpeakSafe. Secure and confidential whistleblowing.
          </p>
          <div className="flex items-center gap-5 text-sm text-white/50 font-[family-name:var(--font-sora)]">
            <Link href="/report" className="hover:text-white transition-colors">Report</Link>
            <Link href="/track" className="hover:text-white transition-colors">Track</Link>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
