import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Download, FilterX, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { accounts, categories } from "@/data/generator";
import { getTransactions } from "@/services/api";
import { useDebounce } from "@/hooks/useDebounce";
import { useI18n } from "@/hooks/useI18n";
import { notify } from "@/store/appStore";
import {
  useDeleteTransaction,
  useTransactionsQuery,
} from "./transactionsApi";
import { TransactionForm } from "./TransactionForm";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { Dropdown } from "@/components/ui/Dropdown";
import { ConfirmDialog } from "@/components/ui/Modal";
import {
  Pagination,
  SortableTh,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/ui/Table";
import { EmptyState, ErrorState, Skeleton } from "@/components/common/States";
import { CategoryIcon } from "@/constants";
import { downloadCsv, toCsv } from "@/utils/csv";
import { formatCurrency, formatDate, todayISO } from "@/utils/format";
import { cn } from "@/utils/cn";

const PAGE_SIZE = 8;

export default function TransactionsPage() {
  const { t, locale, currency } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const debouncedSearch = useDebounce(search, 300);
  const [type, setType] = useState("all");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState({ key: "date", dir: "desc" });
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [exporting, setExporting] = useState(false);

  const deleteMutation = useDeleteTransaction();

  // Deep links: ?new=1 opens the composer, ?q= fills the search box.
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setFormOpen(true);
      searchParams.delete("new");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q != null) {
      setSearch(q);
      setPage(1);
    }
  }, [searchParams]);

  const filters = {
    search: debouncedSearch,
    type,
    category,
    sortBy: sort.key,
    sortDir: sort.dir,
    page,
    pageSize: PAGE_SIZE,
  };

  const { data, isLoading, isError, refetch } = useTransactionsQuery(filters);
  const hasActiveFilters = Boolean(debouncedSearch) || type !== "all" || category !== "all";

  const clearFilters = () => {
    setSearch("");
    setType("all");
    setCategory("all");
    setPage(1);
  };

  const handleSort = (key) => {
    setSort((current) =>
      current.key === key
        ? { key, dir: current.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "description" ? "asc" : "desc" }
    );
    setPage(1);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const { items } = await getTransactions({
        search: debouncedSearch,
        type,
        category,
        sortBy: sort.key,
        sortDir: sort.dir,
        page: 1,
        pageSize: 100_000,
      });
      const csv = toCsv(items, [
        { label: "Date", accessor: (row) => row.date },
        { label: "Description", key: "description" },
        { label: "Merchant", key: "merchant" },
        { label: "Category", key: "categoryName" },
        { label: "Account", key: "accountName" },
        { label: "Type", key: "type" },
        { label: "Amount", key: "amount" },
        { label: "Status", key: "status" },
      ]);
      downloadCsv(`meridian-transactions-${todayISO()}.csv`, csv);
      notify({ type: "success", title: `Exported ${items.length} transactions` });
    } catch {
      notify({ type: "error", title: "Export failed", message: "Please try again." });
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = () => {
    if (!deleting) return;
    deleteMutation.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
  };

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle="Every movement across your accounts, searchable and exportable."
        crumbs={[t("nav.transactions")]}
        actions={
          <>
            <Button variant="secondary" icon={Download} onClick={handleExport} loading={exporting}>
              {t("common.exportCsv")}
            </Button>
            <Button icon={Plus} onClick={() => setFormOpen(true)}>
              {t("common.add")} transaction
            </Button>
          </>
        }
      />

      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              size={15}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder={`${t("common.search")} description, merchant, category…`}
              aria-label={t("common.search")}
              className="h-10 w-full rounded-xl border border-line-strong bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-faint transition-all focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Select
              aria-label="Filter by type"
              className="w-36"
              value={type}
              onChange={(event) => {
                setType(event.target.value);
                setPage(1);
              }}
            >
              <option value="all">All types</option>
              <option value="income">Income</option>
              <option value="expense">Expenses</option>
            </Select>
            <Select
              aria-label="Filter by category"
              className="w-44"
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setPage(1);
              }}
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" icon={FilterX} onClick={clearFilters}>
                Clear
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card className="mt-4">
        {isError ? (
          <ErrorState onRetry={refetch} message="We couldn't load your transactions." />
        ) : isLoading ? (
          <div className="flex flex-col gap-3 p-5" aria-hidden="true">
            {Array.from({ length: 7 }, (_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : data.items.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No transactions found"
            description={
              hasActiveFilters
                ? "Nothing matches your search and filters. Try widening them."
                : "Add your first transaction to start building your ledger."
            }
            action={
              hasActiveFilters ? (
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : (
                <Button size="sm" icon={Plus} onClick={() => setFormOpen(true)}>
                  Add transaction
                </Button>
              )
            }
          />
        ) : (
          <>
            <Table>
              <THead>
                <Tr>
                  <SortableTh label="Date" sortKey="date" sort={sort} onSort={handleSort} />
                  <SortableTh label="Description" sortKey="description" sort={sort} onSort={handleSort} />
                  <Th>Category</Th>
                  <Th>Account</Th>
                  <Th>Status</Th>
                  <SortableTh label="Amount" sortKey="amount" sort={sort} onSort={handleSort} className="text-right" />
                  <Th className="sr-only">Actions</Th>
                </Tr>
              </THead>
              <TBody>
                {data.items.map((transaction) => (
                  <Tr key={transaction.id}>
                    <Td className="text-muted tabular-nums">
                      {formatDate(transaction.date, locale)}
                    </Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                          style={{
                            backgroundColor: `${transaction.categoryColor}1f`,
                            color: transaction.categoryColor,
                          }}
                        >
                          <CategoryIcon icon={transaction.categoryIcon} size={14} />
                        </span>
                        <span className="min-w-0">
                          <span className="block max-w-[260px] truncate font-medium text-ink">
                            {transaction.description}
                          </span>
                          <span className="block text-xs text-faint">{transaction.merchant}</span>
                        </span>
                      </div>
                    </Td>
                    <Td>
                      <span className="inline-flex items-center gap-1.5 text-[13px] text-muted">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: transaction.categoryColor }}
                          aria-hidden="true"
                        />
                        {transaction.categoryName}
                      </span>
                    </Td>
                    <Td className="text-muted">{transaction.accountName}</Td>
                    <Td>
                      <Badge tone={transaction.status === "cleared" ? "success" : "warning"} dot>
                        {transaction.status === "cleared" ? "Cleared" : "Pending"}
                      </Badge>
                    </Td>
                    <Td className="text-right">
                      <span
                        className={cn(
                          "font-semibold tabular-nums",
                          transaction.type === "income" ? "text-success" : "text-ink"
                        )}
                      >
                        {transaction.type === "income" ? "+" : "−"}
                        {formatCurrency(transaction.amount, currency, locale)}
                      </span>
                    </Td>
                    <Td className="text-right">
                      <Dropdown
                        align="end"
                        trigger={
                          <button
                            type="button"
                            aria-label={`Actions for ${transaction.description}`}
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
                          {
                            label: "Edit",
                            icon: Pencil,
                            onClick: () => {
                              setEditing(transaction);
                              setFormOpen(true);
                            },
                          },
                          {
                            label: "Delete",
                            icon: Trash2,
                            tone: "danger",
                            onClick: () => setDeleting(transaction),
                          },
                        ]}
                      />
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
            <div className="border-t border-line px-5 py-4">
              <Pagination
                page={data.page}
                pageSize={data.pageSize}
                total={data.total}
                onChange={setPage}
              />
            </div>
          </>
        )}
      </Card>

      <TransactionForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        transaction={editing}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
        title="Delete transaction"
        description={`This will permanently remove "${deleting?.description ?? ""}" from your ledger. This action can't be undone.`}
        confirmLabel="Delete transaction"
      />
    </div>
  );
}
