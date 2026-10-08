'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  MagnifyingGlassIcon,
  HeartIcon,
  EyeIcon,
  ShoppingCartIcon,
  SparklesIcon,
  TruckIcon,
  TagIcon,
  MinusIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import {
  CATEGORY_IDS,
  heroImageUrl,
  HERO_PHOTO_ID,
  totalStock,
  discountPct,
  WAREHOUSE_IDS,
  type Product,
  type ProductCategory,
  type PhotoDetail,
} from './products';
import { formatPrice, FREE_SHIPPING_FROM } from './pricing';
import { bestsellerIds } from './analytics';
import { useStore } from './store';
import { Modal, ProductImage, inputClass } from './ui';

type SortId = 'relevance' | 'priceAsc' | 'priceDesc' | 'rating';
const SORTS: SortId[] = ['relevance', 'priceAsc', 'priceDesc', 'rating'];

export default function StorefrontView() {
  const t = useTranslations('demoEcommerce2');
  const { state, clock, addToCart, pushRecentlyViewed, recentlyViewed, cartCount, setView, productName, productById, toggleWish } = useStore();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ProductCategory | 'all' | 'favorites'>('all');
  const [sort, setSort] = useState<SortId>('relevance');
  const [showSuggest, setShowSuggest] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggest(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const visible = useMemo(() => state.products.filter((p) => !p.hidden), [state.products]);
  const bestsellers = useMemo(() => bestsellerIds(state.orders, state.products, clock), [state.orders, state.products, clock]);

  const matches = (p: Product, q: string) => {
    const query = q.trim().toLowerCase();
    return !query || productName(p).toLowerCase().includes(query) || p.sku.toLowerCase().includes(query);
  };

  const suggestions = search.trim() ? visible.filter((p) => matches(p, search)).slice(0, 5) : [];

  const filtered = useMemo(() => {
    const list = visible.filter((p) => {
      const inCat = category === 'all' || (category === 'favorites' ? state.wishlist.includes(p.id) : p.category === category);
      return inCat && matches(p, search);
    });
    const sorted = [...list];
    if (sort === 'priceAsc') sorted.sort((a, b) => a.price - b.price);
    if (sort === 'priceDesc') sorted.sort((a, b) => b.price - a.price);
    if (sort === 'rating') sorted.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, category, search, sort, state.wishlist, productName]);

  function openProduct(p: Product) {
    pushRecentlyViewed(p.id);
    setActiveId(p.id);
  }

  const active = activeId != null ? productById.get(activeId) : undefined;
  const recent = recentlyViewed.map((id) => productById.get(id)).filter((p): p is Product => !!p && !p.hidden);
  const best = bestsellers.map((id) => productById.get(id)).filter((p): p is Product => !!p);

  return (
    <div>
      <section className="relative mx-auto mb-8 max-w-7xl overflow-hidden rounded-2xl">
        <div className="relative h-[400px] w-full sm:h-[360px] md:h-[440px]">
          <Image src={heroImageUrl(HERO_PHOTO_ID)} alt={t('hero.imageAlt')} fill priority sizes="(max-width: 768px) 100vw, 1600px" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-secondary-950/80 via-secondary-950/40 to-transparent" />
          <div className="absolute inset-0 flex items-center">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="max-w-xl text-white">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-600/90 px-3 py-1 backdrop-blur">
                  <SparklesIcon className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wide">{t('hero.badge')}</span>
                </div>
                <h1 className="mb-3 text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">{t('hero.title')}</h1>
                <p className="mb-6 text-base opacity-90 sm:text-lg">{t('hero.subtitle')}</p>
                <div className="flex flex-wrap gap-3">
                  <Badge className="flex items-center gap-2 bg-white px-3 py-2 font-bold text-primary-700">
                    <TruckIcon className="h-4 w-4" />
                    {state.rules.freeShipping ? t('hero.freeShipping', { amount: formatPrice(FREE_SHIPPING_FROM) }) : t('hero.shippingFlat')}
                  </Badge>
                  <Badge className="flex items-center gap-2 bg-white px-3 py-2 font-bold text-primary-700">
                    <TagIcon className="h-4 w-4" />
                    {t('hero.pricesNote')}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 space-y-4">
          <div ref={searchRef} className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowSuggest(true);
              }}
              onFocus={() => setShowSuggest(true)}
              placeholder={t('search.placeholder')}
              aria-label={t('search.placeholder')}
              className="w-full rounded-xl border border-secondary-300 bg-white py-3 pl-12 pr-4 text-base text-secondary-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-secondary-700 dark:bg-secondary-900 dark:text-white"
            />
            {showSuggest && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-secondary-200 bg-white shadow-xl dark:border-secondary-700 dark:bg-secondary-900">
                <div className="border-b border-secondary-200 p-2 text-xs uppercase tracking-wide text-secondary-500 dark:border-secondary-700">{t('search.suggestions')}</div>
                {suggestions.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setShowSuggest(false);
                      openProduct(p);
                    }}
                    className="flex w-full items-center gap-3 p-3 text-left hover:bg-secondary-50 dark:hover:bg-secondary-800"
                  >
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-secondary-100 dark:bg-secondary-800">
                      <ProductImage product={p} alt={productName(p)} size={80} sizes="40px" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-secondary-900 dark:text-white">{productName(p)}</div>
                      <div className="text-xs text-secondary-500">
                        {p.sku} • {t(`categories.${p.category}`)} • {formatPrice(p.price)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              <CategoryPill active={category === 'all'} label={t('categories.all')} onClick={() => setCategory('all')} />
              {CATEGORY_IDS.map((c) => (
                <CategoryPill key={c} active={category === c} label={t(`categories.${c}`)} onClick={() => setCategory(c)} />
              ))}
              <CategoryPill
                active={category === 'favorites'}
                label={t('categories.favorites', { n: state.wishlist.length })}
                onClick={() => setCategory('favorites')}
              />
            </div>
            <label className="flex shrink-0 items-center gap-2 text-sm text-secondary-600 dark:text-secondary-300">
              <span>{t('sort.label')}</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as SortId)} className={`${inputClass} w-auto`}>
                {SORTS.map((s) => (
                  <option key={s} value={s}>
                    {t(`sort.${s}`)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {category === 'all' && !search && best.length > 0 && (
          <section className="mb-10">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="flex items-center gap-2 text-xl font-bold text-secondary-900 dark:text-white sm:text-2xl">
                <SparklesIcon className="h-6 w-6 text-primary-600" />
                {t('sections.recommended')}
              </h2>
              <span className="text-xs text-secondary-500">{t('sections.recommendedHint')}</span>
            </div>
            <div className="-mx-2 flex snap-x gap-4 overflow-x-auto px-2 pb-2">
              {best.map((p) => (
                <div key={p.id} className="w-56 shrink-0 snap-start">
                  <MiniCard product={p} name={productName(p)} onOpen={() => openProduct(p)} onAdd={() => addToCart(p.id)} addLabel={t('product.addToCartNamed', { name: productName(p) })} />
                </div>
              ))}
            </div>
          </section>
        )}

        <section id="ecommerce-productos" className="mb-10 scroll-mt-40">
          <h2 className="mb-4 text-xl font-bold text-secondary-900 dark:text-white sm:text-2xl">
            {search ? `${t('search.resultsFor')} "${search}"` : category === 'favorites' ? t('sections.favorites') : t('sections.allProducts')}
            <span className="ml-2 text-sm font-normal text-secondary-500">({filtered.length})</span>
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {filtered.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                name={productName(p)}
                bestseller={bestsellers.includes(p.id)}
                isWish={state.wishlist.includes(p.id)}
                onWish={() => toggleWish(p.id)}
                onAdd={() => addToCart(p.id)}
                onView={() => openProduct(p)}
              />
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="py-16 text-center text-secondary-500">{category === 'favorites' ? t('sections.favoritesEmpty') : t('sections.empty')}</div>
          )}
        </section>

        {recent.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-bold text-secondary-900 dark:text-white">{t('sections.recentlyViewed')}</h2>
            <div className="-mx-2 flex snap-x gap-4 overflow-x-auto px-2 pb-2">
              {recent.map((p) => (
                <div key={p.id} className="w-44 shrink-0 snap-start">
                  <MiniCard product={p} name={productName(p)} onOpen={() => openProduct(p)} onAdd={() => addToCart(p.id)} addLabel={t('product.addToCartNamed', { name: productName(p) })} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {cartCount > 0 && (
        <button
          type="button"
          onClick={() => setView('checkout')}
          className="fixed bottom-6 right-4 z-40 flex items-center gap-3 rounded-full bg-primary-600 px-5 py-3 text-white shadow-2xl transition-transform hover:scale-105 hover:bg-primary-700 sm:right-6"
        >
          <ShoppingCartIcon className="h-6 w-6" />
          <span className="font-semibold">{t('cart.goToCheckout')}</span>
          <span className="flex h-7 min-w-[28px] items-center justify-center rounded-full bg-white px-2 text-sm font-bold text-primary-600">{cartCount}</span>
        </button>
      )}

      {active && (
        <ProductModal
          key={active.id}
          product={active}
          name={productName(active)}
          onClose={() => setActiveId(null)}
          onAdd={(qty) => {
            addToCart(active.id, qty);
            setActiveId(null);
          }}
          onBuy={(qty) => {
            if (qty > 0) addToCart(active.id, qty);
            setActiveId(null);
            setView('checkout');
          }}
        />
      )}
    </div>
  );
}

function CategoryPill({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
        active ? 'bg-primary-600 text-white shadow' : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200 dark:bg-secondary-800 dark:text-secondary-300 dark:hover:bg-secondary-700'
      }`}
    >
      {label}
    </button>
  );
}

function Stars({ product }: { product: Product }) {
  const t = useTranslations('demoEcommerce2');
  if (!product.reviews) return <p className="mb-2 text-xs text-secondary-500">{t('product.noReviews')}</p>;
  return (
    <div className="mb-2 flex items-center gap-1" aria-label={t('product.ratingLabel', { rating: product.rating, n: product.reviews })}>
      {[0, 1, 2, 3, 4].map((i) => (
        <StarSolidIcon key={i} className={`h-3.5 w-3.5 ${i < Math.round(product.rating) ? 'text-yellow-500' : 'text-secondary-300 dark:text-secondary-700'}`} />
      ))}
      <span className="ml-1 text-xs text-secondary-500">({product.reviews})</span>
    </div>
  );
}

function ProductCard({ product, name, bestseller, isWish, onWish, onAdd, onView }: {
  product: Product; name: string; bestseller: boolean; isWish: boolean; onWish: () => void; onAdd: () => void; onView: () => void;
}) {
  const t = useTranslations('demoEcommerce2');
  const stock = totalStock(product);
  const discount = discountPct(product);
  return (
    <Card variant="bordered" padding="none" className="group overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <CardContent className="p-0">
        <div className="relative aspect-square overflow-hidden bg-secondary-100 dark:bg-secondary-800">
          <ProductImage product={product} alt={name} size={600} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-110" />
          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {stock === 0 && <Badge className="bg-secondary-800 font-bold text-white">{t('product.badges.soldOut')}</Badge>}
            {discount && <Badge className="bg-red-600 font-bold text-white">-{discount}%</Badge>}
            {product.badges.includes('new') && <Badge className="bg-green-600 font-bold text-white">{t('product.badges.new')}</Badge>}
            {bestseller && <Badge className="bg-amber-500 font-bold text-white">★ {t('product.badges.bestseller')}</Badge>}
            {product.badges.includes('eco') && <Badge className="bg-emerald-600 font-bold text-white">{t('product.badges.eco')}</Badge>}
          </div>
          <div className="absolute right-3 top-3 flex flex-col gap-2 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
            <IconButton onClick={onWish} label={isWish ? t('product.wishlistRemove') : t('product.wishlistAdd')} pressed={isWish}>
              {isWish ? <HeartSolidIcon className="h-5 w-5 text-red-600" /> : <HeartIcon className="h-5 w-5 text-secondary-700 dark:text-secondary-300" />}
            </IconButton>
            <IconButton onClick={onView} label={t('product.quickView')}>
              <EyeIcon className="h-5 w-5 text-secondary-700 dark:text-secondary-300" />
            </IconButton>
          </div>
        </div>
        <div className="p-4">
          <button type="button" onClick={onView} className="mb-1 block text-left text-base font-semibold text-secondary-900 line-clamp-2 hover:text-primary-600 dark:text-white">
            {name}
          </button>
          <Stars product={product} />
          <div className="flex items-end justify-between gap-2">
            <div>
              {product.originalPrice && discount && <p className="text-xs text-secondary-400 line-through">{formatPrice(product.originalPrice)}</p>}
              <p className="text-lg font-bold text-primary-600 dark:text-primary-400">{formatPrice(product.price)}</p>
            </div>
            <Button size="sm" onClick={onAdd} disabled={stock === 0} aria-label={t('product.addToCartNamed', { name })}>
              {stock === 0 ? t('product.soldOut') : t('product.addToCart')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniCard({ product, name, onOpen, onAdd, addLabel }: { product: Product; name: string; onOpen: () => void; onAdd: () => void; addLabel: string }) {
  const stock = totalStock(product);
  return (
    <Card variant="bordered" padding="none" className="overflow-hidden">
      <CardContent className="p-0">
        <button type="button" onClick={onOpen} className="block w-full" aria-label={name}>
          <div className="relative aspect-square overflow-hidden bg-secondary-100 dark:bg-secondary-800">
            <ProductImage product={product} alt={name} size={400} sizes="224px" />
          </div>
        </button>
        <div className="p-3">
          <p className="mb-1 text-sm font-semibold text-secondary-900 line-clamp-2 dark:text-white">{name}</p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{formatPrice(product.price)}</span>
            <Button size="sm" variant="outline" onClick={onAdd} disabled={stock === 0} aria-label={addLabel} className="!px-2 !py-1 !text-xs">
              <PlusIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function IconButton({ onClick, children, label, pressed }: { onClick: () => void; children: React.ReactNode; label: string; pressed?: boolean }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} aria-pressed={pressed} className="rounded-full bg-white p-2 shadow transition-transform hover:scale-110 dark:bg-secondary-900">
      {children}
    </button>
  );
}

function ProductModal({ product, name, onClose, onAdd, onBuy }: {
  product: Product; name: string; onClose: () => void; onAdd: (qty: number) => void; onBuy: (qty: number) => void;
}) {
  const t = useTranslations('demoEcommerce2');
  const { state } = useStore();
  // Galería: la foto completa y dos acercamientos de la misma foto.
  const views: Array<PhotoDetail | undefined> = product.photoId ? [undefined, ...product.details] : [undefined];
  const [activeView, setActiveView] = useState(0);
  const stock = totalStock(product);
  const inCart = state.cart.find((c) => c.productId === product.id)?.qty ?? 0;
  const maxQty = Math.max(0, stock - inCart);
  const [qty, setQty] = useState(maxQty > 0 ? 1 : 0);
  const discount = discountPct(product);

  return (
    <Modal title={name} onClose={onClose} size="lg">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <div className="relative mb-3 aspect-square overflow-hidden rounded-xl bg-secondary-100 dark:bg-secondary-800">
            <ProductImage product={product} alt={name} size={800} sizes="(max-width: 768px) 100vw, 400px" detail={views[activeView]} />
          </div>
          {views.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {views.map((detail, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveView(i)}
                  aria-label={i === 0 ? t('product.galleryFull') : t('product.galleryDetail', { n: i })}
                  aria-pressed={activeView === i}
                  className={`relative aspect-square overflow-hidden rounded-lg border-2 ${activeView === i ? 'border-primary-600' : 'border-transparent'}`}
                >
                  <ProductImage product={product} alt="" size={200} sizes="80px" detail={detail} />
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <Stars product={product} />
          <div className="mb-4">
            {product.originalPrice && discount && <span className="mr-2 text-sm text-secondary-400 line-through">{formatPrice(product.originalPrice)}</span>}
            <span className="text-3xl font-bold text-primary-600">{formatPrice(product.price)}</span>
            <p className="mt-1 text-xs text-secondary-500">{t('product.taxIncluded')}</p>
          </div>
          <p className="mb-4 text-sm text-secondary-600 dark:text-secondary-300">{product.description || t('product.description')}</p>
          <div className="mb-4 space-y-1 rounded-lg bg-secondary-50 p-4 text-sm dark:bg-secondary-800">
            <p>
              <strong>{t('product.sku')}:</strong> {product.sku}
            </p>
            <p>
              <strong>{t('product.category')}:</strong> {t(`categories.${product.category}`)}
            </p>
            <p>
              <strong>{t('product.availability')}:</strong>{' '}
              {stock === 0 ? t('product.soldOut') : t('product.unitsAvailable', { n: stock })}
            </p>
            <ul className="mt-1 grid grid-cols-3 gap-2 text-xs text-secondary-600 dark:text-secondary-300">
              {WAREHOUSE_IDS.map((wh) => (
                <li key={wh} className="rounded bg-white px-2 py-1 text-center dark:bg-secondary-900">
                  <span className="block font-semibold">{t(`warehouses.${wh}`)}</span>
                  {product.warehouses[wh]} {t('common.unitsShort')}
                </li>
              ))}
            </ul>
          </div>
          <div className="mb-3 flex items-center gap-3">
            <span className="text-sm text-secondary-600 dark:text-secondary-300">{t('product.quantity')}</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} className="rounded bg-secondary-200 p-1.5 disabled:opacity-40 dark:bg-secondary-700" aria-label={t('checkout.cart.decrease')}>
                <MinusIcon className="h-4 w-4" />
              </button>
              <span className="w-8 text-center font-semibold" aria-live="polite">{qty}</span>
              <button type="button" onClick={() => setQty((q) => Math.min(maxQty, q + 1))} disabled={qty >= maxQty} className="rounded bg-secondary-200 p-1.5 disabled:opacity-40 dark:bg-secondary-700" aria-label={t('checkout.cart.increase')}>
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
            {inCart > 0 && <span className="text-xs text-secondary-500">{t('product.inCart', { n: inCart })}</span>}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => onBuy(qty)} disabled={qty === 0 && inCart === 0} className="flex-1">
              {qty === 0 && inCart > 0 ? t('cart.goToCheckout') : t('product.buyNow')}
            </Button>
            <Button onClick={() => onAdd(qty)} disabled={qty === 0} variant="outline" className="flex-1">
              {t('product.addToCart')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
