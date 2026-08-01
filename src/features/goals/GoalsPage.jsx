import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Target, Trash2, Wallet } from "lucide-react";
import { contributeToGoal, createGoal, deleteGoal, getGoals } from "@/services/api";
import { notify } from "@/store/appStore";
import { useI18n } from "@/hooks/useI18n";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, Progress } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Dropdown } from "@/components/ui/Dropdown";
import { ConfirmDialog, Modal } from "@/components/ui/Modal";
import { EmptyState, ErrorState, Skeleton } from "@/components/common/States";
import { CategoryIcon, GOAL_COLORS } from "@/constants";
import { formatCurrency, formatDate, formatNumber, relativeLabel } from "@/utils/format";
import { cn } from "@/utils/cn";

const goalSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters").max(40, "Keep it under 40 characters"),
  target: z.coerce.number("Enter a target amount").positive("Target must be greater than zero"),
  saved: z.coerce.number("Enter a starting amount").min(0, "Can't be negative"),
  deadline: z.string().min(1, "Pick a deadline"),
  color: z.string().min(1),
});

const contributeSchema = z.object({
  amount: z.coerce.number("Enter an amount").positive("Amount must be greater than zero"),
});

export default function GoalsPage() {
  const { t, locale, currency } = useI18n();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [contributing, setContributing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["goals"],
    queryFn: getGoals,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["goals"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const createMutation = useMutation({
    mutationFn: createGoal,
    onSuccess: () => {
      invalidate();
      notify({ type: "success", title: "Goal created", message: "Now add a first contribution to get moving." });
      setFormOpen(false);
    },
    onError: () => notify({ type: "error", title: "Couldn't create goal", message: "Please try again." }),
  });

  const contributeMutation = useMutation({
    mutationFn: ({ id, amount }) => contributeToGoal(id, amount),
    onSuccess: () => {
      invalidate();
      notify({ type: "success", title: "Contribution added" });
      setContributing(null);
    },
    onError: () => notify({ type: "error", title: "Couldn't add contribution", message: "Please try again." }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGoal,
    onSuccess: () => {
      invalidate();
      notify({ type: "success", title: "Goal deleted" });
      setDeleting(null);
    },
    onError: () => notify({ type: "error", title: "Couldn't delete goal", message: "Please try again." }),
  });

  const totalSaved = data?.reduce((sum, goal) => sum + goal.saved, 0) ?? 0;
  const totalTarget = data?.reduce((sum, goal) => sum + goal.target, 0) ?? 0;

  return (
    <div>
      <PageHeader
        title="Savings goals"
        subtitle="Put money aside on purpose — track progress toward the things that matter."
        crumbs={[t("nav.goals")]}
        actions={
          <Button icon={Plus} onClick={() => setFormOpen(true)}>
            New goal
          </Button>
        }
      />

      {isError ? (
        <ErrorState onRetry={refetch} message="We couldn't load your goals." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="p-5">
              <p className="text-[13px] font-medium text-muted">Total saved</p>
              <p className="mt-2 text-[22px] font-bold tracking-tight text-ink tabular-nums">
                {formatCurrency(totalSaved, currency, locale)}
              </p>
              <p className="mt-1 text-xs text-faint">across {data?.length ?? 0} goals</p>
            </Card>
            <Card className="p-5">
              <p className="text-[13px] font-medium text-muted">Total target</p>
              <p className="mt-2 text-[22px] font-bold tracking-tight text-ink tabular-nums">
                {formatCurrency(totalTarget, currency, locale)}
              </p>
              <p className="mt-1 text-xs text-faint">combined savings goal</p>
            </Card>
            <Card className="p-5">
              <p className="text-[13px] font-medium text-muted">Overall completion</p>
              <p className="mt-2 text-[22px] font-bold tracking-tight text-ink tabular-nums">
                {totalTarget > 0 ? formatNumber((totalSaved / totalTarget) * 100, locale, 1) : 0}%
              </p>
              <Progress
                value={totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0}
                tone="brand"
                className="mt-3"
              />
            </Card>
          </div>

          <div className="mt-4">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 3 }, (_, i) => (
                  <Skeleton key={i} className="h-52 w-full rounded-2xl" />
                ))}
              </div>
            ) : !data?.length ? (
              <Card>
                <EmptyState
                  icon={Target}
                  title="No goals yet"
                  description="Whether it's an emergency fund or a trip, define a target and a deadline."
                  action={
                    <Button size="sm" icon={Plus} onClick={() => setFormOpen(true)}>
                      Create your first goal
                    </Button>
                  }
                />
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {data.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    currency={currency}
                    locale={locale}
                    onContribute={() => setContributing(goal)}
                    onDelete={() => setDeleting(goal)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <GoalForm open={formOpen} onClose={() => setFormOpen(false)} onSubmit={(values) => createMutation.mutate(values)} saving={createMutation.isPending} />

      <ContributeModal
        goal={contributing}
        onClose={() => setContributing(null)}
        onSubmit={({ amount }) => contributeMutation.mutate({ id: contributing.id, amount })}
        saving={contributeMutation.isPending}
        currency={currency}
        locale={locale}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleteMutation.mutate(deleting.id)}
        loading={deleteMutation.isPending}
        title="Delete goal"
        description={`Remove "${deleting?.name ?? ""}"? Saved progress will be discarded.`}
        confirmLabel="Delete goal"
      />
    </div>
  );
}

const statusMeta = {
  completed: { label: "Completed", tone: "success" },
  "on-track": { label: "On track", tone: "brand" },
  "due-soon": { label: "Due soon", tone: "warning" },
  overdue: { label: "Overdue", tone: "danger" },
};

function GoalCard({ goal, currency, locale, onContribute, onDelete }) {
  const status = statusMeta[goal.status];
  const daysText = goal.status === "overdue" ? "Overdue" : relativeLabel(goal.deadline);

  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <GoalRing pct={goal.pct} color={goal.color} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{goal.name}</p>
            <p className="text-xs text-faint">{daysText}</p>
          </div>
        </div>
        <Badge tone={status.tone} dot>
          {status.label}
        </Badge>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <p className="text-[17px] font-bold text-ink tabular-nums">
          {formatCurrency(goal.saved, currency, locale)}
          <span className="text-[13px] font-medium text-faint">
            {" "}
            / {formatCurrency(goal.target, currency, locale)}
          </span>
        </p>
        <p className="text-xs font-semibold text-muted tabular-nums">
          {formatNumber(goal.pct, locale, 0)}%
        </p>
      </div>
      <Progress value={goal.pct} tone={goal.pct >= 100 ? "success" : "brand"} className="mt-2" />

      <div className="mt-4 flex items-center justify-between border-t border-line pt-3.5">
        <p className="text-[13px] text-faint">
          {goal.monthsLeft > 0 ? `${goal.monthsLeft} month${goal.monthsLeft === 1 ? "" : "s"} to go` : "Deadline reached"}
        </p>
        <div className="flex items-center gap-1.5">
          <Button variant="secondary" size="sm" icon={Wallet} onClick={onContribute} disabled={goal.status === "completed"}>
            Add funds
          </Button>
          <Dropdown
            align="end"
            trigger={
              <button
                type="button"
                aria-label={`Actions for ${goal.name}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-faint transition-colors hover:bg-elevated hover:text-ink"
              >
                <span className="flex gap-0.5" aria-hidden="true">
                  <span className="h-1 w-1 rounded-full bg-current" />
                  <span className="h-1 w-1 rounded-full bg-current" />
                  <span className="h-1 w-1 rounded-full bg-current" />
                </span>
              </button>
            }
            items={[{ label: "Delete", icon: Trash2, tone: "danger", onClick: onDelete }]}
          />
        </div>
      </div>
    </Card>
  );
}

function GoalRing({ pct, color, size = 56 }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(1, pct / 100));
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`${Math.round(pct)}% complete`}
      className="shrink-0"
    >
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="var(--line)" strokeWidth="6" fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="11"
        fontWeight="700"
        fill="var(--ink)"
      >
        {Math.round(pct)}%
      </text>
    </svg>
  );
}

function GoalForm({ open, onClose, onSubmit, saving }) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(goalSchema),
    defaultValues: { name: "", target: "", saved: "0", deadline: "", color: GOAL_COLORS[0] },
  });
  const color = watch("color");

  const openForm = () =>
    reset({ name: "", target: "", saved: "0", deadline: "", color: GOAL_COLORS[0] });

  return (
    <Modal
      open={open}
      onClose={onClose}
      onOpen={openForm}
      title="New savings goal"
      description="Set a target, a deadline and a starting balance."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={saving}>
            Create goal
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input label="Goal name" placeholder="e.g. Japan Trip" error={errors.name?.message} {...register("name")} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Target amount" type="number" step="100" min="1" placeholder="9000" error={errors.target?.message} {...register("target")} />
          <Input label="Starting balance" type="number" step="10" min="0" placeholder="0" error={errors.saved?.message} {...register("saved")} />
        </div>
        <Input label="Deadline" type="date" error={errors.deadline?.message} {...register("deadline")} />
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-ink">Color</span>
          <div className="flex items-center gap-2.5" role="radiogroup" aria-label="Goal color">
            {GOAL_COLORS.map((swatch) => (
              <button
                key={swatch}
                type="button"
                role="radio"
                aria-checked={color === swatch}
                aria-label={`Color ${swatch}`}
                onClick={() => setValue("color", swatch, { shouldValidate: true })}
                className="h-8 w-8 rounded-full transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                style={{
                  backgroundColor: swatch,
                  boxShadow:
                    color === swatch
                      ? "0 0 0 2px var(--surface), 0 0 0 4px " + swatch
                      : undefined,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function ContributeModal({ goal, onClose, onSubmit, saving, currency, locale }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(contributeSchema),
    defaultValues: { amount: "" },
  });

  const openForm = () => reset({ amount: "" });

  return (
    <Modal
      open={Boolean(goal)}
      onClose={onClose}
      onOpen={openForm}
      title={`Add funds — ${goal?.name ?? ""}`}
      description={
        goal
          ? `${formatCurrency(goal.saved, currency, locale)} saved of ${formatCurrency(goal.target, currency, locale)}`
          : undefined
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={saving} icon={Wallet}>
            Add funds
          </Button>
        </>
      }
    >
      <Input
        label="Amount"
        type="number"
        step="10"
        min="1"
        placeholder="500"
        autoFocus
        error={errors.amount?.message}
        {...register("amount")}
      />
    </Modal>
  );
}
