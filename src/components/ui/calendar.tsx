import { DayPicker, type DayPickerProps } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "~/lib/utils.js";

function Calendar({ className, classNames, ...props }: DayPickerProps) {
  return (
    <DayPicker
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-4",
        month_caption:
          "flex justify-center pt-1 relative items-center w-full",
        caption_label: "text-sm font-medium",
        nav: "flex items-center gap-1",
        button_previous:
          "absolute left-1 top-0 inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-transparent opacity-50 hover:opacity-100 cursor-pointer",
        button_next:
          "absolute right-1 top-0 inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-transparent opacity-50 hover:opacity-100 cursor-pointer",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        week: "flex w-full mt-2",
        day: "h-9 w-9 text-center text-sm p-0 relative rounded-md",
        day_button:
          "inline-flex h-9 w-9 items-center justify-center rounded-md p-0 font-normal hover:bg-muted cursor-pointer",
        selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
        today: "bg-accent/20 text-accent-foreground font-semibold",
        outside: "text-muted-foreground opacity-50",
        disabled: "text-muted-foreground opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  );
}

export { Calendar };
