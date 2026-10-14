'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import Card, { CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { api } from '@/lib/api';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [status, setStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await api.adminGetInvoices(status === 'all' ? undefined : status);
      setInvoices(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    load();
  }, [status]);

  const download = async (id: string) => {
    const data = await api.downloadInvoice(id);
    const url = (data?.downloadUrl || data?.url || '').toString();
    if (url) window.open(url, '_blank');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Facturas</h1>
          <div className="flex gap-2">
            {['all', 'draft', 'pending', 'paid', 'overdue', 'cancelled'].map(s => (
              <Button key={s} size="sm" variant={status === s ? 'primary' : 'outline'} onClick={() => setStatus(s)}>
                {s}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {invoices.map((inv) => (
              <Card key={inv.id} variant="bordered">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{inv.id}</h3>
                      <p className="text-sm text-secondary-600">Usuario: {inv.user?.name} · {inv.user?.email}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">{inv.status}</Badge>
                      <p className="text-xl font-bold">${(inv.total || 0).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => download(inv.id)}>
                      <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                      Descargar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

