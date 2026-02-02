'use client';

import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { StatCard } from '@/components/dashboard/StatCard';
import { Wallet, ArrowUpRight, Activity, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReportDialog } from '@/components/dashboard/ReportDialog';

export default function DashboardPage() {
  const [balance, setBalance] = useState({ available: 0, pending: 0, total: 0 });
  const [todayStats, setTodayStats] = useState({ amount: 0, count: 0 });
  const [pendingCount, setPendingCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReportDialog, setShowReportDialog] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboardRes, activityRes] = await Promise.all([
          api.get('/dashboard/overview'),
          api.get('/dashboard/recent-activity?limit=5')
        ]);
        
        // Backend returns: { success: true, data: { balance, today_payouts, ... } }
        if (dashboardRes.success && dashboardRes.data) {
           console.log("Dashboard Data Received:", dashboardRes.data); // DEBUG LOG
           setBalance(dashboardRes.data.balance);
           // We can store other stats if needed, or just specific ones
           setTodayStats(dashboardRes.data.today_payouts || { amount: 0, count: 0 });
           setPendingCount(dashboardRes.data.pending_payouts || 0);
        }

        if (activityRes.success) {
            const activities = activityRes.data.map(item => ({
                ...item,
                label: item.type, // 'PAYOUT', 'REFUND' etc
                beneficiary_name: item.description, // Description contains "Payout to Name" usually
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
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
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
