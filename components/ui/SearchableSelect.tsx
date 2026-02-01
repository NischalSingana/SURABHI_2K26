"use client";

import { useState, useRef, useEffect } from "react";
import { FiChevronDown } from "react-icons/fi";

export interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[] | string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  required?: boolean;
  className?: string;
  id?: string;
  disabled?: boolean;
  /** Label for the field */
  label?: string;
  /** If true, show value in trigger as selected option label */
  displayLabel?: boolean;
  /** If true, trigger has fixed height (matches py-3 input) and single-line text with ellipsis */
  matchInputHeight?: boolean;
}

function normalizeOptions(opts: SearchableSelectOption[] | string[]): SearchableSelectOption[] {
  return opts.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o
  );
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  required = false,
  className = "",
  id,
  disabled = false,
  label,
  displayLabel = true,
  matchInputHeight = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const opts = normalizeOptions(options);
  const filtered =
    search.trim() === ""
      ? opts
      : opts.filter(
          (o) =>
            o.label.toLowerCase().includes(search.toLowerCase()) ||
            o.value.toLowerCase().includes(search.toLowerCase())
        );

  const selectedOption = opts.find((o) => o.value === value);
  const displayValue = displayLabel && selectedOption ? selectedOption.label : value || placeholder;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Let trackpad/wheel scroll the dropdown list instead of Lenis (smooth scroll) capturing it
  useEffect(() => {
    const panel = dropdownRef.current;
    if (!open || !panel) return;
    const stopWheel = (e: WheelEvent) => e.stopPropagation();
    panel.addEventListener("wheel", stopWheel, { passive: true });
    return () => panel.removeEventListener("wheel", stopWheel);
  }, [open]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          {label.trim()}{label.trim().endsWith("*") ? "" : required ? " *" : ""}
        </label>
      )}
      <button
        type="button"
        id={id}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`w-full pl-4 pr-10 py-3 text-left bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all flex items-center justify-between ${matchInputHeight ? "h-12 min-h-12" : ""}`}
        disabled={disabled}
      >
        <span className={`${value ? "text-white" : "text-zinc-500"} ${matchInputHeight ? "min-w-0 truncate" : ""}`}>{displayValue}</span>
        <FiChevronDown className={`text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div ref={dropdownRef} className="absolute z-50 mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl max-h-60 flex flex-col">
          <div className="p-2 border-b border-zinc-700 sticky top-0 bg-zinc-800">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-600 rounded text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-red-600"
              autoFocus
            />
          </div>
          <ul className="overflow-y-auto py-1 max-h-48">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-zinc-500 text-sm">No results</li>
            ) : (
              filtered.map((opt) => (
                <li key={`${String(opt.value)}__${String(opt.label)}`}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setSearch("");
                      setOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-700 transition-colors ${
                      value === opt.value ? "bg-red-600/20 text-red-400" : "text-white"
                    }`}
                  >
                    {opt.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
