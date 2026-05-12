import Link from "next/link";

export function PublicNav() {
  return (
    <header className="bg-white sticky top-0 z-50 shadow-[0px_4px_10px_rgba(0,0,0,0.05)]">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-[100px] h-[106px] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
            <rect width="28" height="28" rx="6" fill="#5B94DE" />
            <path d="M14 5L5 9V15C5 20.5 9.1 25.6 14 27C18.9 25.6 23 20.5 23 15V9L14 5Z" fill="white" />
            <rect x="11" y="11" width="6" height="6" rx="1.5" fill="#5B94DE" />
          </svg>
          <span className="text-[#01151C] text-2xl font-bold font-[family-name:var(--font-sora)]">
            SpeakSafe
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-10 text-[#01151C] text-xl font-[family-name:var(--font-dm-sans)]">
          <Link href="/#how-it-works" className="hover:text-[#5B94DE] transition-colors">About</Link>
          <Link href="/#features" className="hover:text-[#5B94DE] transition-colors">Features</Link>
          <Link href="/#compliance" className="hover:text-[#5B94DE] transition-colors">Pricing</Link>
          <Link href="/#faq" className="hover:text-[#5B94DE] transition-colors">Gallery</Link>
        </nav>

        <div className="flex items-center gap-8">
          <Link
            href="/admin/login"
            className="hidden md:flex items-center gap-2 text-[#01151C] text-xl font-[family-name:var(--font-sora)]"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path d="M10 10C12.2 10 14 8.2 14 6C14 3.8 12.2 2 10 2C7.8 2 6 3.8 6 6C6 8.2 7.8 10 10 10ZM10 12C7.3 12 2 13.4 2 16V18H18V16C18 13.4 12.7 12 10 12Z" fill="black" />
            </svg>
            Admin
          </Link>
          <Link
            href="/report"
            className="inline-flex items-center gap-2 h-[46px] px-[35px] bg-[#5B94DE] hover:bg-[#4a83cd] text-white font-semibold rounded text-base transition-colors font-[family-name:var(--font-figtree)]"
          >
            Raise a Concern
          </Link>
        </div>
      </div>
    </header>
  );
}
