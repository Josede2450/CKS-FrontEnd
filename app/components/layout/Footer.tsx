import Image from "next/image";
import Link from "next/link";
import copyrightIcon from "../../public/images/Copyright.svg";
import { Instagram } from "lucide-react"; // lightweight icon from lucide-react

export default function Footer() {
  return (
    <footer className="py-6">
      {/* Bottom divider – full width with responsive gaps; middle hidden on mobile */}
      <div className="w-full">
        <div className="flex items-center">
          {/* left line */}
          <span className="h-px flex-1 bg-gray-300 opacity-80"></span>

          {/* first gap (tune widths as you like) */}
          <span className="w-12 sm:w-20 md:w-36 lg:w-48"></span>

          {/* middle line (disappears on mobile) */}
          <span className="h-px flex-[2] bg-gray-300 opacity-80 hidden md:block"></span>

          {/* second gap */}
          <span className="w-12 sm:w-20 md:w-36 lg:w-48"></span>

          {/* right line */}
          <span className="h-px flex-1 bg-gray-300 opacity-80"></span>
        </div>
      </div>

      {/* COPYRIGHT + Instagram */}
      <div className="mx-auto max-w-[1600px] px-4 mt-3 flex items-center justify-center gap-4 text-sm text-gray-600 font-extralight">
        <div className="flex items-center gap-2">
          <Image
            src={copyrightIcon}
            alt="Copyright"
            width={24}
            height={19}
            className="opacity-80"
          />
          <span>Copyright {new Date().getFullYear()}</span>
        </div>

        {/* Instagram link */}
        <Link
          href="https://www.instagram.com/cks_software"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-gray-600 hover:text-pink-600 transition"
        >
          <Instagram size={18} />
          <span>@cks_software</span>
        </Link>
      </div>
    </footer>
  );
}
