import { useState } from "react";
import { format, parse } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "~/components/ui/calendar.js";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover.js";
import { cn } from "~/lib/utils.js";

interface DatePickerProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  name?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** Use dropdown month/year navigation — ideal for birth dates */
  captionLayout?: "dropdown" | "dropdown-months" | "dropdown-years" | "label";
  fromYear?: number;
  toYear?: number;
}

function DatePicker({
  value: controlledValue,
  defaultValue,
  onChange,
  name,
  placeholder = "Pick a date",
  className,
  disabled,
  captionLayout,
  fromYear,
  toYear,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");

  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : internalValue;

  const selectedDate = currentValue
    ? parse(currentValue, "yyyy-MM-dd", new Date())
    : undefined;

  const handleSelect = (date: Date | undefined) => {
    const str = date ? format(date, "yyyy-MM-dd") : "";
    if (!isControlled) setInternalValue(str);
    onChange?.(str);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {name && <input type="hidden" name={name} value={currentValue} />}
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center gap-2 rounded-md border border-input bg-white px-3 py-2 text-left text-sm ring-offset-background transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
            !currentValue && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0 opacity-50" />
          {currentValue && selectedDate
            ? format(selectedDate, "dd MMM yyyy")
            : placeholder}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          defaultMonth={selectedDate}
          captionLayout={captionLayout}
          {...(fromYear && { startMonth: new Date(fromYear, 0) })}
          {...(toYear && { endMonth: new Date(toYear, 11) })}
        />
      </PopoverContent>
    </Popover>
  );
}

export { DatePicker };
