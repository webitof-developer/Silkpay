'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAdmin } from '@/services/authService';
import { getDashboardOverview, getRecentActivity, syncBalance } from '@/services/dashboardService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { StatCard } from '@/components/dashboard/StatCard';
import { Wallet, ArrowUpRight, Activity, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReportDialog } from '@/components/dashboard/ReportDialog';
import { toast } from 'sonner';

export default function DashboardPage() {
  const router = useRouter();
  const [balance, setBalance] = useState({ available: 0, pending: 0, total: 0 });
  const [todayStats, setTodayStats] = useState({ amount: 0, count: 0 });
  const [pendingCount, setPendingCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);

  // Redirect non-admin users to payouts
  useEffect(() => {
    if (!isAdmin()) {
      router.replace('/payouts');
    }
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboardRes, activityRes] = await Promise.all([
          getDashboardOverview(),
          getRecentActivity(5)
        ]);
        
        // Services return response.data directly
        if (dashboardRes) {
           console.log("Dashboard Data Received:", dashboardRes);
           setBalance(dashboardRes.balance);
           setTodayStats(dashboardRes.today_payouts || { amount: 0, count: 0 });
           setPendingCount(dashboardRes.pending_payouts || 0);
        }

        // Services return data directly
        if (activityRes) {
            const activities = activityRes.map(item => ({
                ...item,
                label: item.type,
                beneficiary_name: item.description,
                amount: item.amount,
                date: item.createdAt
            }));
            setRecentActivity(activities);
        }

      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Auto-refresh every 5 minutes
    const intervalId = setInterval(fetchData, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  const handleSyncBalance = async () => {
    setSyncing(true);
    const toastId = toast.loading("Syncing balance from Silkpay...");
    try {
      const result = await syncBalance();
      toast.success("Balance synced successfully!", { id: toastId });
      
      // Refresh dashboard data after sync
      const [dashboardRes] = await Promise.all([
        getDashboardOverview()
      ]);
      
      if (dashboardRes) {
        setBalance(dashboardRes.balance);
        setTodayStats(dashboardRes.today_payouts || { amount: 0, count: 0 });
        setPendingCount(dashboardRes.pending_payouts || 0);
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error(error.message || "Failed to sync balance", { id: toastId });
    } finally {
      setSyncing(false);
    }
  };



  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncBalance}
            disabled={syncing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Balance'}
          </Button>
          <Link href="/payouts/new">
            <Button>Create Payout</Button>
          </Link>
          <Button variant="outline" onClick={() => setShowReportDialog(true)}>Download Reports</Button>
        </div>
      </div>
      
      <ReportDialog open={showReportDialog} onOpenChange={setShowReportDialog} />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Available Balance"
          value={loading ? "..." : formatCurrency(balance.available)}
          icon={Wallet}
          description="Funds available for payout"
          className="border-l-4 border-l-primary"
        />
        <StatCard
          title="Pending Amount"
          value={loading ? "..." : formatCurrency(balance.pending)}
          icon={Activity}
          description={`${pendingCount} Transactions in process`}
          className="border-l-4 border-l-orange-500"
        />
        <StatCard
          title="Total Balance"
          value={loading ? "..." : formatCurrency(balance.total)}
          icon={Wallet}
          description="Available + Pending"
           className="border-l-4 border-l-green-500"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 space-y-4">
          <h3 className="text-lg font-medium">Today's Overview</h3>
           <div className="grid gap-4 sm:grid-cols-1">
              <StatCard
                title="Today's Payouts"
                value={loading ? "..." : formatCurrency(todayStats.amount)}
                icon={ArrowUpRight}
                description={`Count: ${todayStats.count}`}
              />
           </div>
        </div>
        
        <div className="col-span-4 md:col-span-3 space-y-4">
             <h3 className="text-lg font-medium">Recent Activity</h3>
             <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                        <Clock className="mr-2 h-4 w-4" /> Latest Transactions
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                    {loading ? (
                        <div className="text-sm text-muted-foreground">Loading activity...</div>
                    ) : recentActivity.length > 0 ? (
                        recentActivity.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between border-b last:border-0 pb-2 last:pb-0">
                                <div className="space-y-0.5">
                                    <p className="text-sm font-medium leading-none">
                                        {item.description}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="text-[10px] px-1 py-0 h-5">
                                            {item.type}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">{formatDate(item.date, 'long')}</span>
                                    </div>
                                </div>
                                <div className={`text-sm font-bold ${item.type === 'REFUND' || item.type === 'ADJUSTMENT' ? 'text-green-600' : 'text-red-600'}`}>
                                    {item.type === 'REFUND' || item.type === 'ADJUSTMENT' ? '+' : '-'}{formatCurrency(item.amount)}
                                </div>
                            </div>
                        ))
                    ) : (
                         <div className="text-sm text-muted-foreground">No recent activity.</div>
                    )}
                </CardContent>
             </Card>
        </div>
      </div>
    </div>
  );
}
