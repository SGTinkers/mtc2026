import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import { cn } from "~/lib/utils.js";
import { Search, Loader2 } from "lucide-react";

interface ComboboxProps<T> {
  onSearch: (query: string) => Promise<T[]>;
  value: T | null;
  onSelect: (option: T | null) => void;
  getOptionValue: (option: T) => string;
  getOptionLabel: (option: T) => string;
  renderOption?: (option: T) => ReactNode;
  placeholder?: string;
  debounceMs?: number;
}

export function Combobox<T>({
  onSearch,
  value,
  onSelect,
  getOptionValue,
  getOptionLabel,
  renderOption,
  placeholder = "Search...",
  debounceMs = 300,
}: ComboboxProps<T>) {
  const [query, setQuery] = useState(() =>
    value ? getOptionLabel(value) : "",
  );
  const [options, setOptions] = useState<T[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const doSearch = useCallback(
    (q: string) => {
      clearTimeout(debounceRef.current);
      if (!q.trim()) {
        setOptions([]);
        setOpen(false);
        return;
      }
      setSearching(true);
      debounceRef.current = setTimeout(async () => {
        try {
          const results = await onSearch(q);
          setOptions(results);
          setHighlightIndex(0);
          setOpen(true);
        } finally {
          setSearching(false);
        }
      }, debounceMs);
    },
    [onSearch, debounceMs],
  );

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

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
        if (options.length > 0) setOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIndex((i) => Math.min(i + 1, options.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (options[highlightIndex]) {
          selectOption(options[highlightIndex]);
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

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    if (!val) {
      onSelect(null);
      setOptions([]);
      setOpen(false);
    } else {
      doSearch(val);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        {searching ? (
          <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : (
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        )}
        <input
          type="text"
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-white pl-10 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          )}
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
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
          {options.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              No results found
            </li>
          ) : (
            options.map((option, i) => (
              <li
                key={getOptionValue(option)}
                role="option"
                aria-selected={
                  value
                    ? getOptionValue(option) === getOptionValue(value)
                    : false
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
