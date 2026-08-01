import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { accounts, categories } from "@/data/generator";
import { todayISO } from "@/utils/format";
import { useCreateTransaction, useUpdateTransaction } from "./transactionsApi";
import { cn } from "@/utils/cn";

const schema = z.object({
  type: z.enum(["expense", "income"]),
  description: z
    .string()
    .trim()
    .min(3, "Description must be at least 3 characters")
    .max(60, "Keep it under 60 characters"),
  amount: z.coerce
    .number("Enter a valid amount")
    .positive("Amount must be greater than zero")
    .max(1_000_000, "That amount looks too large"),
  categoryId: z.string().min(1, "Choose a category"),
  accountId: z.string().min(1, "Choose an account"),
  date: z.string().min(1, "Choose a date"),
  status: z.enum(["cleared", "pending"]),
});

const expenseCategories = categories.filter((c) => c.type === "expense");
const incomeCategories = categories.filter((c) => c.type === "income");

export function TransactionForm({ open, onClose, transaction }) {
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const isEditing = Boolean(transaction);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    getValues,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "expense",
      description: "",
      amount: "",
      categoryId: expenseCategories[0].id,
      accountId: accounts[0].id,
      date: todayISO(),
      status: "cleared",
    },
  });

  const type = watch("type");
  const saving = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!open) return;
    if (transaction) {
      reset({
        type: transaction.type,
        description: transaction.description,
        amount: String(transaction.amount),
        categoryId: transaction.categoryId,
        accountId: transaction.accountId,
        date: transaction.date,
        status: transaction.status,
      });
    } else {
      reset({
        type: "expense",
        description: "",
        amount: "",
        categoryId: expenseCategories[0].id,
        accountId: accounts[0].id,
        date: todayISO(),
        status: "cleared",
      });
    }
  }, [open, transaction, reset]);

  // Keep the selected category valid when the type switches.
  useEffect(() => {
    const list = type === "expense" ? expenseCategories : incomeCategories;
    if (!list.some((c) => c.id === getValues("categoryId"))) {
      setValue("categoryId", list[0].id, { shouldValidate: true });
    }
  }, [type, getValues, setValue]);

  const onSubmit = (values) => {
    const payload = { ...values, amount: Number(values.amount) };
    if (isEditing) {
      updateMutation.mutate({ id: transaction.id, ...payload }, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit transaction" : "Add transaction"}
      description="Record a movement of money across your accounts."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={saving}>
            {isEditing ? "Save changes" : "Add transaction"}
          </Button>
        </>
      }
    >
      <form id="transaction-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div role="radiogroup" aria-label="Transaction type" className="grid grid-cols-2 gap-2">
          {[
            { value: "expense", label: "Expense" },
            { value: "income", label: "Income" },
          ].map((option) => {
            const active = type === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setValue("type", option.value, { shouldValidate: true })}
                className={cn(
                  "rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all",
                  active
                    ? option.value === "expense"
                      ? "border-danger bg-danger-soft text-danger"
                      : "border-success bg-success-soft text-success"
                    : "border-line-strong bg-surface text-muted hover:border-line-strong hover:bg-elevated"
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <Input
          label="Description"
          placeholder="e.g. Invoice #1186 — Lumen Studio"
          error={errors.description?.message}
          {...register("description")}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            error={errors.amount?.message}
            {...register("amount")}
          />
          <Input label="Date" type="date" error={errors.date?.message} {...register("date")} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select label="Category" error={errors.categoryId?.message} {...register("categoryId")}>
            {(type === "expense" ? expenseCategories : incomeCategories).map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
          <Select label="Account" error={errors.accountId?.message} {...register("accountId")}>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} — {account.institution}
              </option>
            ))}
          </Select>
        </div>

        <Select label="Status" {...register("status")}>
          <option value="cleared">Cleared</option>
          <option value="pending">Pending</option>
        </Select>
      </form>
    </Modal>
  );
}
