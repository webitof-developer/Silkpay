'use client';

import { useState, useEffect } from 'react';
import { getMerchantProfile, getApiKeys } from '@/services/merchantService';
import { getSystemIp } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Copy, RefreshCw, Plus, Trash2, CheckCircle2, Server, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

import { RoleGuard } from '@/components/guards/RoleGuard';

export default function MerchantPage() {
  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      <MerchantPageContent />
    </RoleGuard>
  );
}

function MerchantPageContent() {
  const [profile, setProfile] = useState(null);
  const [apiKeys, setApiKeys] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // console.log("Fetching merchant data...");
        const [profileRes, apiRes] = await Promise.all([
          getMerchantProfile(),
          getApiKeys()
        ]);
        
        // console.log("Profile Res:", profileRes);
        // console.log("API Keys Res:", apiRes);

        // Services return data directly
        if (profileRes) {
             setProfile(profileRes);
        }

        if (apiRes) {
            setApiKeys(apiRes);
        }
        
      } catch (error) {
        console.error("Failed to load merchant data", error);
        toast.error("Failed to load merchant profile");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
        <div className="space-y-6">
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            <div className="grid gap-6 md:grid-cols-2">
                <div className="h-64 bg-muted animate-pulse rounded-lg" />
                <div className="h-64 bg-muted animate-pulse rounded-lg" />
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Merchant Center</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Information */}
        {profile ? (
            <ProfileInfoCard profile={profile} mID={profile.silkpay_config.merchant_id} />
        ) : (
            <Card className="border-red-500/20">
                <CardHeader>
                    <CardTitle className="text-red-500">Profile Not Loaded</CardTitle>
                    <CardDescription>Could not retrieve profile info.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
                </CardContent>
            </Card>
        )}

        {/* API Security */}
        <APISecurityCard initialKeys={apiKeys} secretKey={profile.silkpay_config.secret_key}/>
      </div>
    </div>
  );
}

function ProfileInfoCard({ profile, mID }) {
  if (!profile) return null;
  
  const copyMerchantNo = () => {
      navigator.clipboard.writeText(mID);
      toast.success("Merchant ID copied");
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Merchant Profile</CardTitle>
        <CardDescription>Your business details and integration ID.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label>Merchant No. (ID)</Label>
          <div className="flex items-center gap-2">
             <Input value={mID} readOnly className="font-mono bg-secondary/50" />
             <Button variant="outline" size="icon" onClick={copyMerchantNo}>
                 <Copy className="h-4 w-4" />
             </Button>
          </div>
          <div className="flex mt-1">
             <Badge variant="outline" className={
                 profile.status === 'ACTIVE' ? "text-green-500 border-green-500 bg-green-500/10" : "text-yellow-500"
             }>
                 {profile.status}
             </Badge>
          </div>
        </div>
        
        <div className="grid gap-2">
          <Label>Business Name</Label>
          <Input value={profile.name} readOnly className="bg-muted" />
        </div>
        
        <div className="grid gap-2">
          <Label>Registered Email</Label>
          <Input value={profile.email} readOnly className="bg-muted" />
        </div>

        <div className="text-xs text-muted-foreground mt-4">
            To update these details, please contact support.
        </div>
      </CardContent>
    </Card>
  );
}

function APISecurityCard({ initialKeys, secretKey }) {
    const [keys, setKeys] = useState(initialKeys || { secret_key: '', whitelist_ips: [] });
    const [showKey, setShowKey] = useState(false);
    const [regenerating, setRegenerating] = useState(false);
    const [newIp, setNewIp] = useState('');
    const [updatingIp, setUpdatingIp] = useState(false);
    const [serverIp, setServerIp] = useState(null);

    // ... inside component ...
    useEffect(() => {
        const fetchIp = async () => {
            try {
                const data = await getSystemIp();
                if (data?.ip) setServerIp(data.ip);
            } catch (err) {
                console.error("Failed to fetch server IP", err);
            }
        };
        fetchIp();
    }, []);
    
    // Mask the secret key for display only
    const maskSecretKey = (key) => {
        if (!key) return '';
        if (key.length <= 8) return key.substring(0, 3) + '•'.repeat(key.length - 3);
        if (key.length < 12) return key.substring(0, 4) + '•'.repeat(key.length - 6) + key.slice(-2);
        return key.substring(0, 8) + '•'.repeat(key.length - 12) + key.slice(-4);
    };
    
    const copyToClipboard = () => {
        navigator.clipboard.writeText(secretKey); // Copy real key
        toast.success("Secret Key copied to clipboard");
    };

    const handleRotateKey = async () => {
        if (!confirm("⚠️ CAUTION: Rotating your Secret Key will immediately invalidate the old one. Your API integrations will stop working until you update them. Are you sure?")) return;
        
        setRegenerating(true);
        try {
            // Corrected endpoint
            const res = await api.post('/merchant/api-keys/rotate', {});
            if (res.success) {
                setKeys(prev => ({ ...prev, secret_key: res.data.secret_key }));
                setShowKey(true);
                toast.success("New Secret Key generated");
            }
        } catch (err) {
            toast.error("Failed to rotate key");
        } finally {
            setRegenerating(false);
        }
    };

    const handleAddIp = async () => {
        if (!newIp) return;
        
        // Simple IP validation
        const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
        if (!ipRegex.test(newIp)) {
            toast.error("Invalid IP address format");
            return;
        }

        if (keys.whitelist_ips?.includes(newIp)) {
            toast.error("IP already whitelisted");
            return;
        }

        const updatedIps = [...(keys.whitelist_ips || []), newIp];
        await updateWhitelist(updatedIps);
        setNewIp('');
    };

    const handleRemoveIp = async (ipToRemove) => {
        if (!confirm(`Remove ${ipToRemove} from whitelist?`)) return;
        const updatedIps = keys.whitelist_ips.filter(ip => ip !== ipToRemove);
        await updateWhitelist(updatedIps);
    };

    const updateWhitelist = async (ips) => {
        setUpdatingIp(true);
        try {
            // Corrected endpoint: PUT /merchant/whitelist-ips
            const res = await api.put('/merchant/whitelist-ips', { ips });
            console.log(res);
            if (res.success) {
                setKeys(prev => ({ ...prev, whitelist_ips: res.data.whitelist_ips }));
                toast.success("IP Whitelist updated");
            }
        } catch (err) {
            toast.error("Failed to update whitelist");
        } finally {
            setUpdatingIp(false);
        }
    };

    return (
        <Card className="border-orange-500/20 h-fit">
            <CardHeader>
                <CardTitle>API Security</CardTitle>
                <CardDescription>Manage your API credentials and IP whitelist.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                
                {/* Secret Key Section */}
                <div className="space-y-3">
                    <Label className="text-orange-500">Secret Key (Payout API)</Label>
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Input 
                                type={showKey ? "text" : "password"} 
                                value={showKey ? secretKey : maskSecretKey(secretKey)} 
                                readOnly 
                                className="pr-10 font-mono bg-secondary/50" 
                            />
                        </div>
                        <Button variant="outline" size="icon" onClick={() => setShowKey(!showKey)}>
                            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button variant="outline" size="icon" onClick={copyToClipboard}>
                            <Copy className="h-4 w-4" />
                        </Button>
                        
                    </div>
                </div>

            </CardContent>
            
             {/* Server IP Info Footer */}
             <div className="bg-muted/30 p-4 border-t">
                <div className="flex items-start gap-3">
                    <Server className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-medium">Server IP Address</h4>
                        <p className="text-xs text-muted-foreground mb-2">
                           This is your server's public IP. You must whitelist this IP in your Silkpay Dashboard to allow payouts.
                        </p>
                        {serverIp ? (
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-background font-mono text-sm px-2 py-1">
                                    {serverIp}
                                </Badge>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                                    navigator.clipboard.writeText(serverIp);
                                    toast.success("Server IP copied");
                                }}>
                                    <Copy className="h-3 w-3" />
                                </Button>
                            </div>
                        ) : (
                            <span className="text-xs text-muted-foreground italic">Fetching IP...</span>
                        )}
                    </div>
                </div>
             </div>
        </Card>
    );
}
