// app/components/Navbar.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown } from "lucide-react";
import Image from "next/image";
import SearchBar from "../ui/SearchBar";
import logo from "../../public/images/cks-logo.png";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Removed the Blog item from this list
const links = [
  { href: "/about", label: "About Us" },
  { href: "/services", label: "Services" },
  { href: "/testimonials", label: "Testimonials" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact Us" },
];

type CurrentUser = {
  id?: number;
  email?: string;
  firstName?: string;
  lastName?: string | null;
  role?: string;
  roles?: string[];
  displayPicture?: string | null;
  avatar?: string | null;
  picture?: string | null;
};

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const isAdmin = (u: CurrentUser | null) => {
    if (!u) return false;
    const list = (u.roles ?? []).concat(u.role ? [u.role] : []);
    return list.some((r) => r === "ADMIN" || r === "ROLE_ADMIN");
  };

  const refreshAuth = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/auth/me`, {
        credentials: "include",
        headers: { Accept: "application/json" },
        cache: "no-store", // <- avoid stale cached 401/old user
      });
      if (!res.ok) {
        setUser(null);
        return;
      }
      const body = (await res.json()) as any;
      if (body?.authenticated) {
        const u: CurrentUser = {
          id: body.id,
          email: body.email,
          firstName: body.firstName,
          lastName: body.lastName,
          role: body.role,
          roles: body.roles,
          displayPicture:
            body.displayPicture ?? body.avatar ?? body.picture ?? null,
          avatar: body.avatar ?? null,
          picture: body.picture ?? null,
        };
        setUser(u);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch(`${API}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
    } catch {
      // ignore
    } finally {
      setUser(null);
      window.location.assign("/");
    }
  }, [loggingOut]);

  // initial load
  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  // re-validate when the tab regains focus (covers redirect-from-login)
  useEffect(() => {
    const onFocus = () => refreshAuth();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshAuth]);

  // close dropdown on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [profileOpen]);

  const initials =
    (user?.firstName?.[0] ?? "").toUpperCase() +
    (user?.lastName?.[0] ?? "").toUpperCase();

  return (
    <header className="bg-white font-extralight sticky top-0 z-[9999]">
      {/* Top bar — max width 1200 */}
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center"
          onClick={() => setMenuOpen(false)}
        >
          <Image src={logo} alt="CKS Logo" priority className="h-20 w-auto" />
        </Link>

        {/* Links + Auth (desktop) */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-gray-900 text-gray-700 transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          {!loading &&
            (user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setProfileOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-gray-100 transition cursor-pointer"
                  aria-haspopup="menu"
                  aria-expanded={profileOpen}
                >
                  {user.displayPicture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.displayPicture}
                      alt="Profile"
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-700">
                      {initials || "U"}
                    </div>
                  )}
                  <ChevronDown
                    className={`h-4 w-4 transition ${
                      profileOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown */}
                <div
                  className={`absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden
                              transition-transform transition-opacity duration-150
                              ${
                                profileOpen
                                  ? "opacity-100 scale-100"
                                  : "opacity-0 scale-95 pointer-events-none"
                              }
                              z-[10000]`}
                  role="menu"
                >
                  <div className="px-3 py-2 text-xs text-gray-500">
                    {user.firstName} {user.lastName ?? ""}
                  </div>
                  <div className="h-px bg-gray-200" />

                  {isAdmin(user) && (
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm hover:bg-gray-50 text-gray-700"
                      role="menuitem"
                      onClick={() => setProfileOpen(false)}
                    >
                      Dashboard
                    </Link>
                  )}

                  <Link
                    href="/account"
                    className="block px-4 py-2 text-sm hover:bg-gray-50 text-gray-700"
                    role="menuitem"
                    onClick={() => setProfileOpen(false)}
                  >
                    Edit Profile
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700 disabled:opacity-50"
                    role="menuitem"
                  >
                    {loggingOut ? "Logging out…" : "Log Out"}
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="hover:text-gray-900 text-gray-700 transition-colors"
              >
                Log In
              </Link>
            ))}
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle Menu"
          type="button"
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Bottom divider — never blocks clicks */}
      <div className="flex items-center w-full pointer-events-none">
        <span className="h-px flex-1 bg-gray-300 opacity-80"></span>
        <span className="w-12 sm:w-20 md:w-36 lg:w-48"></span>
        <span className="h-px flex-[2] bg-gray-300 opacity-80 hidden md:block"></span>
        <span className="w-12 sm:w-20 md:w-36 lg:w-48"></span>
        <span className="h-px flex-1 bg-gray-300 opacity-80"></span>
      </div>

      {/* Mobile dropdown */}
      <div
        className={`md:hidden bg-white overflow-hidden transition-all duration-300 ease-out
        ${
          menuOpen
            ? "max-h-[80vh] opacity-100 translate-y-0"
            : "max-h-0 opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        <div className="mx-auto max-w-[1200px] px-4">
          <div className="flex flex-col items-center text-center py-3 gap-4">
            <nav className="flex flex-col items-center gap-4 text-base w-full">
              {links.map((link, i) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`text-gray-700 hover:text-gray-900 transition-colors transition-all duration-300 ease-out
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

              {!loading &&
                (user ? (
                  <div className="w-full pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-center gap-3 py-3">
                      {user.displayPicture ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.displayPicture}
                          alt="Profile"
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-700">
                          {initials || "U"}
                        </div>
                      )}
                      <div className="text-sm text-gray-700">
                        {user.firstName} {user.lastName ?? ""}
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-2 pb-3">
                      {isAdmin(user) && (
                        <Link
                          href="/dashboard"
                          onClick={() => setMenuOpen(false)}
                          className="text-gray-700 hover:text-gray-900"
                        >
                          Dashboard
                        </Link>
                      )}
                      <Link
                        href="/account"
                        onClick={() => setMenuOpen(false)}
                        className="text-gray-700 hover:text-gray-900"
                      >
                        Edit Profile
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          handleLogout();
                          setMenuOpen(false);
                        }}
                        disabled={loggingOut}
                        className="text-gray-700 hover:text-gray-900 disabled:opacity-50"
                      >
                        {loggingOut ? "Logging out…" : "Log Out"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="hover:text-gray-900 text-gray-700 transition-colors"
                  >
                    Log In
                  </Link>
                ))}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
