'use client';

import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Plus, ArrowUpDown, CalendarIcon, Download ,FileText, RotateCw } from 'lucide-react';
import Link from 'next/link';
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCurrency, formatDate } from '@/utils/formatters';
import { exportToCSV } from '@/utils/exportData';
import { StatusBadge } from "@/components/shared/StatusBadge";

import { ReceiptDialog } from '@/components/payouts/ReceiptDialog';

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [accountSearch, setAccountSearch] = useState('');
  const [beneficiarySearch, setBeneficiarySearch] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [dateFilter, setDateFilter] = useState();

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/payouts');
      // Backend returns: { success: true, data: { payouts, total } }
      if (response.success && response.data) {
          const rawPayouts = response.data.payouts || [];
          const formattedPayouts = rawPayouts.map(p => ({
              ...p,
              id: p._id,
              mOrderId: p.out_trade_no,
              beneficiary_name: p.beneficiary_details?.name || 'Unknown',
              account_number: p.beneficiary_details?.account_number || '',
              ifsc_code: p.beneficiary_details?.ifsc_code || '',
              bank_name: 'Unknown',
              // Source: Check beneficiary type if populated, or fallback to SAVED
              // If creating creating ONE_TIME payout, backend should ideally tag it.
              // We rely on beneficiary_details mainly or associated beneficiary.
              // Since we don't have the beneficiary object populated, we check if name matches or rely on context
              // Ideally Backend should return 'source' or populated beneficiary.
              source: (p.beneficiary_id?.type === 'ONE_TIME') ? 'ONE_TIME' : 'SAVED',

              // UTR: Only show if real. Silkpay often sends check_status response with 'data.utr'
              utr: p.silkpay_response?.data?.utr || p.silkpay_response?.utr || '-',
              
              status: p.status, // Uses model status directly
              amount: p.amount?.$numberDecimal ? parseFloat(p.amount.$numberDecimal) : (parseFloat(p.amount) || 0),
              created_at: p.createdAt
          }));
          setPayouts(formattedPayouts);
      } else if (Array.isArray(response.data)) {
         // Fallback for array response
         const formattedPayouts = response.data.map(p => ({
              ...p,
              id: p._id,
              mOrderId: p.out_trade_no,
              beneficiary_name: p.beneficiary_details?.name || 'Unknown',
              account_number: p.beneficiary_details?.account_number || '',
              ifsc_code: p.beneficiary_details?.ifsc_code || '',
              // Fallback source logic same as above
              source: (p.beneficiary_id?.type === 'ONE_TIME') ? 'ONE_TIME' : 'SAVED',
              utr: p.silkpay_response?.data?.utr || p.silkpay_response?.utr || '-',
              status: p.status,
              amount: p.amount?.$numberDecimal ? parseFloat(p.amount.$numberDecimal) : (parseFloat(p.amount) || 0),
              created_at: p.createdAt
          }));
        setPayouts(formattedPayouts);
      }
    } catch (error) {
       console.error("Failed to fetch payouts", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayouts = payouts.filter(item => {
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchesSource = sourceFilter === 'ALL' || item.source === sourceFilter;
    const matchesAccount = item.account_number?.toLowerCase().includes(accountSearch.toLowerCase());
    const matchesBeneficiary = item.beneficiary_name?.toLowerCase().includes(beneficiarySearch.toLowerCase());
    
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

    return matchesStatus && matchesSource && matchesAccount && matchesBeneficiary && matchesAmount && matchesDate;
  });

  const resetFilters = () => {
      setStatusFilter('ALL');
      setSourceFilter('ALL');
      setAccountSearch('');
      setBeneficiarySearch('');
      setMinAmount('');
      setMaxAmount('');
      setDateFilter(undefined);
  };

  const handleExport = () => {
      if (filteredPayouts.length === 0) {
          toast.error("No payouts to export");
          return;
      }
      
      exportToCSV(
          filteredPayouts,
          [
              { key: 'id', label: 'ID' },
              { key: 'mOrderId', label: 'Order ID' },
              { key: 'beneficiary_name', label: 'Beneficiary' },
              { key: 'account_number', label: 'Account Number' },
              { key: 'ifsc_code', label: 'IFSC Code' },
              { key: 'bank_name', label: 'Bank' }, 
              { key: 'amount', label: 'Amount (₹)', format: formatCurrency },
              { key: 'status', label: 'Status' },
              { key: 'utr', label: 'UTR' },
              { key: 'created_at', label: 'Date', format: (d) => formatDate(d, 'full') }
          ],
          'payouts_export'
      );
      toast.success('Payouts exported successfully');
  };

  const handleSyncStatus = async (id) => {
    const toastId = toast.loading("Checking status...");
    try {
        const response = await api.get(`/payouts/${id}/status`);
        if (response.success) {
            toast.success("Status synced successfully", { id: toastId });
            fetchPayouts(); // Refresh list to see new status/UTR
        } else {
            toast.error(response.message || "Failed to sync status", { id: toastId });
        }
    } catch (error) {
        console.error("Sync error:", error);
        toast.error(error.message || "Sync failed", { id: toastId });
    }
  };

  // Helpers removed - using shared utils

  const columns = [
      {
         accessorKey: "mOrderId",
         header: "Order ID",
         cell: ({ row }) => <div className="font-mono text-xs">{row.getValue("mOrderId")}</div>,
      },
      {
         accessorKey: "beneficiary_name",
         header: ({ column }) => (
            <Button variant="ghost" className="p-0 hover:bg-transparent" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
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
            <Button variant="ghost" className="p-0 hover:bg-transparent" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
               Amount <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => <div className="font-medium">{formatCurrency(row.getValue("amount"))}</div>,
      },

      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status"); 
            return <StatusBadge status={status} />;
        },
      },
      {
        accessorKey: "created_at",
        header: ({ column }) => (
            <Button variant="ghost" className="p-0 hover:bg-transparent" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
               Date <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => <div className="text-sm text-muted-foreground">{formatDate(row.getValue("created_at"), 'long')}</div>,
      },
      {
        id: "actions",
        header: "Operate",
        cell: ({ row }) => {
            const isSuccess = row.getValue("status") === 'SUCCESS';
            
            if (isSuccess) {
                return (
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                            setSelectedTransaction(row.original);
                            setReceiptOpen(true);
                        }}
                        className="text-primary hover:text-primary/80 hover:bg-primary/10 h-8 px-2"
                    >
                        <FileText className="w-3.5 h-3.5 mr-1" /> Receipt
                    </Button>
                )
            }

            // For Failed/Processing, show Details
            const isFailed = row.getValue("status") === 'FAILED' || row.getValue("status") === 'REVERSED';
            
            if (isFailed) {
                 return (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 h-8 px-2"
                                >
                                    <span className="text-xs">Failed</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Message: {row.original.failure_reason || 'Unknown error'}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )
            }


            
            const isProcessing = row.getValue("status") === 'PROCESSING' || row.getValue("status") === 'PENDING';
            if (isProcessing) {
                return (
                     <div className="flex gap-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => handleSyncStatus(row.original.id)}
                                        className="text-primary hover:text-pink-500/80 hover:bg-pink-500/30 h-8 px-2"
                                    >
                                        <RotateCw className="w-3.5 h-3.5 mr-1" /> Sync
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Check status with Bank</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                     </div>
                )
            }

            return <div className="w-8 h-8"></div>; // Placeholder
        }
      }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Payouts</h2>
        <div className="flex gap-4">
             <Button onClick={handleExport} variant="outline" className="gap-2">
                <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Link href="/payouts/new">
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Create Payout
                </Button>
            </Link>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center flex-wrap">
              {/* Beneficiary Search */}
              <div className="w-full sm:w-[250px] relative">
                   <Input 
                       placeholder="Search Beneficiary..." 
                       value={beneficiarySearch}
                       onChange={(e) => setBeneficiarySearch(e.target.value)}
                       className="bg-transparent"
                   />
              </div>

              {/* Account Search */}
              <div className="w-full sm:w-[250px] relative">
                   <Input 
                       placeholder="Search Account No..." 
                       value={accountSearch}
                       onChange={(e) => setAccountSearch(e.target.value)}
                       className="bg-transparent"
                   />
              </div>

              {/* Status Filter */}
                <div className="w-full sm:w-[150px]">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Status</SelectItem>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="PROCESSING">Processing</SelectItem>
                            <SelectItem value="SUCCESS">Success</SelectItem>
                            <SelectItem value="FAILED">Failed</SelectItem>
                            <SelectItem value="REVERSED">Reversed</SelectItem>
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
                        {/* ... Calendar Content ... */}
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
             <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Amount Range:</span>
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
      
      {loading ? <div>Loading...</div> : <DataTable columns={columns} data={filteredPayouts} />}
      
      <ReceiptDialog 
        open={receiptOpen} 
        onOpenChange={setReceiptOpen} 
        transaction={selectedTransaction} 
      />
    </div>
  );
}
