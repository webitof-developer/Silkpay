import { toast } from 'sonner';

// Status mapping (our backend returns strings after API call)
export const getStatusBadgeColor = (status) => {
  const colors = {
    'INITIAL': 'bg-blue-500/15 text-blue-500 hover:bg-blue-500/25 border-blue-500/20',
    'PROCESSING': 'bg-orange-500/15 text-orange-500 hover:bg-orange-500/25 border-orange-500/20',
    'SUCCESS': 'bg-green-500/15 text-green-500 hover:bg-green-500/25 border-green-500/20',
    'ACTIVE': 'bg-green-500/15 text-green-500 hover:bg-green-500/25 border-green-500/20',
    'FAILED': 'bg-red-500/15 text-red-500 hover:bg-red-500/25 border-red-500/20',
    'INACTIVE': 'bg-gray-500/15 text-gray-500 hover:bg-gray-500/25 border-gray-500/20',
    'REJECTED': 'bg-red-500/15 text-red-500 hover:bg-red-500/25 border-red-500/20'
  };
  return colors[status] || 'bg-gray-500/15 text-gray-500 hover:bg-gray-500/25 border-gray-500/20';
};

// Format timestamp for display
export const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'N/A';
  // Handle both ISO strings and MS timestamps
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Invalid Date';
  return date.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Format amount
export const formatAmount = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(parseFloat(amount));
};

// Mask account number for display
export const maskAccountNumber = (accountNo) => {
  if (!accountNo || accountNo.length < 4) return accountNo;
  return 'XXXX' + accountNo.slice(-4);
};

export const copyToClipboard = (text, label = "Item") => {
  if (!text) return;
  navigator.clipboard.writeText(text);
  toast.success(`${label} copied to clipboard`);
};
