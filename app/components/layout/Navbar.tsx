"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import SearchBar from "../ui/SearchBar";
import logo from "../../public/images/cks-logo.png";

const links = [
  { href: "/about", label: "About Us" },
  { href: "/services", label: "Services" },
  { href: "/blog", label: "Blog" },
  { href: "/testimonials", label: "Testimonials" },
  { href: "/contact", label: "Contact Us" },
  { href: "/login", label: "Log In" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-white font-extralight">
      {/* Top bar — max width 1200 */}
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image src={logo} alt="CKS Logo" priority className="h-20 w-auto" />
        </Link>

        {/* Search (desktop) */}
        <div className="hidden md:flex">
          <SearchBar />
        </div>

        {/* Links (desktop) */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-gray-900 text-gray-700 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle Menu"
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Bottom divider — full width with responsive gaps; middle disappears on mobile */}
      <div className="flex items-center w-full">
        <span className="h-px flex-1 bg-gray-300 opacity-80"></span>
        <span className="w-12 sm:w-20 md:w-36 lg:w-48"></span>
        <span className="h-px flex-[2] bg-gray-300 opacity-80 hidden md:block"></span>
        <span className="w-12 sm:w-20 md:w-36 lg:w-48"></span>
        <span className="h-px flex-1 bg-gray-300 opacity-80"></span>
      </div>

      {/* Mobile dropdown — animated + centered */}
      <div
        className={`md:hidden bg-white  overflow-hidden transition-all duration-300 ease-out
        ${
          menuOpen
            ? "max-h-[80vh] opacity-100 translate-y-0"
            : "max-h-0 opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        <div className="mx-auto max-w-[1200px] px-4">
          <div className="flex flex-col items-center text-center py-3 gap-4">
            {/* Links with slight stagger */}
            <nav className="flex flex-col items-center gap-4 text-base w-full">
              {links.map((link, i) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`text-gray-700 hover:text-gray-900 transition-colors
                  transition-all duration-300 ease-out
                  ${
                    menuOpen
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-2"
                  }`}
                  style={{ transitionDelay: `${i * 50}ms` }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
