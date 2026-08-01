import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight, Pencil, Plus, Trash2, Wallet } from "lucide-react";
import { deleteBudget, getBudgets, saveBudget } from "@/services/api";
import { categories } from "@/data/generator";
import { notify } from "@/store/appStore";
import { useI18n } from "@/hooks/useI18n";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, Progress } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Dropdown } from "@/components/ui/Dropdown";
import { ConfirmDialog, Modal } from "@/components/ui/Modal";
import { EmptyState, ErrorState, Skeleton } from "@/components/common/States";
import { CategoryIcon } from "@/constants";
import { formatCurrency, formatNumber, monthLabel } from "@/utils/format";
import { cn } from "@/utils/cn";

const budgetSchema = z.object({
  categoryId: z.string().min(1, "Choose a category"),
  limit: z.coerce
    .number("Enter a monthly limit")
    .positive("Limit must be greater than zero")
    .max(1_000_000, "That limit looks too large"),
});

export default function BudgetsPage() {
  const { t, locale, currency } = useI18n();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["budgets"],
    queryFn: getBudgets,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["budgets"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const saveMutation = useMutation({
    mutationFn: saveBudget,
    onSuccess: (_result, variables) => {
      invalidate();
      notify({
        type: "success",
        title: variables.categoryId && editing ? "Budget updated" : "Budget created",
      });
      setFormOpen(false);
      setEditing(null);
    },
    onError: () => notify({ type: "error", title: "Couldn't save budget", message: "Please try again." }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBudget,
    onSuccess: () => {
      invalidate();
      notify({ type: "success", title: "Budget deleted" });
      setDeleting(null);
    },
    onError: () => notify({ type: "error", title: "Couldn't delete budget", message: "Please try again." }),
  });

  return (
    <div>
      <PageHeader
        title="Budgets"
        subtitle="Monthly limits for every spending category — with alerts before you overshoot."
        crumbs={[t("nav.budgets")]}
        actions={
          <Button icon={Plus} onClick={() => setFormOpen(true)}>
            New budget
          </Button>
        }
      />

      {isError ? (
        <ErrorState onRetry={refetch} message="We couldn't load your budgets." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="p-5">
              <p className="text-[13px] font-medium text-muted">Monthly budget</p>
              <p className="mt-2 text-[22px] font-bold tracking-tight text-ink tabular-nums">
                {data ? formatCurrency(data.totalLimit, currency, locale) : "—"}
              </p>
              <p className="mt-1 text-xs text-faint">{data ? monthLabel(data.month, locale) : " "}</p>
            </Card>
            <Card className="p-5">
              <p className="text-[13px] font-medium text-muted">Spent so far</p>
              <p className="mt-2 text-[22px] font-bold tracking-tight text-ink tabular-nums">
                {data ? formatCurrency(data.totalSpent, currency, locale) : "—"}
              </p>
              <p className="mt-1 text-xs text-faint">
                {data && data.totalLimit > 0
                  ? `${formatNumber((data.totalSpent / data.totalLimit) * 100, locale, 1)}% of total`
                  : " "}
              </p>
            </Card>
            <Card className="p-5">
              <p className="flex items-center gap-1.5 text-[13px] font-medium text-muted">
                Remaining
                {data?.alertCount > 0 && (
                  <Badge tone="warning">{data.alertCount} need attention</Badge>
                )}
              </p>
              <p
                className={cn(
                  "mt-2 text-[22px] font-bold tracking-tight tabular-nums",
                  (data?.remaining ?? 0) >= 0 ? "text-ink" : "text-danger"
                )}
              >
                {data ? formatCurrency(data.remaining, currency, locale) : "—"}
              </p>
              <p className="mt-1 text-xs text-faint">
                {(data?.remaining ?? 0) < 0 ? "Over budget this month" : "Left to spend this month"}
              </p>
            </Card>
          </div>

          <div className="mt-4">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }, (_, i) => (
                  <Skeleton key={i} className="h-44 w-full rounded-2xl" />
                ))}
              </div>
            ) : !data?.items?.length ? (
              <Card>
                <EmptyState
                  icon={Wallet}
                  title="No budgets yet"
                  description="Create monthly limits for your spending categories to keep an eye on cash burn."
                  action={
                    <Button size="sm" icon={Plus} onClick={() => setFormOpen(true)}>
                      Create your first budget
                    </Button>
                  }
                />
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {data.items.map((budget) => (
                  <BudgetCard
                    key={budget.categoryId}
                    budget={budget}
                    currency={currency}
                    locale={locale}
                    onEdit={() => {
                      setEditing(budget);
                      setFormOpen(true);
                    }}
                    onDelete={() => setDeleting(budget)}
                    onViewTransactions={() =>
                      navigate(`/transactions?q=${encodeURIComponent(budget.category.name)}`)
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <BudgetForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        editing={editing}
        onSubmit={(values) => saveMutation.mutate(values)}
        saving={saveMutation.isPending}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleteMutation.mutate(deleting.categoryId)}
        loading={deleteMutation.isPending}
        title="Delete budget"
        description={`Remove the monthly limit for "${deleting?.category?.name ?? ""}"? Your transactions stay untouched.`}
        confirmLabel="Delete budget"
      />
    </div>
  );
}

function BudgetCard({ budget, currency, locale, onEdit, onDelete, onViewTransactions }) {
  const statusMeta = {
    "on-track": { label: "On track", tone: "success" },
    warning: { label: "Warning", tone: "warning" },
    over: { label: "Over budget", tone: "danger" },
  };
  const status = statusMeta[budget.status];

  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${budget.category.color}1f`, color: budget.category.color }}
          >
            <CategoryIcon icon={budget.category.icon} size={18} />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">{budget.category.name}</p>
            <p className="text-xs text-faint">per month</p>
          </div>
        </div>
        <Badge tone={status.tone} dot>
          {status.label}
        </Badge>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <p className="text-[15px] font-semibold text-ink tabular-nums">
          {formatCurrency(budget.spent, currency, locale)}
          <span className="text-[13px] font-medium text-faint">
            {" "}
            / {formatCurrency(budget.limit, currency, locale)}
          </span>
        </p>
        <p className="text-xs font-medium text-faint tabular-nums">{formatNumber(budget.pct, locale, 0)}%</p>
      </div>
      <Progress value={budget.pct} tone="auto" className="mt-2" />

      <div className="mt-4 flex items-center justify-between border-t border-line pt-3.5">
        <p
          className={cn(
            "text-[13px] font-medium tabular-nums",
            budget.remaining >= 0 ? "text-success" : "text-danger"
          )}
        >
          {budget.remaining >= 0
            ? `${formatCurrency(budget.remaining, currency, locale)} left`
            : `${formatCurrency(Math.abs(budget.remaining), currency, locale)} over`}
        </p>
        <Dropdown
          align="end"
          trigger={
            <button
              type="button"
              aria-label={`Actions for ${budget.category.name}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-faint transition-colors hover:bg-elevated hover:text-ink"
            >
              <span className="flex gap-0.5" aria-hidden="true">
                <span className="h-1 w-1 rounded-full bg-current" />
                <span className="h-1 w-1 rounded-full bg-current" />
                <span className="h-1 w-1 rounded-full bg-current" />
              </span>
            </button>
          }
          items={[
            { label: "Edit limit", icon: Pencil, onClick: onEdit },
            {
              label: "View transactions",
              icon: ArrowRight,
              onClick: onViewTransactions,
            },
            { label: "Delete", icon: Trash2, tone: "danger", onClick: onDelete },
          ]}
        />
      </div>
    </Card>
  );
}

function BudgetForm({ open, onClose, editing, onSubmit, saving }) {
  const budgetedIds = new Set(
    (editing ? [editing] : []).map((b) => b.categoryId)
  );
  const available = categories.filter(
    (c) => c.type === "expense" && (!budgetedIds.has(c.id) || editing?.categoryId === c.id)
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(budgetSchema),
    defaultValues: { categoryId: "", limit: "" },
  });

  const openForm = () => {
    reset(
      editing
        ? { categoryId: editing.categoryId, limit: String(editing.limit) }
        : { categoryId: available[0]?.id ?? "", limit: "" }
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit budget" : "New budget"}
      description={editing ? `Adjust the monthly limit for ${editing.category.name}.` : "Pick a category and set its monthly ceiling."}
      onOpen={openForm}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={saving}>
            {editing ? "Save changes" : "Create budget"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Select label="Category" error={errors.categoryId?.message} disabled={Boolean(editing)} {...register("categoryId")}>
          {available.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        <Input
          label="Monthly limit"
          type="number"
          step="10"
          min="1"
          placeholder="e.g. 1200"
          error={errors.limit?.message}
          hint="We'll alert you when spending passes 85%."
          {...register("limit")}
        />
        {editing && (
          <p className="flex items-start gap-2 rounded-xl bg-warning-soft px-3.5 py-2.5 text-[13px] text-warning">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
            This category has spent {formatCurrency(editing.spent, "USD")} this month — consider
            whether the new limit still makes sense.
          </p>
        )}
      </div>
    </Modal>
  );
}
