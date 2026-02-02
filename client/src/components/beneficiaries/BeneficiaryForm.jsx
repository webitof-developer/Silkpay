"use client"

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


const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  mobile: z.string().regex(/^\d{10}$/, {
    message: "Mobile number must be 10 digits.",
  }),
  account_number: z.string().min(8, {
    message: "Account number is too short.",
  }),
  ifsc_code: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, {
    message: "Invalid IFSC code format.",
  }),
  bank_name: z.string().min(2, {
    message: "Bank name is required.",
  }),
  upi_id: z.string().optional(),
})

export function BeneficiaryForm({ initialData, onSubmit, onCancel }) {
  // 1. Define your form.
  const defaultValues = {
    name: initialData?.name || "",
    mobile: initialData?.mobile || "",
    account_number: initialData?.account_number || "",
    ifsc_code: initialData?.ifsc_code || "",
    bank_name: initialData?.bank_name || "",
    upi_id: initialData?.upi_id || "",
  }

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  // 2. Define a submit handler.
  async function handleSubmit(values) {
    try {
      await onSubmit(values)
    } catch (error) {
      console.error("Form submission error", error);
      
      // Handle Field-Specific Validation Errors
      if (error.fields) {
        Object.keys(error.fields).forEach((field) => {
          form.setError(field, {
            type: "server",
            message: error.fields[field],
          });
        });
        toast.error(error.message || "An error occurred");
        // We don't show a toast here if fields are highlighted, 
        // OR we can show a generic "Check form" toast.
      } else {
        // Fallback for non-field specific errors (handled by parent usually, but safe to retain)
        // If the parent throws, it means it didn't handle the UI completely
        toast.error(error.message || "An error occurred");
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Beneficiary Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
             <FormField
              control={form.control}
              name="mobile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile Number</FormLabel>
                  <FormControl>
                    <Input placeholder="9876543210" {...field} />
                  </FormControl>
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
                  <FormControl>
                    <Input placeholder="HDFC0001234" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="account_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Number</FormLabel>
                  <FormControl>
                    <Input placeholder="0000000000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="bank_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank Name</FormLabel>
                  <FormControl>
                    <Input placeholder="HDFC Bank" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
             <FormField
              control={form.control}
              name="upi_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>UPI ID</FormLabel>
                  <FormControl>
                    <Input placeholder="user@upi" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={form.formState.isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving..." : "Save Beneficiary"}
            </Button>
        </div>
      </form>
    </Form>
  )
}
