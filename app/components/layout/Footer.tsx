import Image from "next/image";
import copyrightIcon from "../../public/images/Copyright.svg";

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

      {/* COPYRIGHT centered in container */}
      <div className="mx-auto max-w-[1600px] px-4 mt-3 flex items-center justify-center gap-2 text-sm text-gray-600 font-extralight">
        <Image
          src={copyrightIcon}
          alt="Copyright"
          width={24}
          height={19}
          className="opacity-80"
        />
        <span>Copyright {new Date().getFullYear()}</span>
      </div>
    </footer>
  );
}
