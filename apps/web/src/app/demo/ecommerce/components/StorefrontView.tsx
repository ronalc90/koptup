'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  MagnifyingGlassIcon,
  StarIcon,
  HeartIcon,
  EyeIcon,
  ShoppingCartIcon,
  XMarkIcon,
  ArrowsRightLeftIcon,
  SparklesIcon,
  TruckIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import {
  PRODUCTS,
  CATEGORY_IDS,
  Product,
  ProductCategory,
  imageUrl,
  heroImageUrl,
  HERO_PHOTO_ID,
} from './products';
import { useCart, formatPrice } from './shared';

interface Props {
  onProductClick?: (product: Product) => void;
}

export default function StorefrontView({ onProductClick }: Props) {
  const t = useTranslations('demoEcommerce2');
  const { add, pushRecentlyViewed, recentlyViewed, itemCount, goToCheckout } = useCart();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ProductCategory | 'all'>('all');
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggest(false);
      }
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const productName = (p: Product) => {
    const k = `productNames.${p.nameKey}` as const;
    try {
      return t(k);
    } catch {
      return p.sku;
    }
  };

  const suggestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return PRODUCTS
      .filter((p) => productName(p).toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      .slice(0, 5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const filtered = useMemo(() => {
    return PRODUCTS.filter((p) => {
      const matchCat = category === 'all' || p.category === category;
      const matchSearch =
        !search.trim() || productName(p).toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, search]);

  const recommended = useMemo(
    () => PRODUCTS.filter((p) => p.badges.includes('bestseller')).slice(0, 6),
    []
  );

  function toggleWish(id: number) {
    setWishlist((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function openProduct(p: Product) {
    pushRecentlyViewed(p);
    setActiveProduct(p);
    onProductClick?.(p);
  }

  return (
    <div>
      <section className="relative overflow-hidden rounded-2xl mb-8 max-w-7xl mx-auto px-0 sm:px-0">
        <div className="relative h-[280px] sm:h-[360px] md:h-[440px] w-full">
          <Image
            src={heroImageUrl(HERO_PHOTO_ID)}
            alt={t('hero.title')}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 1600px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-secondary-950/80 via-secondary-950/40 to-transparent" />
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
              <div className="max-w-xl text-white">
                <div className="inline-flex items-center gap-2 bg-primary-600/90 backdrop-blur px-3 py-1 rounded-full mb-4">
                  <SparklesIcon className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    {t('hero.badge')}
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-3">
                  {t('hero.title')}
                </h1>
                <p className="text-base sm:text-lg opacity-90 mb-6">{t('hero.subtitle')}</p>
                <div className="flex flex-wrap gap-3">
                  <Badge className="bg-white text-primary-700 font-bold px-3 py-2 flex items-center gap-2">
                    <TruckIcon className="h-4 w-4" />
                    {t('hero.freeShipping')}
                  </Badge>
                  <Badge className="bg-white text-primary-700 font-bold px-3 py-2 flex items-center gap-2">
                    <TagIcon className="h-4 w-4" />
                    {t('hero.priceGuarantee')}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 space-y-4">
          <div ref={searchRef} className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowSuggest(true);
              }}
              onFocus={() => setShowSuggest(true)}
              placeholder={t('search.placeholder')}
              aria-label={t('search.placeholder')}
              className="w-full pl-12 pr-4 py-3 text-base border border-secondary-300 dark:border-secondary-700 rounded-xl bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {showSuggest && suggestions.length > 0 && (
              <div className="absolute top-full mt-2 left-0 right-0 bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 rounded-xl shadow-xl z-30 overflow-hidden">
                <div className="p-2 text-xs uppercase tracking-wide text-secondary-500 border-b border-secondary-200 dark:border-secondary-700">
                  {t('search.suggestions')}
                </div>
                {suggestions.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSearch(productName(p));
                      setShowSuggest(false);
                      openProduct(p);
                    }}
                    className="flex items-center gap-3 w-full p-3 hover:bg-secondary-50 dark:hover:bg-secondary-800 text-left"
                  >
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-secondary-100 dark:bg-secondary-800 shrink-0">
                      <Image src={imageUrl(p.photoId, 80, 80)} alt={productName(p)} fill sizes="40px" className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-secondary-900 dark:text-white truncate">{productName(p)}</div>
                      <div className="text-xs text-secondary-500">{t(`categories.${p.category}`)} • {formatPrice(p.price)}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            <CategoryPill active={category === 'all'} label={t('categories.all')} onClick={() => setCategory('all')} />
            {CATEGORY_IDS.map((c) => (
              <CategoryPill key={c} active={category === c} label={t(`categories.${c}`)} onClick={() => setCategory(c)} />
            ))}
          </div>
        </div>

        {category === 'all' && !search && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-secondary-900 dark:text-white flex items-center gap-2">
                <SparklesIcon className="h-6 w-6 text-primary-600" />
                {t('sections.recommended')}
              </h2>
              <span className="text-xs text-secondary-500">{t('sections.recommendedHint')}</span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 snap-x">
              {recommended.map((p) => (
                <div key={p.id} className="snap-start shrink-0 w-56">
                  <MiniCard product={p} name={productName(p)} onOpen={() => openProduct(p)} onAdd={() => add(p)} />
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-secondary-900 dark:text-white mb-4">
            {search ? `${t('search.resultsFor')} "${search}"` : t('sections.allProducts')}
            <span className="ml-2 text-sm font-normal text-secondary-500">({filtered.length})</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} name={productName(p)} isWish={wishlist.includes(p.id)} onWish={() => toggleWish(p.id)} onAdd={() => add(p)} onView={() => openProduct(p)} t={t} />
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-secondary-500">{t('sections.empty')}</div>
          )}
        </section>

        {recentlyViewed.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-secondary-900 dark:text-white mb-4">{t('sections.recentlyViewed')}</h2>
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 snap-x">
              {recentlyViewed.map((p) => (
                <div key={p.id} className="snap-start shrink-0 w-44">
                  <MiniCard product={p} name={productName(p)} onOpen={() => openProduct(p)} onAdd={() => add(p)} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {itemCount > 0 && (
        <button
          onClick={goToCheckout}
          className="fixed bottom-6 right-6 z-40 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-2xl px-5 py-3 flex items-center gap-3 transition-transform hover:scale-105"
          aria-label={t('cart.goToCheckout')}
        >
          <ShoppingCartIcon className="h-6 w-6" />
          <span className="font-semibold">{t('cart.goToCheckout')}</span>
          <span className="bg-white text-primary-600 font-bold rounded-full h-7 min-w-[28px] px-2 flex items-center justify-center text-sm">{itemCount}</span>
        </button>
      )}

      {activeProduct && (
        <ProductModal
          product={activeProduct}
          name={productName(activeProduct)}
          onClose={() => setActiveProduct(null)}
          onAdd={() => { add(activeProduct); setActiveProduct(null); }}
          onCheckout={() => { add(activeProduct); setActiveProduct(null); goToCheckout(); }}
          t={t}
        />
      )}
    </div>
  );
}

function CategoryPill({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-colors ${
        active ? 'bg-primary-600 text-white shadow' : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-700'
      }`}
    >
      {label}
    </button>
  );
}

function ProductCard({ product, name, isWish, onWish, onAdd, onView, t }: {
  product: Product; name: string; isWish: boolean; onWish: () => void; onAdd: () => void; onView: () => void; t: ReturnType<typeof useTranslations>;
}) {
  return (
    <Card variant="bordered" padding="none" className="overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <CardContent className="p-0">
        <div className="relative aspect-square overflow-hidden bg-secondary-100 dark:bg-secondary-800">
          <Image src={imageUrl(product.photoId, 600, 600)} alt={name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-110" />
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.discount && <Badge className="bg-red-600 text-white font-bold">-{product.discount}%</Badge>}
            {product.badges.includes('new') && <Badge className="bg-green-600 text-white font-bold">NEW</Badge>}
            {product.badges.includes('bestseller') && !product.badges.includes('new') && <Badge className="bg-amber-500 text-white font-bold">★ TOP</Badge>}
            {product.badges.includes('eco') && <Badge className="bg-emerald-600 text-white font-bold">ECO</Badge>}
          </div>
          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <IconButton onClick={onWish} aria-label={t('product.wishlist')}>
              {isWish ? <HeartSolidIcon className="h-5 w-5 text-red-600" /> : <HeartIcon className="h-5 w-5 text-secondary-700 dark:text-secondary-300" />}
            </IconButton>
            <IconButton onClick={onView} aria-label={t('product.quickView')}>
              <EyeIcon className="h-5 w-5 text-secondary-700 dark:text-secondary-300" />
            </IconButton>
            <IconButton onClick={() => {}} aria-label={t('product.compare')}>
              <ArrowsRightLeftIcon className="h-5 w-5 text-secondary-700 dark:text-secondary-300" />
            </IconButton>
          </div>
        </div>
        <div className="p-4">
          <button type="button" onClick={onView} className="block text-left font-semibold text-base text-secondary-900 dark:text-white mb-1 line-clamp-2 hover:text-primary-600">
            {name}
          </button>
          <div className="flex items-center gap-1 mb-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <StarSolidIcon key={i} className={`h-3.5 w-3.5 ${i < Math.floor(product.rating) ? 'text-yellow-500' : 'text-secondary-300 dark:text-secondary-700'}`} />
            ))}
            <span className="text-xs text-secondary-500 ml-1">({product.reviews})</span>
          </div>
          <div className="flex items-end justify-between gap-2">
            <div>
              {product.originalPrice && <p className="text-xs text-secondary-400 line-through">{formatPrice(product.originalPrice)}</p>}
              <p className="text-lg font-bold text-primary-600 dark:text-primary-400">{formatPrice(product.price)}</p>
            </div>
            <Button size="sm" onClick={onAdd}>{t('product.addToCart')}</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniCard({ product, name, onOpen, onAdd }: { product: Product; name: string; onOpen: () => void; onAdd: () => void }) {
  return (
    <Card variant="bordered" padding="none" className="overflow-hidden">
      <CardContent className="p-0">
        <button onClick={onOpen} className="block w-full">
          <div className="relative aspect-square overflow-hidden bg-secondary-100 dark:bg-secondary-800">
            <Image src={imageUrl(product.photoId, 400, 400)} alt={name} fill sizes="224px" className="object-cover" />
          </div>
        </button>
        <div className="p-3">
          <p className="text-sm font-semibold text-secondary-900 dark:text-white line-clamp-2 mb-1">{name}</p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{formatPrice(product.price)}</span>
            <Button size="sm" variant="outline" onClick={onAdd} className="!px-2 !py-1 !text-xs">+</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function IconButton({ onClick, children, ...rest }: { onClick: () => void; children: React.ReactNode; 'aria-label'?: string }) {
  return (
    <button onClick={onClick} className="p-2 bg-white dark:bg-secondary-900 rounded-full shadow hover:scale-110 transition-transform" {...rest}>
      {children}
    </button>
  );
}

function ProductModal({ product, name, onClose, onAdd, onCheckout, t }: {
  product: Product; name: string; onClose: () => void; onAdd: () => void; onCheckout: () => void; t: ReturnType<typeof useTranslations>;
}) {
  const [mainImg, setMainImg] = useState(product.photoId);
  const thumbs = [product.photoId, 'photo-1505740420928-5e560c06d30e', 'photo-1523275335684-37898b6baf30', 'photo-1572635196237-14b3f281503f'];
  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-2 sm:p-4" onClick={onClose}>
      <div className="bg-white dark:bg-secondary-900 rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-end p-3">
          <button onClick={onClose} className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-6 px-6 pb-6">
          <div>
            <div className="relative aspect-square rounded-xl overflow-hidden bg-secondary-100 dark:bg-secondary-800 mb-3">
              <Image src={imageUrl(mainImg, 800, 800)} alt={name} fill sizes="(max-width: 768px) 100vw, 400px" className="object-cover" />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {thumbs.map((id) => (
                <button key={id} onClick={() => setMainImg(id)} className={`relative aspect-square rounded-lg overflow-hidden border-2 ${mainImg === id ? 'border-primary-600' : 'border-transparent'}`}>
                  <Image src={imageUrl(id, 200, 200)} alt="" fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-2">{name}</h2>
            <div className="flex items-center gap-2 mb-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <StarIcon key={i} className={`h-5 w-5 ${i < Math.floor(product.rating) ? 'text-yellow-500 fill-yellow-500' : 'text-secondary-300'}`} />
              ))}
              <span className="text-sm text-secondary-500">{product.reviews} {t('product.reviewsCount')}</span>
            </div>
            <div className="mb-4">
              {product.originalPrice && <span className="text-sm text-secondary-400 line-through mr-2">{formatPrice(product.originalPrice)}</span>}
              <span className="text-3xl font-bold text-primary-600">{formatPrice(product.price)}</span>
            </div>
            <p className="text-sm text-secondary-600 dark:text-secondary-300 mb-4">{t('product.description')}</p>
            <div className="bg-secondary-50 dark:bg-secondary-800 rounded-lg p-4 mb-4 text-sm space-y-1">
              <p><strong>SKU:</strong> {product.sku}</p>
              <p><strong>{t('product.category')}:</strong> {t(`categories.${product.category}`)}</p>
              <p><strong>{t('product.stock')}:</strong> {product.stock}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={onCheckout} className="flex-1">{t('product.buyNow')}</Button>
              <Button onClick={onAdd} variant="outline" className="flex-1">{t('product.addToCart')}</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
