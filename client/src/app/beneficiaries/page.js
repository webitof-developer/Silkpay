'use client';

import { useEffect, useState, useMemo } from 'react';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Plus, MoreHorizontal, Pencil, Trash, ArrowUpDown, Download, Info } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDate } from '@/utils/formatters';
import { exportToCSV } from '@/utils/exportData';
import { StatusBadge } from "@/components/shared/StatusBadge";
import { BeneficiaryForm } from '@/components/beneficiaries/BeneficiaryForm';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function BeneficiariesPage() {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingBeneficiary, setEditingBeneficiary] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  
  // Filters
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const queryParams = useMemo(() => {
    const params = { page, limit };
    if (search) params.search = search;
    if (statusFilter !== 'ALL') params.status = statusFilter;
    return params;
  }, [page, limit, search, statusFilter]);

  useEffect(() => {
    fetchBeneficiaries();
  }, [queryParams]);

  const fetchBeneficiaries = async () => {
    setLoading(true);
    try {
      const response = await api.get('/beneficiaries', { params: queryParams });
      const rawBeneficiaries = response.data?.beneficiaries || [];
      const mappedBeneficiaries = rawBeneficiaries.map(b => ({
          ...b,
          id: b._id, // Map _id to id
          account_number: b.bank_details?.account_number || '',
          ifsc_code: b.bank_details?.ifsc_code || '',
          bank_name: b.bank_details?.bank_name || '',
          upi_id: b.bank_details?.upi_id || '',
          mobile: b.contact_info?.mobile || '',
          email: b.contact_info?.email || ''
      }));
      setBeneficiaries(mappedBeneficiaries);
      
      if (response.data?.pagination) {
          setPagination(response.data.pagination);
      }
    } catch (error) {
       console.error("Failed to fetch beneficiaries", error);
       toast.error("Failed to fetch beneficiaries");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values) => {
     try {
         const payload = {
             name: values.name,
             contact_info: {
                 mobile: values.mobile || undefined,
                 email: values.email || undefined
             },
             bank_details: {
                 account_number: values.account_number,
                 ifsc_code: values.ifsc_code,
                 bank_name: values.bank_name,
                 upi_id: values.upi_id
             }
         };

         const response = await api.post('/beneficiaries', payload);
         if (response.success) {
             toast.success("Beneficiary created successfully");
             fetchBeneficiaries(); // Refresh list
             setOpen(false);
         } else {
             // If manual check fails (shouldn't happen with standard API wrapper but safely throw)
             throw new Error(response.message || "Failed to create beneficiary");
         }
     } catch (error) {
         // Re-throw to let Form handle field highlighting and toast
         throw error;
     }
  };

  const handleUpdate = async (values) => {
     try {
         const payload = {
             name: values.name,
             contact_info: {
                 mobile: values.mobile || undefined,
                 email: values.email || undefined
             },
             bank_details: {
                 ifsc_code: values.ifsc_code,
                 bank_name: values.bank_name,
                 upi_id: values.upi_id
             }
         };

         // Only update account number if it's not masked
         if (values.account_number && !values.account_number.includes('XXXX')) {
             payload.bank_details.account_number = values.account_number;
         }

        const response = await api.put(`/beneficiaries/${editingBeneficiary.id}`, payload);
         if (response.success) {
             toast.success("Beneficiary updated successfully");
             fetchBeneficiaries(); // Refresh list
             setEditingBeneficiary(null);
             setOpen(false);
         } else {
             throw new Error(response.message || "Failed to update beneficiary");
         }
     } catch (error) {
         throw error;
     }
  };

  const confirmDelete = (id) => {
      setDeleteId(id);
  };

  const handleDelete = async () => {
     if (!deleteId) return;
     try {
        const response = await api.delete(`/beneficiaries/${deleteId}`);
        if (response.success) {
            toast.success("Beneficiary deactivated. Inactive beneficiaries cannot be used for payouts.");
            fetchBeneficiaries();
        } else {
            toast.error(response.message || "Failed to delete beneficiary");
        }
     } catch (error) {
        console.error("Delete error:", error);
        toast.error("An error occurred while deleting");
     } finally {
        setDeleteId(null);
     }
  };
  
  const openEdit = (beneficiary) => {
      setEditingBeneficiary(beneficiary);
      setOpen(true);
  }

  const handleExport = () => {
    // Check if there are any beneficiaries to export
    if (beneficiaries.length === 0) {
      toast.error("No beneficiaries to export");
      return;
    }

      exportToCSV(
          beneficiaries,
          [
              { key: 'name', label: 'Name' },
              { key: 'account_number', label: 'Account Number' },
              { key: 'bank_name', label: 'Bank Name' },
              { key: 'ifsc_code', label: 'IFSC Code' },
              { key: 'status', label: 'Status' },
              { key: 'created_at', label: 'Date Added', format: (d) => formatDate(d, 'full') }
          ],
          'beneficiaries_export'
      );
      toast.success("Beneficiaries exported successfully");
  };

  const resetFilters = () => {
      setPage(1);
      setSearch('');
      setStatusFilter('ALL');
  };

  const columns = [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent"
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "bank_name",
      header: "Bank",
    },
    {
      accessorKey: "account_number",
      header: "Account",
      cell: ({ row }) => <div className="font-mono text-xs text-muted-foreground">{row.getValue("account_number")}</div>,
    },
    {
      accessorKey: "ifsc_code",
      header: "IFSC",
       cell: ({ row }) => <div className="font-mono text-xs text-muted-foreground">{row.getValue("ifsc_code")}</div>,
    },
    {
       accessorKey: "status",
       header: "Status",
        cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const beneficiary = row.original
 
        if (beneficiary.status === 'INACTIVE') {
            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 cursor-default hover:bg-transparent">
                                <Info className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left" align="center" className="max-w-[200px] text-center">
                            <p>
                                {beneficiary.deactivatedAt 
                                    ? `Deactivated on ${formatDate(beneficiary.deactivatedAt)}. Inactive beneficiaries cannot be used for payouts.` 
                                    : "This beneficiary has been deactivated and cannot be used for payouts."}
                            </p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )
        }

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => openEdit(beneficiary)}>
                 <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => confirmDelete(beneficiary.id)} className="text-red-600">
                <Trash className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Beneficiaries</h2>
        <div className="flex gap-4">
             <Button onClick={handleExport} variant="outline" className="gap-2">
                <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Button onClick={() => { setEditingBeneficiary(null); setOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" /> Add Beneficiary
            </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center flex-wrap">
           <div className="w-full sm:w-[250px]">
               <Input 
                   placeholder="Search by name, mobile..." 
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
               />
           </div>
           
           <div className="w-full sm:w-[150px]">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                         <SelectItem value="ALL">All Status</SelectItem>
                         <SelectItem value="ACTIVE">Active</SelectItem>
                         <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                </Select>
           </div>

           <Button variant="ghost" onClick={resetFilters}>Reset</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingBeneficiary ? 'Edit Beneficiary' : 'Add Beneficiary'}</DialogTitle>
            <DialogDescription>
              {editingBeneficiary 
                ? 'Update beneficiary details below.' 
                : 'Enter the details of the new beneficiary.'}
            </DialogDescription>
          </DialogHeader>
          <BeneficiaryForm 
            initialData={editingBeneficiary} // Pass initialData prop (check BeneficiaryForm prop name, previously used initialData in similar components)
            onSubmit={editingBeneficiary ? handleUpdate : handleCreate}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the beneficiary
              and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {loading ? <div>Loading...</div> : <DataTable columns={columns} data={beneficiaries} manualPagination={true} />}

      {/* Pagination Controls */}
      <div className="flex justify-end gap-2 mt-4">
        <Button
          variant="outline"
          disabled={pagination.page <= 1}
          onClick={() => setPage(p => p - 1)}
        >
          Prev
        </Button>
        <span className="flex items-center text-sm text-muted-foreground px-2">
            Page {pagination.page} of {pagination.pages}
        </span>
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
