'use client';

import { useEffect, useState } from 'react';
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

export default function TransactionsPage() {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [accountSearch, setAccountSearch] = useState('');
  const [beneficiarySearch, setBeneficiarySearch] = useState('');
  const [utrSearch, setUtrSearch] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [dateFilter, setDateFilter] = useState();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        
        const response = await api.get('/transactions');
        // Backend returns: { success: true, data: { transactions, total } }
        if (response.success && response.data) {
          const rawTransactions = response.data.transactions || [];
          const formattedTransactions = rawTransactions.map(t => {
              const payout = t.payout_id || {};
              const benDetails = payout.beneficiary_details || {};
              
              // Backend now guarantees normalized fields on Payout
              return {
                  ...t,
                  id: t._id,
                  
                  // Identifiers
                  mOrderId: payout.out_trade_no || t.reference_no || '-', // Our Request ID
                  
                  // UTR: Try explicit UTR from webhook/query first, then fallback to Gateway ID (silkpay_order_no), then Transaction Reference
                  // Webhooks send flat 'utr', API responses send 'data.utr'
                  utr: payout.silkpay_response?.utr || 
                       payout.silkpay_response?.data?.utr || 
                       '-',
                  
                  // Beneficiary Info (Flattened from Payout)
                  beneficiary_name: benDetails.name || (t.description ? t.description.replace('Payout to ', '') : 'System'),
                  account_number: benDetails.account_number || '',
                  ifsc_code: benDetails.ifsc_code || '',
                  bank_name: 'Unknown',
                  
                  // Source: Check beneficiary type if populated, or fallback to SAVED
                  // Note: Backend must populate beneficiary_id for this to work precisely
                  source: (payout.beneficiary_id?.type === 'ONE_TIME' || t.description?.includes('One-Time')) ? 'ONE_TIME' : 'SAVED',

                  // Payment Details
                  // Amount is explicitly converted by DashboardService, ensuring number type here too just in case
                  amount: t.amount?.$numberDecimal ? parseFloat(t.amount.$numberDecimal) : (parseFloat(t.amount) || 0),
                  created_at: t.createdAt,
                  
                  // Normalized Status
                  // Use Payout Status if available, otherwise fallback based on type
                   status: t.type === 'PAYOUT' ? (payout.status || 'PROCESSING') : 
                          t.type === 'REFUND' ? 'SUCCESS' : 
                          'SUCCESS' // Default for Fee/Adjustment 
              };
          });
          setPayouts(formattedTransactions);
        } else if (Array.isArray(response.data)) {
           setPayouts(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch transactions", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredPayouts = payouts.filter(item => {
    const matchesType = typeFilter === 'ALL' || item.type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchesSource = sourceFilter === 'ALL' || item.source === sourceFilter;
    const matchesAccount = item.account_number?.toLowerCase().includes(accountSearch.toLowerCase());
    const matchesBeneficiary = item.beneficiary_name?.toLowerCase().includes(beneficiarySearch.toLowerCase());
    const matchesUTR = item.utr ? item.utr.toLowerCase().includes(utrSearch.toLowerCase()) : (utrSearch === '');
    
    let matchesAmount = true;
    const amount = parseFloat(item.amount);
    if (minAmount && amount < parseFloat(minAmount)) matchesAmount = false;
    if (maxAmount && amount > parseFloat(maxAmount)) matchesAmount = false;

    let matchesDate = true;
    if (dateFilter?.from) {
        const itemDate = new Date(item.created_at);
        const fromDate = new Date(dateFilter.from);
        fromDate.setHours(0, 0, 0, 0);
        
        const toDate = dateFilter.to ? new Date(dateFilter.to) : new Date(dateFilter.from);
        toDate.setHours(23, 59, 59, 999);

        matchesDate = itemDate >= fromDate && itemDate <= toDate;
    }

    return matchesStatus && matchesSource && matchesAccount && matchesBeneficiary && matchesUTR && matchesAmount && matchesDate;
  });

  const resetFilters = () => {
      setTypeFilter('ALL');
      setStatusFilter('ALL');
      setSourceFilter('ALL');
      setAccountSearch('');
      setBeneficiarySearch('');
      setUtrSearch('');
      setMinAmount('');
      setMaxAmount('');
      setDateFilter(undefined);
  };

  const handleExport = () => {
      if (filteredPayouts.length === 0) {
          toast.error("No transactions to export");
          return;
      }
      
      exportToCSV(
          filteredPayouts,
          [
              { key: 'id', label: 'ID' },
              { key: 'mOrderId', label: 'Merchant Ref' },
              { key: 'beneficiary_name', label: 'Beneficiary' },
              { key: 'account_number', label: 'Account Number' },
              { key: 'ifsc_code', label: 'IFSC Code' },
              { key: 'bank_name', label: 'Bank' },
              { key: 'amount', label: 'Amount (₹)', format: formatCurrency },
              { key: 'status', label: 'Status' },
              { key: 'utr', label: 'UTR' },
              { key: 'created_at', label: 'Date', format: (d) => formatDate(d, 'full') }
          ],
          'transactions_export'
      );
      toast.success('Transactions exported successfully');
  };

  const payoutColumns = [
    {
       accessorKey: "mOrderId",
       header: "Merchant Ref",
       cell: ({ row }) => <div className="font-mono text-xs">{row.getValue("mOrderId")}</div>,
    },
    {
       accessorKey: "beneficiary_name",
       header: ({ column }) => (
          <Button 
            variant="ghost" 
            className="p-0 hover:bg-transparent justify-start text-left font-semibold" 
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
             Beneficiary <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
       ),
       cell: ({ row }) => (
          <div className="flex flex-col">
              <div className="flex items-center gap-2">
                  <span className="font-medium">{row.getValue("beneficiary_name")}</span>
                  {row.original.source === 'ONE_TIME' && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-blue-500/30 text-blue-400 bg-blue-500/10">One-Time</Badge>
                  )}
              </div>
              <div className="text-xs text-muted-foreground font-mono mt-0.5">
                  {row.original.account_number}
              </div>
          </div>
       )
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <Button 
            variant="ghost" 
            className="p-0 hover:bg-transparent justify-start text-left font-semibold" 
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
           Amount <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-medium">{formatCurrency(row.getValue("amount"))}</div>,
    },

    {
      accessorKey: "balance_after",
      header: "Balance",
      cell: ({ row }) => {
          const bal = row.original.balance_after?.$numberDecimal ? parseFloat(row.original.balance_after.$numberDecimal) : (parseFloat(row.original.balance_after) || 0);
          return <div className="text-muted-foreground text-xs">{formatCurrency(bal)}</div>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
          const type = row.original.type;
          const status = row.getValue("status");
          
          if (type === 'PAYOUT') {
             return <Badge variant="outline" className="border-blue-500 text-blue-500">PAYOUT</Badge>
          }
          if (type === 'REFUND') {
             return <Badge variant="outline" className="border-green-500 text-green-500">REFUND</Badge>
          }
          
          return <StatusBadge status={status} />;
      },
    },
    {
        accessorKey: "utr",
        header: "UTR",
        cell: ({ row }) => {
            const utr = row.getValue("utr");
            if (!utr) return <span className="text-muted-foreground">-</span>;
            return (
                <div className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                    {utr}
                    <Button variant="ghost" size="icon" className="h-4 w-4 hover:bg-white/10 hover:text-white" onClick={() => copyToClipboard(utr, "UTR")}>
                        <Copy className="h-3 w-3" />
                    </Button>
                </div>
            )
        }
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
          <Button 
            variant="ghost" 
            className="p-0 hover:bg-transparent justify-start text-left font-semibold" 
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
             Date <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
      ),
      cell: ({ row }) => <div className="text-sm text-muted-foreground">{formatDate(row.getValue("created_at"), 'long')}</div>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
        <Button onClick={handleExport} variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center flex-wrap">
                {/* Beneficiary Search */}
                <div className="w-full sm:w-[200px] relative">
                     <Input 
                         placeholder="Search Beneficiary..." 
                         value={beneficiarySearch}
                         onChange={(e) => setBeneficiarySearch(e.target.value)}
                         className="bg-transparent"
                     />
                </div>

                {/* Account Search */}
                <div className="w-full sm:w-[200px] relative">
                     <Input 
                         placeholder="Search Account No..." 
                         value={accountSearch}
                         onChange={(e) => setAccountSearch(e.target.value)}
                         className="bg-transparent"
                     />
                </div>
                
                 {/* UTR Search */}
                 <div className="w-full sm:w-[200px] relative">
                     <Input 
                         placeholder="Search UTR..." 
                         value={utrSearch}
                         onChange={(e) => setUtrSearch(e.target.value)}
                         className="bg-transparent"
                     />
                </div>

                {/* Type Filter */}
                <div className="w-full sm:w-[150px]">
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Types</SelectItem>
                            <SelectItem value="PAYOUT">Payout</SelectItem>
                            <SelectItem value="REFUND">Refund</SelectItem>
                            <SelectItem value="FEE">Fee</SelectItem>
                            <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Status Filter */}
                <div className="w-full sm:w-[150px]">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Status</SelectItem>
                            <SelectItem value="INITIAL">Initial</SelectItem>
                            <SelectItem value="SUCCESS">Success</SelectItem>
                            <SelectItem value="PROCESSING">Processing</SelectItem>
                            <SelectItem value="FAILED">Failed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                
                {/* Source Filter */}
                <div className="w-full sm:w-[150px]">
                     <Select value={sourceFilter} onValueChange={setSourceFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Source" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Sources</SelectItem>
                            <SelectItem value="SAVED">Saved Beneficiary</SelectItem>
                            <SelectItem value="ONE_TIME">One-Time</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Date Filter */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "w-full sm:w-[240px] justify-start text-left font-normal",
                                !dateFilter && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                             {dateFilter?.from ? (
                                dateFilter.to ? (
                                    <>
                                        {format(dateFilter.from, "LLL dd")} to {format(dateFilter.to, "LLL dd")}
                                    </>
                                ) : (
                                    format(dateFilter.from, "LLL dd")
                                )
                            ) : (
                                <span>Date Range</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        {/* ... calendar content ... */}
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateFilter?.from}
                            selected={dateFilter}
                            onSelect={setDateFilter}
                            numberOfMonths={2}
                        />
                    </PopoverContent>
                </Popover>

                {/* Reset Button */}
                 <Button variant="ghost" onClick={resetFilters} className="px-2 lg:px-3 text-muted-foreground hover:text-foreground">
                    Reset
                 </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center pt-2">
             <div className="text-sm font-medium text-muted-foreground whitespace-nowrap">Amount Range:</div>
             <div className="flex items-center gap-2 w-full sm:w-auto">
                 <Input 
                     type="number" 
                     placeholder="Min" 
                     className="w-full sm:w-[120px]" 
                     value={minAmount}
                     onChange={(e) => setMinAmount(e.target.value)}
                 />
                 <span className="text-muted-foreground">-</span>
                 <Input 
                     type="number" 
                     placeholder="Max" 
                     className="w-full sm:w-[120px]" 
                     value={maxAmount}
                     onChange={(e) => setMaxAmount(e.target.value)}
                 />
             </div>
          </div>
      </div>

      {loading ? <div>Loading...</div> : <DataTable columns={payoutColumns} data={filteredPayouts} />}
    </div>
  );
}
