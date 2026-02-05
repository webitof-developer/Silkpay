'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/services/api';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from "@/components/ui/badge";
import { Copy, ArrowUpDown, CalendarIcon, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatCurrency, formatDate } from '@/utils/formatters';
import { exportToCSV } from '@/utils/exportData';
import { copyToClipboard } from "@/utils/helpers";
import { StatusBadge } from "@/components/shared/StatusBadge";

// Helper to safely format Decimal128 or number
const safeFormatCurrency = (val) => {
  const amount = val?.$numberDecimal ? val.$numberDecimal : (val || 0);
  return formatCurrency(amount);
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  // Filters (backend-supported only)
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState();

  /**
   * Canonical query params (single source of truth)
   */
  const queryParams = useMemo(() => {
    const params = { page, limit };

    if (type) params.type = type;
    if (search) params.search = search;
    if (dateRange?.from) params.start_date = dateRange.from;
    if (dateRange?.to) params.end_date = dateRange.to;

    return params;
  }, [page, limit, type, search, dateRange]);

  useEffect(() => {
    let cancelled = false;

    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const res = await api.get('/transactions', { params: queryParams });

        if (!cancelled && res?.data) {
          setTransactions(res.data.transactions || []);
          setPagination(res.data.pagination || {});
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to fetch transactions');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchTransactions();
    return () => { cancelled = true; };
  }, [queryParams]);

  const resetFilters = () => {
      setPage(1);
      setSearch('');
      setType('');
      setDateRange(undefined);
  };
  
  const handleExport = () => {
    if (!transactions.length) {
      toast.error('No transactions to export');
      return;
    }

    exportToCSV(
      transactions,
      [
        { key: '_id', label: 'ID' },
        { key: 'reference_no', label: 'Reference' },
        { key: 'description', label: 'Description' },
        { key: 'amount', label: 'Amount', format: formatCurrency },
        { key: 'type', label: 'Type' },
        { key: 'createdAt', label: 'Date', format: d => formatDate(d, 'full') }
      ],
      'transactions_export'
    );
  };

  const columns = [
    {
      accessorKey: "reference_no",
      header: "Reference",
      cell: ({ row }) => <span className="font-mono text-xs">{row.getValue("reference_no")}</span>
    },
    {
      accessorKey: "description",
      header: "Description",
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => safeFormatCurrency(row.getValue("amount")),
    },
    {
      accessorKey: "fee",
      header: "Fee",
      cell: ({ row }) => safeFormatCurrency(row.getValue("fee")),
    },
    {
      accessorKey: "balance_after",
      header: "Balance",
      cell: ({ row }) => safeFormatCurrency(row.getValue("balance_after")),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
          const type = row.getValue("type");
          let variant = "outline";
          if (type === 'PAYOUT') variant = "destructive"; // Money out
          if (type === 'REFUND') return <Badge variant={variant} className="bg-green-500">{type}</Badge>; // Money in (Green/Primary)
          return <Badge variant={variant}>{type}</Badge>
      },
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => formatDate(row.getValue("createdAt"), 'long'),
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
        <Button onClick={handleExport} variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <Input
          placeholder="Search reference or description"
          value={search}
          onChange={(e) => { setPage(1); setSearch(e.target.value); }}
          className="w-[220px]"
        />

        <Select value={type} onValueChange={(v) => { setPage(1); setType(v === 'ALL' ? '' : v); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="PAYOUT">Payout</SelectItem>
            <SelectItem value="REFUND">Refund</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[240px] justify-start">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from
                ? dateRange.to
                  ? `${format(dateRange.from, "LLL dd")} – ${format(dateRange.to, "LLL dd")}`
                  : format(dateRange.from, "LLL dd")
                : 'Date range'}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="p-0">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={(r) => { setPage(1); setDateRange(r); }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        {/* Reset Button */}
        <Button variant="ghost" onClick={resetFilters} className="px-2 lg:px-3 text-muted-foreground hover:text-foreground">
            Reset
        </Button>
      </div>

      {/* Table */}
      {loading
        ? <div>Loading…</div>
        : <DataTable columns={columns} data={transactions} manualPagination={true} />
      }

      {/* Pagination */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          disabled={pagination.page <= 1}
          onClick={() => setPage(p => p - 1)}
        >
          Prev
        </Button>
        <Button
          variant="outline"
          disabled={pagination.page >= pagination.pages}
          onClick={() => setPage(p => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
