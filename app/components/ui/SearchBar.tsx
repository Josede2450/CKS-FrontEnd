"use client";

import { Search } from "lucide-react";

export default function SearchBar() {
  return (
    <div className="relative h-[25px] w-[230px]">
      <input
        type="text"
        placeholder="Search bar"
        className="w-full h-full rounded-[25px] border border-[var(--color-gray)] bg-transparent text-xs font-extralight outline-none text-center placeholder:text-center pr-6"
      />
      <Search className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-600" />
    </div>
  );
}
