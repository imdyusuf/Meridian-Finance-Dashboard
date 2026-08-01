import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTransaction,
  deleteTransaction,
  getTransactions,
  updateTransaction,
} from "@/services/api";
import { notify } from "@/store/appStore";

export function useTransactionsQuery(filters) {
  return useQuery({
    queryKey: ["transactions", filters],
    queryFn: () => getTransactions(filters),
  });
}

const AFFECTED_COLLECTIONS = [
  "transactions",
  "dashboard",
  "budgets",
  "analytics",
  "reports",
  "calendar",
];

function invalidateLedger(queryClient) {
  AFFECTED_COLLECTIONS.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      invalidateLedger(queryClient);
      notify({ type: "success", title: "Transaction added", message: "Your ledger has been updated." });
    },
    onError: () => notify({ type: "error", title: "Couldn't add transaction", message: "Please try again." }),
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTransaction,
    onSuccess: () => {
      invalidateLedger(queryClient);
      notify({ type: "success", title: "Transaction updated" });
    },
    onError: () => notify({ type: "error", title: "Couldn't update transaction", message: "Please try again." }),
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      invalidateLedger(queryClient);
      notify({ type: "success", title: "Transaction deleted" });
    },
    onError: () => notify({ type: "error", title: "Couldn't delete transaction", message: "Please try again." }),
  });
}
