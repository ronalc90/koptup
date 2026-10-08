'use client';

// Gestión del catálogo en el panel de la tienda: crear, editar precio y
// descripción, ocultar o publicar, reponer existencias por bodega y eliminar
// productos creados. Los cambios se ven al instante en la tienda.

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { PlusIcon, PencilSquareIcon, EyeSlashIcon, EyeIcon, TrashIcon, ArchiveBoxArrowDownIcon, PhotoIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { CATEGORY_IDS, WAREHOUSE_IDS, totalStock, type Product, type ProductCategory, type WarehouseId } from './products';
import { formatPrice, formatNumber } from './pricing';
import { DAY, coverageDays, inWindow, salesByProduct } from './analytics';
import { useStore } from './store';
import { Modal, ProductImage, FieldLabel, inputClass, inputErrorClass, SampleNote } from './ui';

const PAGE = 8;
const LOW_DAYS = 14;
const LOW_UNITS = 5;

export default function CatalogPanel() {
  const t = useTranslations('demoEcommerce2');
  const { state, clock, productName, updateProduct, notify } = useStore();
  const [query, setQuery] = useState('');
  const [onlyLow, setOnlyLow] = useState(false);
  const [limit, setLimit] = useState(PAGE);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [restocking, setRestocking] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);

  const sold = useMemo(() => {
    const rows = salesByProduct(inWindow(state.orders, clock, 0, 30 * DAY), state.products);
    return new Map(rows.map((r) => [r.product.id, r.units]));
  }, [state.orders, state.products, clock]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.products
      .map((p) => {
        const stock = totalStock(p);
        const units = sold.get(p.id) ?? 0;
        const days = coverageDays(stock, units);
        const low = stock < LOW_UNITS || (days !== null && days < LOW_DAYS);
        return { p, stock, units, days, low };
      })
      .filter((r) => !q || productName(r.p).toLowerCase().includes(q) || r.p.sku.toLowerCase().includes(q))
      .filter((r) => !onlyLow || r.low)
      .sort((a, b) => Number(b.low) - Number(a.low) || (a.days ?? 9999) - (b.days ?? 9999));
  }, [state.products, sold, query, onlyLow, productName]);
  const lowCount = useMemo(() => state.products.filter((p) => {
    const stock = totalStock(p);
    const d = coverageDays(stock, sold.get(p.id) ?? 0);
    return stock < LOW_UNITS || (d !== null && d < LOW_DAYS);
  }).length, [state.products, sold]);

  return (
    <Card variant="bordered" padding="md">
      <CardContent>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-secondary-900 dark:text-white">{t('catalog.title')}</h2>
            <SampleNote>{t('catalog.subtitle')}</SampleNote>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400" />
              <input type="search" value={query} onChange={(e) => { setQuery(e.target.value); setLimit(PAGE); }} placeholder={t('catalog.search')} aria-label={t('catalog.search')} className="w-56 rounded-lg border border-secondary-300 bg-white py-1.5 pl-7 pr-2 text-sm dark:border-secondary-700 dark:bg-secondary-800" />
            </div>
            <label className="flex items-center gap-1 text-sm text-secondary-700 dark:text-secondary-300">
              <input type="checkbox" checked={onlyLow} onChange={(e) => { setOnlyLow(e.target.checked); setLimit(PAGE); }} />
              {t('catalog.onlyLow', { n: lowCount })}
            </label>
            <Button size="sm" onClick={() => setCreating(true)} className="flex items-center gap-1">
              <PlusIcon className="h-4 w-4" /> {t('catalog.create')}
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="text-left text-secondary-500">
              <tr className="border-b border-secondary-200 dark:border-secondary-700">
                <th className="py-2 pr-3">{t('catalog.product')}</th>
                <th className="py-2 pr-3 text-right">{t('catalog.price')}</th>
                <th className="py-2 pr-3">{t('catalog.stock')}</th>
                <th className="py-2 pr-3 text-right">{t('catalog.sold30')}</th>
                <th className="py-2 pr-3 text-right">{t('catalog.coverage')}</th>
                <th className="py-2 pr-3">{t('catalog.status')}</th>
                <th className="py-2 pr-3">{t('catalog.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, limit).map(({ p, stock, units, days, low }) => (
                <tr key={p.id} className="border-b border-secondary-100 dark:border-secondary-800">
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-secondary-100 dark:bg-secondary-800">
                        <ProductImage product={p} alt={productName(p)} size={80} sizes="40px" />
                      </div>
                      <div className="min-w-0">
                        <p className="max-w-[220px] truncate font-medium text-secondary-900 dark:text-white">{productName(p)}</p>
                        <p className="text-xs text-secondary-500">{p.sku} · {t(`categories.${p.category}`)}{p.custom && <> · <span className="text-primary-600">{t('catalog.created')}</span></>}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-2 pr-3 text-right font-semibold">{formatPrice(p.price)}</td>
                  <td className="py-2 pr-3">
                    <span className={`font-semibold ${low ? 'text-red-600' : 'text-secondary-900 dark:text-white'}`}>{formatNumber(stock)}</span>
                    <span className="ml-1 text-xs text-secondary-500">({WAREHOUSE_IDS.map((w) => `${t(`warehouses.short.${w}`)} ${p.warehouses[w]}`).join(' · ')})</span>
                  </td>
                  <td className="py-2 pr-3 text-right">{formatNumber(units)}</td>
                  <td className="py-2 pr-3 text-right">
                    {days === null ? '—' : <span className={low ? 'font-semibold text-red-600' : ''}>{t('catalog.days', { n: Math.floor(days) })}</span>}
                  </td>
                  <td className="py-2 pr-3">
                    {p.hidden ? <Badge size="sm">{t('catalog.hidden')}</Badge> : <Badge variant="success" size="sm">{t('catalog.published')}</Badge>}
                  </td>
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-1">
                      <IconAction label={t('catalog.edit')} onClick={() => setEditing(p)}><PencilSquareIcon className="h-4 w-4" /></IconAction>
                      <IconAction label={t('catalog.restock')} onClick={() => setRestocking(p)}><ArchiveBoxArrowDownIcon className="h-4 w-4" /></IconAction>
                      <IconAction
                        label={p.hidden ? t('catalog.publish') : t('catalog.hide')}
                        onClick={() => {
                          updateProduct(p.id, { hidden: !p.hidden });
                          notify(p.hidden ? t('toasts.published', { name: productName(p) }) : t('toasts.hidden', { name: productName(p) }));
                        }}
                      >
                        {p.hidden ? <EyeIcon className="h-4 w-4" /> : <EyeSlashIcon className="h-4 w-4" />}
                      </IconAction>
                      {p.custom && (
                        <IconAction label={t('catalog.delete')} onClick={() => setDeleting(p)} danger><TrashIcon className="h-4 w-4" /></IconAction>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <p className="py-8 text-center text-sm text-secondary-500">{t('catalog.empty')}</p>}
        </div>
        {rows.length > limit && (
          <div className="mt-3 text-center">
            <Button size="sm" variant="ghost" onClick={() => setLimit((l) => l + PAGE)}>{t('catalog.more', { n: rows.length - limit })}</Button>
          </div>
        )}
      </CardContent>

      {creating && (
        <ProductFormModal
          onClose={() => setCreating(false)}
          onSaved={(p) => {
            setCreating(false);
            notify(t('toasts.productCreated', { name: productName(p) }), { label: t('toasts.seeInStore'), view: 'storefront' });
          }}
        />
      )}
      {editing && <ProductFormModal product={editing} onClose={() => setEditing(null)} onSaved={(p) => { setEditing(null); notify(t('toasts.productUpdated', { name: productName(p) })); }} />}
      {restocking && <RestockModal product={restocking} onClose={() => setRestocking(null)} />}
      {deleting && (
        <DeleteModal
          product={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => {
            notify(t('toasts.productDeleted', { name: productName(deleting) }));
            setDeleting(null);
          }}
        />
      )}
    </Card>
  );
}

function IconAction({ label, onClick, children, danger }: { label: string; onClick: () => void; children: React.ReactNode; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className={`rounded-lg p-1.5 ${danger ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950' : 'text-secondary-600 hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-secondary-800'}`}>
      {children}
    </button>
  );
}

/** Reduce la foto en el navegador (máx. 600 px, JPEG) para guardarla en localStorage. */
function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read'));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error('image'));
      img.onload = () => {
        const max = 600;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('canvas'));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function ProductFormModal({ product, onClose, onSaved }: { product?: Product; onClose: () => void; onSaved: (p: Product) => void }) {
  const t = useTranslations('demoEcommerce2');
  const { state, createProduct, updateProduct, productName } = useStore();
  const editing = !!product;
  const [name, setName] = useState(product ? productName(product) : '');
  const [sku, setSku] = useState(product?.sku ?? '');
  const [category, setCategory] = useState<ProductCategory>(product?.category ?? 'fashion');
  const [price, setPrice] = useState(product ? String(product.price) : '');
  const [stock, setStock] = useState('20');
  const [description, setDescription] = useState(product?.description ?? '');
  const [imageData, setImageData] = useState<string | undefined>(product?.imageData);
  const [imageError, setImageError] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const canRename = !product || !!product.custom;
  const skuTaken = !editing && state.products.some((p) => p.sku.toUpperCase() === sku.trim().toUpperCase());
  const errors = {
    name: canRename && name.trim().length < 3,
    sku: !editing && (!/^[A-Za-z0-9-]{4,20}$/.test(sku.trim()) || skuTaken),
    price: !(Number(price) >= 1000 && Number(price) <= 50000000),
    stock: !editing && !(Number.isInteger(Number(stock)) && Number(stock) >= 0 && Number(stock) <= 5000),
  };
  const invalid = Object.values(errors).some(Boolean);

  async function onFile(file: File | undefined) {
    setImageError(false);
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 8 * 1024 * 1024) {
      setImageError(true);
      return;
    }
    try {
      setImageData(await resizeImage(file));
    } catch {
      setImageError(true);
    }
  }

  function save() {
    setShowErrors(true);
    if (invalid) return;
    if (product) {
      const patch: Parameters<typeof updateProduct>[1] = { price: Math.round(Number(price)), description: description.trim() || undefined };
      if (product.custom) patch.name = name.trim();
      updateProduct(product.id, patch);
      onSaved({ ...product, ...patch });
      return;
    }
    const created = createProduct({ name, sku, category, price: Number(price), stock: Number(stock), description, imageData });
    onSaved(created);
  }

  const err = (k: keyof typeof errors) => showErrors && errors[k];

  return (
    <Modal
      title={editing ? t('catalog.form.editTitle') : t('catalog.form.createTitle')}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={save}>{editing ? t('catalog.form.saveChanges') : t('catalog.form.publish')}</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <FieldLabel htmlFor="pf-name" required={canRename}>{t('catalog.form.name')}</FieldLabel>
          <input id="pf-name" value={name} onChange={(e) => setName(e.target.value)} disabled={!canRename} placeholder={t('catalog.form.namePlaceholder')} className={`${inputClass} ${err('name') ? inputErrorClass : ''} disabled:opacity-60`} />
          {!canRename && <SampleNote>{t('catalog.form.baseNameNote')}</SampleNote>}
          {err('name') && <p className="mt-1 text-xs text-red-600">{t('catalog.form.errors.name')}</p>}
        </div>
        <div>
          <FieldLabel htmlFor="pf-sku" required>{t('catalog.form.sku')}</FieldLabel>
          <input id="pf-sku" value={sku} onChange={(e) => setSku(e.target.value)} disabled={editing} placeholder="MOD-TEN-AZU" className={`${inputClass} ${err('sku') ? inputErrorClass : ''} disabled:opacity-60`} />
          {err('sku') && <p className="mt-1 text-xs text-red-600">{skuTaken ? t('catalog.form.errors.skuTaken') : t('catalog.form.errors.sku')}</p>}
        </div>
        <div>
          <FieldLabel htmlFor="pf-cat" required>{t('catalog.form.category')}</FieldLabel>
          <select id="pf-cat" value={category} onChange={(e) => setCategory(e.target.value as ProductCategory)} disabled={editing} className={`${inputClass} disabled:opacity-60`}>
            {CATEGORY_IDS.map((c) => <option key={c} value={c}>{t(`categories.${c}`)}</option>)}
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="pf-price" required>{t('catalog.form.price')}</FieldLabel>
          <input id="pf-price" type="number" inputMode="numeric" min={1000} step={100} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="189900" className={`${inputClass} ${err('price') ? inputErrorClass : ''}`} />
          {Number(price) > 0 && <SampleNote>{formatPrice(Number(price))} · {t('catalog.form.ivaIncluded')}</SampleNote>}
          {err('price') && <p className="mt-1 text-xs text-red-600">{t('catalog.form.errors.price')}</p>}
        </div>
        {!editing && (
          <div>
            <FieldLabel htmlFor="pf-stock" required>{t('catalog.form.stock')}</FieldLabel>
            <input id="pf-stock" type="number" inputMode="numeric" min={0} value={stock} onChange={(e) => setStock(e.target.value)} className={`${inputClass} ${err('stock') ? inputErrorClass : ''}`} />
            {err('stock') && <p className="mt-1 text-xs text-red-600">{t('catalog.form.errors.stock')}</p>}
          </div>
        )}
        <div className="md:col-span-2">
          <FieldLabel htmlFor="pf-desc">{t('catalog.form.description')}</FieldLabel>
          <textarea id="pf-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
        </div>
        {(!editing || product?.custom) && (
          <div className="md:col-span-2">
            <label className="block cursor-pointer rounded-lg border-2 border-dashed border-secondary-300 p-5 text-center text-secondary-500 hover:border-primary-400 dark:border-secondary-700">
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
              {imageData ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageData} alt={t('catalog.form.imagePreview')} className="mx-auto mb-2 h-24 w-24 rounded-lg object-cover" />
              ) : (
                <PhotoIcon className="mx-auto mb-2 h-10 w-10" />
              )}
              <p className="text-sm">{imageData ? t('catalog.form.imageChange') : t('catalog.form.imagePick')}</p>
            </label>
            {imageError && <p className="mt-1 text-xs text-red-600">{t('catalog.form.errors.image')}</p>}
            <SampleNote>{t('catalog.form.imageNote')}</SampleNote>
          </div>
        )}
      </div>
    </Modal>
  );
}

function RestockModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const t = useTranslations('demoEcommerce2');
  const { restock, notify, productName } = useStore();
  const [qty, setQty] = useState('20');
  const [warehouse, setWarehouse] = useState<WarehouseId>('bog');
  const n = Number(qty);
  const valid = Number.isInteger(n) && n >= 1 && n <= 1000;
  return (
    <Modal
      title={t('catalog.restockTitle', { name: productName(product) })}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            disabled={!valid}
            onClick={() => {
              restock(product.id, n, warehouse);
              notify(t('toasts.restocked', { n, name: productName(product), warehouse: t(`warehouses.${warehouse}`) }));
              onClose();
            }}
          >
            {t('catalog.restockConfirm')}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel htmlFor="rs-qty" required>{t('catalog.restockQty')}</FieldLabel>
          <input id="rs-qty" type="number" min={1} max={1000} value={qty} onChange={(e) => setQty(e.target.value)} className={`${inputClass} ${valid ? '' : inputErrorClass}`} />
        </div>
        <div>
          <FieldLabel htmlFor="rs-wh" required>{t('catalog.restockWarehouse')}</FieldLabel>
          <select id="rs-wh" value={warehouse} onChange={(e) => setWarehouse(e.target.value as WarehouseId)} className={inputClass}>
            {WAREHOUSE_IDS.map((w) => <option key={w} value={w}>{t(`warehouses.${w}`)} ({product.warehouses[w]})</option>)}
          </select>
        </div>
      </div>
      <div className="mt-3">
        <SampleNote>{t('catalog.restockNote')}</SampleNote>
      </div>
    </Modal>
  );
}

function DeleteModal({ product, onClose, onDeleted }: { product: Product; onClose: () => void; onDeleted: () => void }) {
  const t = useTranslations('demoEcommerce2');
  const { deleteProduct, productName } = useStore();
  return (
    <Modal
      title={t('catalog.deleteTitle')}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="danger" onClick={() => { deleteProduct(product.id); onDeleted(); }}>{t('catalog.delete')}</Button>
        </>
      }
    >
      <p className="text-sm text-secondary-700 dark:text-secondary-300">{t('catalog.deleteConfirm', { name: productName(product) })}</p>
    </Modal>
  );
}
