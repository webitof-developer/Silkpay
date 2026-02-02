import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, AlertCircle, Clock, XCircle } from "lucide-react"
import { formatCurrency, formatDate } from "@/utils/formatters"
import { cn } from "@/lib/utils"

export function ReceiptDialog({ open, onOpenChange, transaction }) {
  if (!transaction) return null

  const getStatusColor = (status) => {
    switch (status) {
      case 'SUCCESS': return 'text-green-600 bg-green-500/10 border-green-500/20'
      case 'PENDING': 
      case 'PROCESSING': return 'text-yellow-600 bg-yellow-500/10 border-yellow-500/20'
      case 'FAILED': return 'text-red-600 bg-red-500/10 border-red-500/20'
      default: return 'text-gray-600 bg-gray-500/10 border-gray-500/20'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'SUCCESS': return <CheckCircle2 className="w-12 h-12 text-primary-foreground mb-2" />
      case 'PENDING': 
      case 'PROCESSING': return <Clock className="w-12 h-12 text-primary-foreground mb-2" />
      case 'FAILED': return <XCircle className="w-12 h-12 text-primary-foreground mb-2" />
      default: return <AlertCircle className="w-12 h-12 text-primary-foreground mb-2" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none shadow-2xl bg-card text-card-foreground ring-1 ring-border/50">
        <DialogHeader className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/40 to-purple-500/40 text-primary-foreground p-8 flex flex-col items-center justify-center space-y-1">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-soft-light"></div>
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-black/10 rounded-full blur-2xl"></div>

            <div className="relative bg-white/20 p-2 pb-0 rounded-full backdrop-blur-md shadow-inner ring-1 ring-white/30">
                 {getStatusIcon(transaction.status)}
            </div>
            
            <div className="relative text-center space-y-1">
                <DialogTitle className="text-2xl font-bold text-primary-foreground tracking-tight">Payment Receipt</DialogTitle>
                <DialogDescription className="text-primary-foreground/90 font-medium">
                    Transaction ID <span className="font-mono bg-black/10 px-2 py-0.5 rounded text-xs select-all">{transaction.mOrderId || transaction.id}</span>
                </DialogDescription>
            </div>
            
            <div className="relative flex justify-between w-full text-xs text-primary-foreground/90 mt-6 pt-6 border-t border-white/20 px-1">
                <div>
                     <span className="opacity-75 block text-[10px] uppercase tracking-wider mb-0.5">Date</span>
                     <div className="font-semibold text-sm">{formatDate(transaction.created_at)}</div>
                </div>
                <div className="text-right">
                     <span className="opacity-75 block text-[10px] uppercase tracking-wider mb-0.5">UTR Reference</span>
                     <div className="font-mono font-semibold text-sm">{transaction.utr || 'Pending'}</div>
                </div>
            </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-foreground/80 uppercase tracking-wider text-[11px]">Transaction Details</div>
                <Badge variant="outline" className={cn("px-3 py-1 text-xs font-semibold capitalize", getStatusColor(transaction.status))}>
                         {transaction.status.toLowerCase()}
                </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-y-5 gap-x-4 text-sm bg-muted/40 p-4 rounded-xl border border-border/50">
                <div className="space-y-1">
                    <div className="text-[11px] text-muted-foreground uppercase tracking-wide">IFSC Code</div>
                    <div className="font-medium text-foreground tracking-tight">{transaction.ifsc_code || 'N/A'}</div>
                </div>
                <div className="text-right space-y-1">
                    <div className="text-[11px] text-muted-foreground uppercase tracking-wide">Account Number</div>
                    <div className="font-mono font-medium text-foreground tracking-tight">{transaction.account_number}</div>
                </div>
                
                <div className="space-y-1">
                    <div className="text-[11px] text-muted-foreground uppercase tracking-wide">Beneficiary</div>
                    <div className="font-medium text-foreground uppercase tracking-tight truncate">{transaction.beneficiary_name}</div>
                </div>
                <div className="text-right space-y-1">
                    <div className="text-[11px] text-muted-foreground uppercase tracking-wide">Amount</div>
                    <div className="text-xl font-bold text-foreground tracking-tighter text-primary">
                        {formatCurrency(transaction.amount)}
                    </div>
                </div>
            </div>

            <Separator className="bg-border/60" />

            <div className="flex flex-col items-center gap-4">
                <div className="text-center">
                    <p className="text-[10px] text-muted-foreground leading-relaxed max-w-[280px] mx-auto">
                        This receipt is electronically generated and valid without a signature. 
                        <br/>For support, please contact help@silkpay.com
                    </p>
                </div>

                <Button className="w-full bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 text-primary-foreground shadow-lg shadow-primary/20 h-10 rounded-lg font-medium transition-all" onClick={() => onOpenChange(false)}>
                    Close Receipt
                </Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
