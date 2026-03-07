import { type ComponentProps } from "react";
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
        dropdowns: "flex items-center gap-2 w-full justify-center",
        dropdown_root: "relative",
        dropdown:
          "absolute inset-0 opacity-0 cursor-pointer z-10",
        months_dropdown:
          "inline-flex items-center justify-center rounded-md border border-input bg-background px-2 py-1 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
        years_dropdown:
          "inline-flex items-center justify-center rounded-md border border-input bg-background px-2 py-1 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
        nav: "absolute inset-x-3 top-2.5 flex items-center justify-between z-20",
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
        PreviousMonthButton: (btnProps: ComponentProps<"button">) => (
          <button
            {...btnProps}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-transparent opacity-50 hover:opacity-100 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        ),
        NextMonthButton: (btnProps: ComponentProps<"button">) => (
          <button
            {...btnProps}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-transparent opacity-50 hover:opacity-100 cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        ),
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="h-4 w-4" />
          ) : orientation === "right" ? (
            <ChevronRight className="h-4 w-4" />
          ) : <></>,
      }}
      {...props}
    />
  );
}

export { Calendar };
