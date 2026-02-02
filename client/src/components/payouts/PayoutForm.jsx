"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { api } from "@/services/api"
import { toast } from "sonner"

// Schema for One-time payout (all fields required)
const oneTimeSchema = z.object({
  beneficiary_name: z.string().min(2, "Name must be at least 2 characters"),
  account_number: z.string().min(8, "Account number must be at least 8 digits"),
  ifsc_code: z.string().min(4, "IFSC code is required"),
  amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Amount must be greater than 0"
  }),
  description: z.string().optional(),
  upi: z.string().optional(),
})

// Schema for Existing Beneficiary (select ID required)
const existingSchema = z.object({
  beneficiary_id: z.string().min(1, { message: "Select a beneficiary" }),
  amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Amount must be greater than 0"
  }),
  notes: z.string().optional(),
})

export function PayoutForm() {
  const [mode, setMode] = useState("onetime")
  const [beneficiaries, setBeneficiaries] = useState([])

  // Fetch real beneficiaries when component mounts
  useEffect(() => {
    const fetchBeneficiaries = async () => {
      try {
        const response = await api.get('/beneficiaries');
        if (response.success && response.data) {
          setBeneficiaries(response.data.beneficiaries || []);
        } else if (Array.isArray(response.data)) {
          setBeneficiaries(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch beneficiaries", error);
        toast.error("Failed to load beneficiaries");
      }
    };
    fetchBeneficiaries();
  }, []);
  
  return (
    <Tabs defaultValue="onetime" onValueChange={setMode} className="w-full max-w-2xl mx-auto">
      <TabsList className="grid w-full grid-cols-2 mb-8">
        <TabsTrigger value="onetime">One-Time Payout</TabsTrigger>
        <TabsTrigger value="existing">Saved Beneficiary</TabsTrigger>
      </TabsList>
      
      <TabsContent value="onetime">
         <OneTimePayoutForm />
      </TabsContent>
      
      <TabsContent value="existing">
          <ExistingPayoutForm beneficiaries={beneficiaries} />
      </TabsContent>
    </Tabs>
  )
}

function OneTimePayoutForm() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [pendingData, setPendingData] = useState(null)

    const form = useForm({
        resolver: zodResolver(oneTimeSchema),
        defaultValues: {
            beneficiary_name: "",
            account_number: "",
            ifsc_code: "",
            amount: "",
            description: "",
            upi: "", 
        }
    })

    const handleFormSubmit = async (data) => {
        setLoading(true)
        try {
            const payload = {
                beneficiary_name: data.beneficiary_name,
                account_number: data.account_number,
                ifsc_code: data.ifsc_code,
                upi: data.upi || '',
                amount: parseFloat(data.amount).toFixed(2),
                source: 'ONE_TIME',
                notes: data.description || '' 
            };
            
            const response = await api.post('/payouts', payload);
            if (response.success || response.data) {
                toast.success("Payout Initiated Successfully");
                router.push('/transactions'); // Redirect to transactions to see status
            } else {
                toast.error("Payout failed. Please try again.");
            }
        } catch (error) {
            console.error("Payout error", error);
            
            // Handle Field-Specific Validation Errors
            if (error.fields) {
                Object.keys(error.fields).forEach((field) => {
                    form.setError(field, {
                        type: "server",
                        message: error.fields[field]
                    });
                });
                toast.error("Please check the form for errors.");
            } else {
                toast.error(error.message || "An error occurred while processing the payout.");
            }
        } finally {
            setLoading(false)
        }
    }

    const handleInitialSubmit = (data) => {
        setPendingData(data)
        setConfirmOpen(true)
    }

    const handleConfirm = () => {
        if (pendingData) {
            handleFormSubmit(pendingData)
        }
        setConfirmOpen(false)
    }

    return (
        <>
        <Card>
            <CardHeader>
                <CardTitle>One-Time Transfer</CardTitle>
                <CardDescription>Enter beneficiary details for a single payout.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleInitialSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="beneficiary_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Beneficiary Name</FormLabel>
                                    <FormControl><Input placeholder="Name" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="account_number"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Account Number</FormLabel>
                                        <FormControl><Input placeholder="Account No" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="ifsc_code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>IFSC Code</FormLabel>
                                        <FormControl><Input placeholder="IFSC" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        
                        <FormField
                            control={form.control}
                            name="upi"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>UPI ID (Optional)</FormLabel>
                                    <FormControl><Input placeholder="username@upi" {...field} /></FormControl>
                                    <FormDescription>Provide UPI ID OR Bank Account details</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Amount (INR)</FormLabel>
                                    <FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Processing..." : "Proceed to Pay"}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>

        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirm One-Time Payout</AlertDialogTitle>
                    <AlertDialogDescription>
                        Please verify the details carefully. This cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                
                {pendingData && (
                    <div className="py-4 space-y-3">
                        <div className="flex justify-between items-center p-2 px-3 bg-muted rounded-sm">
                            <span className="text-sm font-medium">Amount</span>
                            <span className="text-lg font-bold text-primary">₹ {parseFloat(pendingData.amount).toFixed(2)}</span>
                        </div>
                        <div className="space-y-1 text-sm border-l-2 border-primary/20 pl-3">
                            <p><span className="text-muted-foreground">To:</span> <span className="font-medium">{pendingData.beneficiary_name}</span></p>
                            <p><span className="text-muted-foreground">Account:</span> <span className="font-mono">{pendingData.account_number}</span></p>
                            <p><span className="text-muted-foreground">IFSC:</span> <span className="font-mono">{pendingData.ifsc_code}</span></p>
                            {pendingData.upi && <p><span className="text-muted-foreground">UPI:</span> {pendingData.upi}</p>}
                        </div>
                    </div>
                )}

                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirm} disabled={loading}>
                        Confirm Payment
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    )
}

function ExistingPayoutForm({ beneficiaries }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [pendingData, setPendingData] = useState(null)

    const form = useForm({
        resolver: zodResolver(existingSchema),
        defaultValues: {
            beneficiary_id: "",
            amount: "",
            notes: "",
        }
    })

    const handleFormSubmit = async (data) => {
        setLoading(true)
        try {
             const payload = {
                 beneficiary_id: data.beneficiary_id,
                 amount: parseFloat(data.amount).toFixed(2),
                 notes: data.notes || '',
                 source: 'SAVED'
             }

             const response = await api.post('/payouts', payload);

             if (response.success || response.data) {
                 toast.success("Payout Initiated Successfully");
                 router.push('/transactions');
             } else {
                 toast.error("Payout failed. Please try again.");
             }
         } catch (error) {
             console.error("Payout error", error);
             
             // Handle Field Error
             if (error.fields) {
                 Object.keys(error.fields).forEach((field) => {
                     form.setError(field, {
                         type: "server",
                         message: error.fields[field]
                     });
                 });
                 toast.error("Please check the form for errors.");
             } else {
                 toast.error(error.message || "An error occurred while processing the payout.");
             }
         } finally {
             setLoading(false)
         }
    }

    const handleInitialSubmit = (data) => {
        setPendingData(data)
        setConfirmOpen(true)
    }

    const handleConfirm = () => {
        if (pendingData) {
            handleFormSubmit(pendingData)
        }
        setConfirmOpen(false)
    }

    // Helper to get selected beneficiary details for preview/confirm
    const selectedId = form.watch("beneficiary_id")
    const selectedBen = beneficiaries.find(b => b._id === selectedId)

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Select Beneficiary</CardTitle>
                    <CardDescription>Choose a saved beneficiary for quick transfer.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleInitialSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="beneficiary_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Beneficiary</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a beneficiary" />
                                            </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="max-h-[200px]">
                                                {beneficiaries.map(ben => (
                                                    <SelectItem key={ben._id} value={ben._id}>
                                                        {ben.name} - {ben.bank_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Inline Preview */}
                            {selectedBen && (
                                <div className="rounded-md border bg-muted/50 p-3 text-sm space-y-1.5 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Bank Name:</span>
                                        <span className="font-medium">{selectedBen.bank_name || selectedBen.bank_details?.bank_name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Account No:</span>
                                        <span className="font-mono font-medium">
                                            {selectedBen.account_number || selectedBen.bank_details?.account_number || '****'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">IFSC Code:</span>
                                        <span className="font-medium">{selectedBen.ifsc_code || selectedBen.bank_details?.ifsc_code}</span>
                                    </div>
                                    {selectedBen.bank_details?.upi_id && (
                                        <div className="flex justify-between text-pink-400/80">
                                            <span className="text-muted-foreground">UPI ID:</span>
                                            <span className="font-medium">{selectedBen.bank_details.upi_id}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Amount (INR)</FormLabel>
                                        <FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Processing..." : "Proceed to Pay"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Payout</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to send this payout?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    
                    {selectedBen && pendingData && (
                        <div className="py-4 space-y-3">
                            <div className="flex justify-between items-center p-2 px-3 bg-muted rounded-sm">
                                <span className="text-sm font-medium">Amount</span>
                                <span className="text-lg font-bold text-primary">₹ {parseFloat(pendingData.amount).toFixed(2)}</span>
                            </div>
                            <div className="space-y-1 text-sm border-l-2 border-primary/20 pl-3">
                                <p><span className="text-muted-foreground">To:</span> <span className="font-medium">{selectedBen.name}</span></p>
                                <p><span className="text-muted-foreground">Bank:</span> {selectedBen.bank_name || selectedBen.bank_details?.bank_name}</p>
                                <p><span className="text-muted-foreground">Account:</span> <span className="font-mono">{selectedBen.account_number || selectedBen.bank_details?.account_number}</span></p>
                            </div>
                        </div>
                    )}

                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirm} disabled={loading}>
                            Confirm Payment
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
