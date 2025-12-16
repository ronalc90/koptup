'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card, { CardContent } from '@/components/ui/Card';
import {
  PaperClipIcon,
  XMarkIcon,
  PhotoIcon,
  DocumentTextIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';

export default function NewOrderPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [comments, setComments] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [items, setItems] = useState<Array<{ description: string; quantity: number; unitPrice: number }>>([
    { description: '', quantity: 1, unitPrice: 0 },
  ]);

  const handleItemChange = (index: number, field: 'description' | 'quantity' | 'unitPrice', value: string | number) => {
    const next = [...items];
    // @ts-expect-error narrow
    next[index][field] = field === 'description' ? String(value) : Number(value);
    setItems(next);
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    const next = items.filter((_, i) => i !== index);
    setItems(next);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments([...attachments, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <PhotoIcon className="h-5 w-5 text-blue-500" />;
    }
    return <DocumentTextIcon className="h-5 w-5 text-secondary-500" />;
  };

  const totalAmount = items.reduce((sum, it) => sum + (it.quantity * it.unitPrice), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('El nombre del pedido es requerido');
      return;
    }

    const payloadItems = items
      .filter((it) => it.description.trim() && it.quantity > 0 && it.unitPrice >= 0)
      .map((it) => ({ name: it.description.trim(), quantity: it.quantity, price: it.unitPrice }));

    if (payloadItems.length === 0) {
      setError('Debes agregar al menos un ítem válido');
      return;
    }

    setIsSubmitting(true);
    try {
      // Crear FormData para enviar archivos
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('items', JSON.stringify(payloadItems));

      if (comments.trim()) {
        formData.append('comments', comments);
      }

      // Agregar archivos adjuntos
      attachments.forEach((file) => {
        formData.append('attachments', file);
      });

      const response = await fetch('http://localhost:3001/api/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${document.cookie.split('accessToken=')[1]?.split(';')[0]}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al crear el pedido');
      }

      setSuccess('Pedido creado exitosamente. Recibirás una notificación cuando sea aprobado.');
      setTimeout(() => {
        router.push('/dashboard/orders');
      }, 2000);
    } catch (err: any) {
      setError(err?.message || 'Error al crear el pedido');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Nuevo Pedido</h1>
            <p className="text-secondary-600 dark:text-secondary-400 mt-1">
              Describe tu proyecto en detalle y adjunta archivos necesarios
            </p>
          </div>
          <Link href="/dashboard/orders" className="text-primary-600 hover:text-primary-500">
            Volver al listado
          </Link>
        </div>

        <Card variant="elevated" className="shadow-xl">
          <CardContent className="p-6">
            {error && (
              <div className="mb-4 p-3 border border-red-300 bg-red-50 dark:bg-red-950 rounded">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 border border-green-300 bg-green-50 dark:bg-green-950 rounded">
                <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nombre del pedido */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Nombre del pedido *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full px-4 py-3 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Ej. Desarrollo de sitio web corporativo"
                  required
                />
              </div>

              {/* Descripción breve */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Descripción breve
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="block w-full px-4 py-3 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Resumen breve del pedido"
                />
              </div>

              {/* Descripción detallada del proyecto */}
              <div className="bg-primary-50 dark:bg-primary-950 p-4 rounded-lg border border-primary-200 dark:border-primary-800">
                <label className="block text-sm font-medium text-primary-900 dark:text-primary-200 mb-2">
                  📝 Describe tu proyecto en detalle
                </label>
                <p className="text-xs text-primary-700 dark:text-primary-300 mb-3">
                  Explica qué necesitas, objetivos, funcionalidades esperadas, público objetivo, etc.
                </p>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={6}
                  className="block w-full px-4 py-3 border border-primary-300 dark:border-primary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Ejemplo:&#10;- Necesito un sitio web para mi empresa de servicios&#10;- Debe tener sección de servicios, portafolio y contacto&#10;- Quiero que sea responsive y con diseño moderno&#10;- Mi público objetivo son empresas B2B&#10;- Incluir formulario de contacto con validación"
                />
              </div>

              {/* Archivos adjuntos */}
              <div className="bg-secondary-50 dark:bg-secondary-900 p-4 rounded-lg border border-secondary-200 dark:border-secondary-700">
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  📎 Archivos adjuntos
                </label>
                <p className="text-xs text-secondary-600 dark:text-secondary-400 mb-3">
                  Adjunta imágenes, documentos, diseños, referencias, etc. (Máx. 10 archivos, 20MB cada uno)
                </p>

                <div className="space-y-3">
                  <label className="flex items-center justify-center px-4 py-6 border-2 border-dashed border-secondary-300 dark:border-secondary-700 rounded-lg cursor-pointer hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors">
                    <div className="text-center">
                      <ArrowUpTrayIcon className="h-8 w-8 mx-auto text-secondary-400 mb-2" />
                      <span className="text-sm text-secondary-600 dark:text-secondary-400">
                        Haz clic para seleccionar archivos
                      </span>
                      <p className="text-xs text-secondary-500 dark:text-secondary-500 mt-1">
                        PDF, Word, imágenes, ZIP permitidos
                      </p>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.docx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp,.zip,.rar"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                        Archivos seleccionados ({attachments.length}):
                      </p>
                      {attachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-white dark:bg-secondary-950 rounded-lg border border-secondary-200 dark:border-secondary-700"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {getFileIcon(file.type)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-secondary-900 dark:text-white truncate">
                                {file.name}
                              </p>
                              <p className="text-xs text-secondary-500">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="p-1 hover:bg-red-50 dark:hover:bg-red-950 rounded text-red-600 dark:text-red-400"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Ítems del pedido */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
                    Ítems del pedido *
                  </label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-sm text-primary-600 hover:text-primary-500 font-medium"
                  >
                    + Añadir ítem
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((it, idx) => (
                    <div key={idx} className="p-4 bg-white dark:bg-secondary-900 rounded-lg border border-secondary-200 dark:border-secondary-700">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                        <div className="md:col-span-6">
                          <label className="block text-xs font-medium text-secondary-600 dark:text-secondary-400 mb-1">
                            Descripción
                          </label>
                          <input
                            type="text"
                            value={it.description}
                            onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                            className="block w-full px-3 py-2 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-950 text-secondary-900 dark:text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Ej. Diseño de landing page"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-secondary-600 dark:text-secondary-400 mb-1">
                            Cantidad
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={it.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                            className="block w-full px-3 py-2 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-950 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div className="md:col-span-3">
                          <label className="block text-xs font-medium text-secondary-600 dark:text-secondary-400 mb-1">
                            Precio unitario (USD)
                          </label>
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={it.unitPrice === 0 ? '' : it.unitPrice}
                            onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value === '' ? 0 : Number(e.target.value))}
                            placeholder="0.00"
                            className="block w-full px-3 py-2 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-950 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div className="md:col-span-1 flex items-end">
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="w-full px-3 py-2 border rounded-lg text-secondary-700 dark:text-secondary-300 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-700 transition-colors"
                            disabled={items.length === 1}
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total y botón de envío */}
              <div className="flex items-center justify-between pt-4 border-t border-secondary-200 dark:border-secondary-700">
                <div>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">Total estimado:</p>
                  <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    ${totalAmount.toFixed(2)} USD
                  </p>
                </div>
                <Button type="submit" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creando...
                    </>
                  ) : (
                    <>
                      <PaperClipIcon className="h-5 w-5 mr-2" />
                      Crear pedido
                    </>
                  )}
                </Button>
              </div>

              {/* Nota informativa */}
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  💡 <strong>Nota:</strong> El administrador recibirá una notificación de tu pedido y lo revisará.
                  Recibirás una confirmación una vez que sea aprobado. Puedes hacer seguimiento en la sección de conversaciones.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
