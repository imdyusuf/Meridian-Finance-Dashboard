import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Banknote,
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Receipt,
  Trash2,
} from "lucide-react";
import { createReminder, deleteReminder, getCalendar } from "@/services/api";
import { notify } from "@/store/appStore";
import { useI18n } from "@/hooks/useI18n";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Dropdown } from "@/components/ui/Dropdown";
import { ConfirmDialog, Modal } from "@/components/ui/Modal";
import { ErrorState, Skeleton } from "@/components/common/States";
import {
  addMonths,
  currentMonthKey,
  daysInMonth,
  firstWeekday,
  formatCurrency,
  formatLongDate,
  formatShortDate,
  monthLabel,
  parseISO,
  todayISO,
  weekdayLabels,
} from "@/utils/format";
import { cn } from "@/utils/cn";

const reminderSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(60, "Keep it under 60 characters"),
  date: z.string().min(1, "Pick a date"),
  amount: z
    .string()
    .refine((value) => value === "" || (!Number.isNaN(Number(value)) && Number(value) >= 0), {
      message: "Amount must be a positive number",
    }),
});

const KIND_META = {
  bill: { icon: Receipt, dot: "bg-danger", label: "Bill" },
  income: { icon: Banknote, dot: "bg-success", label: "Income" },
  reminder: { icon: Bell, dot: "bg-info", label: "Reminder" },
};

export default function CalendarPage() {
  const { t, locale, currency } = useI18n();
  const queryClient = useQueryClient();

  const [month, setMonth] = useState(currentMonthKey());
  const [selectedDay, setSelectedDay] = useState(todayISO());
  const [reminderOpen, setReminderOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["calendar", month],
    queryFn: () => getCalendar(month),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["calendar"] });

  const createMutation = useMutation({
    mutationFn: createReminder,
    onSuccess: () => {
      invalidate();
      notify({ type: "success", title: "Reminder added" });
      setReminderOpen(false);
    },
    onError: () => notify({ type: "error", title: "Couldn't add reminder", message: "Please try again." }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteReminder,
    onSuccess: () => {
      invalidate();
      notify({ type: "success", title: "Reminder deleted" });
      setDeleting(null);
    },
    onError: () => notify({ type: "error", title: "Couldn't delete reminder", message: "Please try again." }),
  });

  const dayEvents = (data?.events ?? []).filter((event) => event.date === selectedDay);

  return (
    <div>
      <PageHeader
        title="Calendar"
        subtitle="Bills, expected income and your own reminders — all in one view."
        crumbs={[t("nav.calendar")]}
        actions={
          <Button icon={Plus} onClick={() => setReminderOpen(true)}>
            Add reminder
          </Button>
        }
      />

      {isError ? (
        <ErrorState onRetry={refetch} message="We couldn't load this month." />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between px-5 pb-4 pt-5">
              <h3 className="text-[15px] font-semibold text-ink">{monthLabel(month, locale)}</h3>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => setMonth(addMonths(month, -1))} icon={ChevronLeft}>
                  <span className="sr-only">Previous month</span>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setMonth(currentMonthKey());
                    setSelectedDay(todayISO());
                  }}
                >
                  Today
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setMonth(addMonths(month, 1))} icon={ChevronRight}>
                  <span className="sr-only">Next month</span>
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="p-5" aria-hidden="true">
                <Skeleton className="h-96 w-full" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-7 gap-px border-t border-line bg-line">
                  {weekdayLabels(locale).map((day) => (
                    <div key={day} className="bg-surface px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-faint">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-px border-t border-line bg-line">
                  {Array.from({ length: firstWeekday(month) }, (_, i) => (
                    <div key={`blank-${i}`} className="bg-surface" aria-hidden="true" />
                  ))}
                  {Array.from({ length: daysInMonth(month) }, (_, i) => {
                    const date = `${month}-${String(i + 1).padStart(2, "0")}`;
                    const events = (data?.events ?? []).filter((event) => event.date === date);
                    const isToday = date === todayISO();
                    const isSelected = date === selectedDay;
                    return (
                      <button
                        key={date}
                        type="button"
                        onClick={() => setSelectedDay(date)}
                        aria-label={`${formatShortDate(date, locale)}, ${events.length} event${events.length === 1 ? "" : "s"}`}
                        aria-pressed={isSelected}
                        className={cn(
                          "flex min-h-16 flex-col items-stretch gap-1 bg-surface p-1.5 text-left transition-colors hover:bg-elevated sm:min-h-20",
                          isSelected && "bg-brand-soft ring-1 ring-inset ring-brand"
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium tabular-nums",
                            isToday ? "bg-brand text-white" : "text-muted",
                            isSelected && !isToday && "text-brand"
                          )}
                        >
                          {i + 1}
                        </span>
                        <span className="flex flex-col gap-0.5">
                          {events.slice(0, 2).map((event) => {
                            const meta = KIND_META[event.kind] ?? KIND_META.reminder;
                            return (
                              <span key={event.id} className="flex items-center gap-1 text-[10px] font-medium text-muted">
                                <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", meta.dot)} aria-hidden="true" />
                                <span className="truncate">{event.title}</span>
                              </span>
                            );
                          })}
                          {events.length > 2 && (
                            <span className="text-[10px] font-medium text-faint">+{events.length - 2} more</span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex flex-wrap items-center gap-4 border-t border-line px-5 py-3.5 text-xs text-muted">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-danger" /> Bills</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" /> Expected income</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-info" /> Reminders</span>
                </div>
              </>
            )}
          </Card>

          {/* Day detail */}
          <Card className="flex h-fit flex-col lg:sticky lg:top-24">
            <CardHeader
              title={formatLongDate(parseISO(selectedDay), locale)}
              subtitle={`${dayEvents.length} scheduled item${dayEvents.length === 1 ? "" : "s"}`}
              action={<CalendarDays size={16} className="text-faint" aria-hidden="true" />}
            />
            <CardContent className="flex-1">
              {isLoading ? (
                <div className="flex flex-col gap-3" aria-hidden="true">
                  {Array.from({ length: 3 }, (_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : dayEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Bell size={20} className="text-faint" aria-hidden="true" />
                  <p className="mt-3 text-sm font-medium text-ink">Nothing scheduled</p>
                  <p className="mt-1 text-[13px] text-muted">No bills, income or reminders on this day.</p>
                  <Button variant="secondary" size="sm" icon={Plus} className="mt-4" onClick={() => setReminderOpen(true)}>
                    Add reminder
                  </Button>
                </div>
              ) : (
                <ul className="flex flex-col gap-2.5">
                  {dayEvents.map((event) => {
                    const meta = KIND_META[event.kind] ?? KIND_META.reminder;
                    return (
                      <li
                        key={event.id}
                        className="flex items-center gap-3 rounded-xl border border-line bg-elevated/50 p-3"
                      >
                        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", event.kind === "bill" ? "bg-danger-soft text-danger" : event.kind === "income" ? "bg-success-soft text-success" : "bg-info-soft text-info")}>
                          <meta.icon size={16} aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-medium text-ink">{event.title}</span>
                          <span className="text-xs text-faint">{meta.label}{event.description !== meta.label ? ` · ${event.description}` : ""}</span>
                        </span>
                        {event.amount != null && (
                          <span className={cn("text-[13px] font-semibold tabular-nums", event.kind === "income" ? "text-success" : "text-ink")}>
                            {formatCurrency(event.amount, currency, locale)}
                          </span>
                        )}
                        {event.kind === "reminder" && (
                          <Dropdown
                            align="end"
                            trigger={
                              <button
                                type="button"
                                aria-label={`Actions for ${event.title}`}
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-faint transition-colors hover:bg-surface hover:text-ink"
                              >
                                <span className="flex gap-0.5" aria-hidden="true">
                                  <span className="h-1 w-1 rounded-full bg-current" />
                                  <span className="h-1 w-1 rounded-full bg-current" />
                                  <span className="h-1 w-1 rounded-full bg-current" />
                                </span>
                              </button>
                            }
                            items={[
                              {
                                label: "Delete",
                                icon: Trash2,
                                tone: "danger",
                                onClick: () => setDeleting(event),
                              },
                            ]}
                          />
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <ReminderForm
        open={reminderOpen}
        defaultDate={selectedDay}
        onClose={() => setReminderOpen(false)}
        onSubmit={(values) => createMutation.mutate(values)}
        saving={createMutation.isPending}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleteMutation.mutate(deleting.id)}
        loading={deleteMutation.isPending}
        title="Delete reminder"
        description={`Remove "${deleting?.title ?? ""}" from your calendar?`}
        confirmLabel="Delete reminder"
      />
    </div>
  );
}

function ReminderForm({ open, defaultDate, onClose, onSubmit, saving }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(reminderSchema),
    defaultValues: { title: "", date: defaultDate, amount: "" },
  });

  const openForm = () => reset({ title: "", date: defaultDate, amount: "" });

  return (
    <Modal
      open={open}
      onClose={onClose}
      onOpen={openForm}
      title="New reminder"
      description="A personal note pinned to a specific day."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit((values) =>
              onSubmit({ ...values, amount: values.amount === "" ? null : Number(values.amount) })
            )}
            loading={saving}
          >
            Add reminder
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input label="Title" placeholder="e.g. Renew domain name" error={errors.title?.message} {...register("title")} />
        <Input label="Date" type="date" error={errors.date?.message} {...register("date")} />
        <Input
          label="Amount (optional)"
          type="number"
          step="10"
          min="0"
          placeholder="e.g. 2500"
          error={errors.amount?.message}
          {...register("amount")}
        />
      </div>
    </Modal>
  );
}
