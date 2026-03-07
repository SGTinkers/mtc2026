import { useState, useRef, useEffect, type ReactNode } from "react";
import { cn } from "~/lib/utils.js";
import { Search } from "lucide-react";

interface ComboboxProps<T> {
  options: T[];
  value: T | null;
  onSelect: (option: T | null) => void;
  getOptionValue: (option: T) => string;
  getOptionLabel: (option: T) => string;
  filterOption?: (option: T, query: string) => boolean;
  renderOption?: (option: T) => ReactNode;
  placeholder?: string;
  name?: string;
}

export function Combobox<T>({
  options,
  value,
  onSelect,
  getOptionValue,
  getOptionLabel,
  filterOption,
  renderOption,
  placeholder = "Search...",
}: ComboboxProps<T>) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query
    ? options.filter((o) =>
        filterOption
          ? filterOption(o, query)
          : getOptionLabel(o).toLowerCase().includes(query.toLowerCase()),
      )
    : options;

  useEffect(() => {
    setHighlightIndex(0);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && listRef.current) {
      const item = listRef.current.children[highlightIndex] as HTMLElement;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIndex, open]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        setOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filtered[highlightIndex]) {
          selectOption(filtered[highlightIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
    }
  }

  function selectOption(option: T) {
    onSelect(option);
    setQuery(getOptionLabel(option));
    setOpen(false);
  }

  function handleFocus() {
    setOpen(true);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setOpen(true);
    if (!e.target.value) {
      onSelect(null);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-white pl-10 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          )}
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          autoComplete="off"
        />
      </div>

      {open && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-input bg-white py-1 shadow-md"
          role="listbox"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              No results found
            </li>
          ) : (
            filtered.map((option, i) => (
              <li
                key={getOptionValue(option)}
                role="option"
                aria-selected={
                  value ? getOptionValue(option) === getOptionValue(value) : false
                }
                className={cn(
                  "cursor-pointer px-3 py-2 text-sm",
                  i === highlightIndex && "bg-accent",
                  value &&
                    getOptionValue(option) === getOptionValue(value) &&
                    "font-medium",
                )}
                onMouseEnter={() => setHighlightIndex(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectOption(option);
                }}
              >
                {renderOption ? renderOption(option) : getOptionLabel(option)}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
