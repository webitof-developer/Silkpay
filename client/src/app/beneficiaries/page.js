'use client';

import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Plus, MoreHorizontal, Pencil, Trash, ArrowUpDown, Download } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingBeneficiary, setEditingBeneficiary] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [ifscSearch, setIfscSearch] = useState('');
  const [bankFilter, setBankFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchBeneficiaries();
  }, []);

  const fetchBeneficiaries = async () => {
    setLoading(true);
    try {
      const response = await api.get('/beneficiaries');
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
    } catch (error) {
       console.error("Failed to fetch beneficiaries", error);
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
                 account_number: values.account_number,
                 ifsc_code: values.ifsc_code,
                 bank_name: values.bank_name,
                 upi_id: values.upi_id
             }
         };

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
            toast.success("Beneficiary deleted successfully");
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
    if (filteredBeneficiaries.length === 0) {
      toast.error("No beneficiaries to export");
      return;
    }

      exportToCSV(
          filteredBeneficiaries,
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
      setSearch('');
      setIfscSearch('');
      setBankFilter('ALL');
      setStatusFilter('ALL');
  };

  // Apply filters
  const filteredBeneficiaries = beneficiaries.filter(b => {
    const matchSearch = !search || b.name?.toLowerCase().includes(search.toLowerCase());
    const matchIfsc = !ifscSearch || b.ifsc_code?.toLowerCase().includes(ifscSearch.toLowerCase());
    const matchBank = bankFilter === 'ALL' || b.bank_name === bankFilter;
    const matchStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchSearch && matchIfsc && matchBank && matchStatus;
  });

  // Get unique bank names for filter
  const uniqueBanks = ['ALL', ...new Set(beneficiaries.map(b => b.bank_name).filter(Boolean))];

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
                   placeholder="Search by name..." 
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
               />
           </div>
           
           <div className="w-full sm:w-[200px]">
               <Input 
                   placeholder="Search IFSC..." 
                   value={ifscSearch}
                   onChange={(e) => setIfscSearch(e.target.value)}
               />
           </div>

           <div className="w-full sm:w-[200px]">
                <Select value={bankFilter} onValueChange={setBankFilter}>
                    <SelectTrigger>
                        <SelectValue placeholder="All Banks" />
                    </SelectTrigger>
                    <SelectContent>
                        {uniqueBanks.map(bank => (
                            <SelectItem key={bank} value={bank}>{bank === 'ALL' ? 'All Banks' : bank}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
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

      {loading ? <div>Loading...</div> : <DataTable columns={columns} data={filteredBeneficiaries} />}
    </div>
  );
}
