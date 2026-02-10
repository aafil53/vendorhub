import React, { useState } from 'react';
import { LogOut, FileText, Package, Clock, CheckCircle, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function VendorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const [rfqs, setRfqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submittingFor, setSubmittingFor] = useState<number | null>(null);
  const [price, setPrice] = useState('');
  const [certFile, setCertFile] = useState('');

  const fetchRFQs = async () => {
    setLoading(true);
    try {
      const { data } = await (await import('@/lib/api')).default.get('/rfqs?status=open');
      const myId = user?.id;
      const myRfqs = data.filter((r: any) => r.vendors && r.vendors.includes(myId));
      setRfqs(myRfqs);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  React.useEffect(() => {
    fetchRFQs();
  }, []);

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent/5 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 w-full glass border-b-0 ring-1 ring-white/10 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20 transition-transform hover:scale-110 active:scale-95 duration-500">
            <Package className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-foreground leading-none">Vendor Central</h1>
            <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] mt-1.5">Connected as {user?.name}</p>
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={handleLogout}
          className="h-10 px-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-black text-xs uppercase tracking-widest gap-2"
        >
          <LogOut className="h-4 w-4" />
          Disconnect
        </Button>
      </header>

      <main className="relative z-10 p-8 max-w-7xl mx-auto space-y-10 animate-reveal">
        {/* Portal Stats */}
        <div className="grid gap-6 md:grid-cols-4">
          {[
            { label: 'Open Opportunities', value: rfqs.length, icon: FileText, color: 'text-primary' },
            { label: 'Pending Response', value: '3', icon: Clock, color: 'text-warning' },
            { label: 'Successful Bids', value: '12', icon: CheckCircle, color: 'text-success' },
            { label: 'Pipeline Value', value: '$245K', icon: Package, color: 'text-foreground' }
          ].map((stat, idx) => (
            <Card key={idx} className="glass border-none ring-1 ring-white/10 group hover:-translate-y-1 transition-all duration-500 overflow-hidden">
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/40">{stat.label}</p>
                  <stat.icon className={cn("h-5 w-5 opacity-40 group-hover:opacity-100 transition-opacity", stat.color)} />
                </div>
                <p className="text-3xl font-black tracking-tighter leading-none">{stat.value}</p>
                <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-white/5 blur-2xl rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Opportunity List */}
        <Card className="glass border-none ring-1 ring-white/10 overflow-hidden">
          <CardHeader className="p-8 border-b border-white/5 bg-white/5">
            <CardTitle className="text-xl font-black tracking-tight">Active Opportunities</CardTitle>
            <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/40 mt-1">Live requests from procurement network</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-white/5">
              {rfqs.map((rfq) => (
                <div key={rfq.id} className="group p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:bg-white/5">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-black tracking-tight group-hover:text-primary transition-colors">{rfq.equipmentName}</h3>
                      <Badge variant="outline" className="text-[9px] font-black uppercase tracking-wider bg-white/5 border-none">#{rfq.id}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground/50">
                      <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {rfq.vendors?.length || 0} Vendors Invited</span>
                      <span className="w-1 h-1 rounded-full bg-white/10" />
                      <span>Term: {new Date(rfq.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <Badge
                      variant={rfq.status === 'open' ? 'default' : 'secondary'}
                      className="font-black text-[9px] uppercase tracking-[0.2em] px-3 py-1 border-none shadow-sm"
                    >
                      {rfq.status}
                    </Badge>

                    {submittingFor === rfq.id ? (
                      <div className="flex flex-wrap items-center gap-3 animate-reveal">
                        <div className="relative">
                          <Input
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="Quote Price"
                            className="w-36 h-11 bg-white/5 border-white/10 rounded-xl font-bold focus:ring-primary/20 pl-8"
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 font-bold">$</span>
                        </div>
                        <Input
                          value={certFile}
                          onChange={(e) => setCertFile(e.target.value)}
                          placeholder="Certification Reference URL"
                          className="w-64 h-11 bg-white/5 border-white/10 rounded-xl font-bold focus:ring-primary/20"
                        />
                        <Button
                          size="lg"
                          className="h-11 px-8 rounded-xl font-black text-xs uppercase tracking-widest bg-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                          onClick={async () => {
                            try {
                              const p = parseFloat(price);
                              if (isNaN(p)) return;
                              await (await import('@/lib/api')).default.post('/bids/submit', {
                                rfqId: rfq.id,
                                price: p,
                                certFile,
                                availability: 'Immediate Deployment'
                              });
                              setSubmittingFor(null);
                              setPrice(''); setCertFile('');
                              fetchRFQs();
                            } catch (err) { console.error(err); }
                          }}
                        >
                          Execute Bid
                        </Button>
                        <Button
                          size="lg"
                          variant="ghost"
                          className="h-11 px-6 rounded-xl font-black text-xs uppercase tracking-widest text-muted-foreground hover:bg-white/5"
                          onClick={() => setSubmittingFor(null)}
                        >
                          Abort
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="lg"
                        className="h-11 px-10 rounded-xl font-black text-xs uppercase tracking-[0.15em] bg-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95 group-hover:scale-105"
                        onClick={() => setSubmittingFor(rfq.id)}
                      >
                        Initiate Response
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {rfqs.length === 0 && (
                <div className="p-20 text-center space-y-4">
                  <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-white/5 text-muted-foreground/20">
                    <FileText className="h-10 w-10" />
                  </div>
                  <p className="text-sm font-bold text-muted-foreground/40 uppercase tracking-widest">Scanning Procurement Grid for Opportunities...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

