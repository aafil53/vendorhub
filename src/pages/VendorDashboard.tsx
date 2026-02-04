import React, { useState } from 'react';
import { LogOut, FileText, Package, Clock, CheckCircle } from 'lucide-react';
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
      // filter for rfqs that include this vendor
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500">
            <Package className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Vendor Portal</h1>
            <p className="text-xs text-muted-foreground">Welcome, {user?.name}</p>
          </div>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </header>

      <main className="p-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open RFQs</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rfqs.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Bids</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Won Bids</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$245K</div>
            </CardContent>
          </Card>
        </div>

        {/* RFQ List */}
        <Card>
          <CardHeader>
            <CardTitle>Incoming RFQs</CardTitle>
            <div />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {rfqs.map((rfq) => (
                <div key={rfq.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{rfq.equipmentName}</h3>
                    <p className="text-sm text-muted-foreground">Vendors: {rfq.vendors?.length || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">Created: {new Date(rfq.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={rfq.status === 'open' ? 'default' : 'secondary'}>
                      {rfq.status}
                    </Badge>
                    {submittingFor === rfq.id ? (
                      <div className="flex items-center gap-2">
                        <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price" className="w-28" />
                        <Input value={certFile} onChange={(e) => setCertFile(e.target.value)} placeholder="Cert URL" className="w-52" />
                        <Button size="sm" onClick={async () => {
                          try {
                            const p = parseFloat(price);
                            if (isNaN(p)) return;
                            await (await import('@/lib/api')).default.post('/bids/submit', { rfqId: rfq.id, price: p, certFile, availability: 'Immediate' });
                            setSubmittingFor(null);
                            setPrice(''); setCertFile('');
                            fetchRFQs();
                          } catch (err) { console.error(err); }
                        }}>Send</Button>
                        <Button size="sm" variant="outline" onClick={() => setSubmittingFor(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <Button size="sm" onClick={() => setSubmittingFor(rfq.id)}>Submit Bid</Button>
                    )}
                  </div>
                </div>
              ))}
              {rfqs.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No RFQs available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
