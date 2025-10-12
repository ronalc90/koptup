'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import {
  ShoppingCartIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  StarIcon,
  XMarkIcon,
  MinusIcon,
  PlusIcon,
  TrashIcon,
  Cog6ToothIcon,
  FireIcon,
  TruckIcon,
  TagIcon,
  SparklesIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  category: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  isFeatured?: boolean;
  isBestseller?: boolean;
  isNew?: boolean;
  stock?: number;
}

interface CartItem extends Product {
  quantity: number;
}

export default function EcommerceDemoPage() {
  const t = useTranslations('demoEcommerce');
  const tc = useTranslations('common');

  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      name: 'Laptop Pro 15"',
      price: 1099.99,
      originalPrice: 1299.99,
      discount: 15,
      image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
      category: 'electronics',
      rating: 4.5,
      reviews: 128,
      inStock: true,
      isFeatured: true,
      isBestseller: true,
      stock: 45,
    },
    {
      id: 2,
      name: 'Wireless Headphones',
      price: 159.99,
      originalPrice: 199.99,
      discount: 20,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
      category: 'electronics',
      rating: 4.8,
      reviews: 256,
      inStock: true,
      isBestseller: true,
      stock: 120,
    },
    {
      id: 3,
      name: 'Smart Watch Pro',
      price: 399.99,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
      category: 'electronics',
      rating: 4.6,
      reviews: 189,
      inStock: true,
      isNew: true,
      stock: 67,
    },
    {
      id: 4,
      name: 'Designer Backpack',
      price: 67.49,
      originalPrice: 89.99,
      discount: 25,
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
      category: 'fashion',
      rating: 4.3,
      reviews: 94,
      inStock: true,
      isFeatured: true,
      stock: 89,
    },
    {
      id: 5,
      name: 'Running Shoes',
      price: 129.99,
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
      category: 'fashion',
      rating: 4.7,
      reviews: 342,
      inStock: false,
      stock: 0,
    },
    {
      id: 6,
      name: 'Coffee Maker Pro',
      price: 199.99,
      originalPrice: 249.99,
      discount: 20,
      image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400',
      category: 'home',
      rating: 4.4,
      reviews: 156,
      inStock: true,
      isBestseller: true,
      stock: 34,
    },
    {
      id: 7,
      name: 'Gaming Mouse RGB',
      price: 79.99,
      image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400',
      category: 'electronics',
      rating: 4.9,
      reviews: 423,
      inStock: true,
      isBestseller: true,
      isNew: true,
      stock: 156,
    },
    {
      id: 8,
      name: 'Mechanical Keyboard',
      price: 139.99,
      originalPrice: 179.99,
      discount: 22,
      image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400',
      category: 'electronics',
      rating: 4.7,
      reviews: 287,
      inStock: true,
      isFeatured: true,
      stock: 78,
    },
    {
      id: 9,
      name: 'Yoga Mat Premium',
      price: 49.99,
      image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400',
      category: 'sports',
      rating: 4.5,
      reviews: 156,
      inStock: true,
      stock: 203,
    },
    {
      id: 10,
      name: 'Wireless Charger',
      price: 34.99,
      originalPrice: 49.99,
      discount: 30,
      image: 'https://images.unsplash.com/photo-1591290619762-9d1f5c647f5e?w=400',
      category: 'electronics',
      rating: 4.6,
      reviews: 198,
      inStock: true,
      stock: 145,
    },
    {
      id: 11,
      name: 'Sunglasses Premium',
      price: 159.99,
      image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400',
      category: 'fashion',
      rating: 4.8,
      reviews: 234,
      inStock: true,
      isNew: true,
      stock: 56,
    },
    {
      id: 12,
      name: 'Desk Lamp LED',
      price: 59.99,
      originalPrice: 79.99,
      discount: 25,
      image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400',
      category: 'home',
      rating: 4.4,
      reviews: 167,
      inStock: true,
      stock: 92,
    },
  ]);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showWishlist, setShowWishlist] = useState(false);

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const categories = [
    { id: 'all', label: t('categories.all') },
    { id: 'electronics', label: t('categories.electronics') },
    { id: 'fashion', label: t('categories.fashion') },
    { id: 'home', label: t('categories.home') },
    { id: 'sports', label: t('categories.sports') },
  ];

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredProducts = products.filter(p => p.isFeatured);
  const bestsellers = products.filter(p => p.isBestseller);
  const wishlistProducts = products.filter(p => wishlist.includes(p.id));

  const addToCart = (product: Product) => {
    const existingItem = cartItems.find((item) => item.id === product.id);
    if (existingItem) {
      setCartItems(
        cartItems.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setCartItems([...cartItems, { ...product, quantity: 1 }]);
    }
    setIsCartOpen(true);
  };

  const updateQuantity = (id: number, change: number) => {
    setCartItems(
      cartItems
        .map((item) => {
          if (item.id === id) {
            const newQuantity = item.quantity + change;
            return { ...item, quantity: newQuantity };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (id: number) => {
    setCartItems(cartItems.filter((item) => item.id !== id));
  };

  const toggleWishlist = (id: number) => {
    if (wishlist.includes(id)) {
      setWishlist(wishlist.filter((itemId) => itemId !== id));
    } else {
      setWishlist([...wishlist, id]);
    }
  };

  const handleView = (product: Product) => {
    setSelectedProduct(product);
    setShowViewModal(true);
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const ProductCard = ({ product }: { product: Product }) => (
    <Card key={product.id} variant="bordered" className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <CardContent className="p-0">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden bg-secondary-100 dark:bg-secondary-800 group">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.discount && (
              <Badge variant="default" className="bg-red-600 text-white font-bold">
                -{product.discount}%
              </Badge>
            )}
            {product.isNew && (
              <Badge variant="default" className="bg-green-600 text-white font-bold">
                NEW
              </Badge>
            )}
            {product.isBestseller && !product.isNew && (
              <Badge variant="default" className="bg-yellow-600 text-white font-bold flex items-center gap-1">
                <FireIcon className="h-3 w-3" />
                BESTSELLER
              </Badge>
            )}
          </div>

          {!product.inStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="default" size="lg">
                {t('outOfStock')}
              </Badge>
            </div>
          )}

          {/* Action buttons */}
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            <button
              onClick={() => toggleWishlist(product.id)}
              className="p-2 bg-white/90 dark:bg-secondary-900/90 rounded-full hover:scale-110 transition-transform"
            >
              {wishlist.includes(product.id) ? (
                <HeartSolidIcon className="h-5 w-5 text-red-600" />
              ) : (
                <HeartIcon className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
              )}
            </button>

            <button
              onClick={() => handleView(product)}
              className="p-2 bg-white/90 dark:bg-secondary-900/90 rounded-full hover:scale-110 transition-transform"
            >
              <EyeIcon className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
            </button>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4">
          <h3 className="font-semibold text-lg text-secondary-900 dark:text-white mb-2 line-clamp-2">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <StarSolidIcon
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(product.rating)
                      ? 'text-yellow-500'
                      : 'text-secondary-300 dark:text-secondary-700'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-secondary-600 dark:text-secondary-400">
              ({product.reviews})
            </span>
          </div>

          {/* Price and Action */}
          <div className="flex items-end justify-between">
            <div>
              {product.originalPrice && (
                <p className="text-sm text-secondary-400 line-through">
                  ${product.originalPrice}
                </p>
              )}
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                ${product.price}
              </p>
            </div>
            <Button
              onClick={() => addToCart(product)}
              disabled={!product.inStock}
              variant={product.inStock ? 'primary' : 'outline'}
              size="sm"
            >
              {product.inStock ? t('addToCart') : t('outOfStock')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ProductModal = ({ product }: { product: Product }) => {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-secondary-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-secondary-900 dark:text-white">
              {t('product.view')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-secondary-900 dark:text-white">{product.name}</h3>
                  <p className="text-2xl font-bold text-primary-600 mt-2">${product.price}</p>
                  {product.originalPrice && (
                    <p className="text-lg text-secondary-400 line-through">${product.originalPrice}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {[...Array(5)].map((_, i) => (
                    <StarSolidIcon
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(product.rating)
                          ? 'text-yellow-500'
                          : 'text-secondary-300'
                      }`}
                    />
                  ))}
                  <span className="text-secondary-600">({product.reviews} {t('product.reviews')})</span>
                </div>
                <div>
                  <p className="text-secondary-700 dark:text-secondary-300">
                    <strong>{t('product.category')}:</strong> {categories.find(c => c.id === product.category)?.label}
                  </p>
                  <p className="text-secondary-700 dark:text-secondary-300">
                    <strong>{t('product.stock')}:</strong> {product.stock || 0}
                  </p>
                  <p className="text-secondary-700 dark:text-secondary-300">
                    <strong>Status:</strong> {product.inStock ? t('product.inStock') : t('outOfStock')}
                  </p>
                </div>
                <div className="mt-6">
                  <Button
                    onClick={() => addToCart(product)}
                    disabled={!product.inStock}
                    variant={product.inStock ? 'primary' : 'outline'}
                    className="w-full"
                  >
                    {product.inStock ? t('addToCart') : t('outOfStock')}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setShowViewModal(false)}
                variant="outline"
              >
                {tc('close')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-secondary-900 border-b border-secondary-200 dark:border-secondary-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ShoppingCartIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
                {t('title')}
              </h1>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="w-full pl-10 pr-4 py-2 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Admin Panel Link */}
              <Link
                href="/demo/ecommerce/admin"
                className="flex items-center gap-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                <Cog6ToothIcon className="h-5 w-5" />
                <span className="hidden sm:inline font-medium">{t('adminPanel')}</span>
              </Link>

              {/* Wishlist Button */}
              <button
                onClick={() => setShowWishlist(!showWishlist)}
                className="relative p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition-colors"
              >
                {wishlist.length > 0 ? (
                  <HeartSolidIcon className="h-6 w-6 text-red-600" />
                ) : (
                  <HeartIcon className="h-6 w-6 text-secondary-700 dark:text-secondary-300" />
                )}
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </button>

              {/* Cart Button */}
              <button
                onClick={() => setIsCartOpen(!isCartOpen)}
                className="relative p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition-colors"
              >
                <ShoppingCartIcon className="h-6 w-6 text-secondary-700 dark:text-secondary-300" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItemsCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Categories */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-700'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Promotional Banner */}
        {!searchQuery && selectedCategory === 'all' && !showWishlist && (
          <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 p-8 md:p-12 text-white">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <SparklesIcon className="h-6 w-6" />
                <span className="font-semibold text-sm uppercase tracking-wide">{t('banner.specialOffer')}</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                {t('banner.title')}
              </h2>
              <p className="text-lg md:text-xl mb-6 opacity-90 max-w-2xl">
                {t('banner.description')}
              </p>
              <div className="flex flex-wrap gap-4">
                <Badge variant="default" className="bg-white text-primary-700 font-bold px-4 py-2 flex items-center gap-2">
                  <TruckIcon className="h-5 w-5" />
                  {t('banner.freeShipping')}
                </Badge>
                <Badge variant="default" className="bg-white text-primary-700 font-bold px-4 py-2 flex items-center gap-2">
                  <TagIcon className="h-5 w-5" />
                  {t('banner.priceGuarantee')}
                </Badge>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mb-48"></div>
          </div>
        )}

        {/* Wishlist Section */}
        {showWishlist && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-secondary-900 dark:text-white flex items-center gap-2">
                <HeartSolidIcon className="h-8 w-8 text-red-600" />
                {t('myWishlist')} ({wishlistProducts.length})
              </h2>
              <Button variant="outline" onClick={() => setShowWishlist(false)}>
                {t('viewAllProducts')}
              </Button>
            </div>
            {wishlistProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {wishlistProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white dark:bg-secondary-900 rounded-lg">
                <HeartIcon className="h-16 w-16 mx-auto text-secondary-400 mb-4" />
                <p className="text-xl text-secondary-600 dark:text-secondary-400 mb-2">
                  {t('wishlistEmpty')}
                </p>
                <p className="text-secondary-500 dark:text-secondary-500 mb-6">
                  {t('wishlistEmptyDesc')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Featured Products */}
        {!searchQuery && selectedCategory === 'all' && !showWishlist && featuredProducts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-secondary-900 dark:text-white mb-6 flex items-center gap-2">
              <SparklesIcon className="h-8 w-8 text-primary-600" />
              {t('sections.featured')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

        {/* Bestsellers */}
        {!searchQuery && selectedCategory === 'all' && !showWishlist && bestsellers.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-secondary-900 dark:text-white mb-6 flex items-center gap-2">
              <FireIcon className="h-8 w-8 text-yellow-600" />
              {t('sections.bestsellers')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {bestsellers.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

        {/* All Products */}
        {!showWishlist && (
          <div>
            {(searchQuery || selectedCategory !== 'all') && (
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-6">
                {searchQuery ? `${t('searchResults')} "${searchQuery}"` : `${t('productsCategory')} ${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}`}
              </h2>
            )}
            {!searchQuery && selectedCategory === 'all' && (
              <h2 className="text-3xl font-bold text-secondary-900 dark:text-white mb-6">
                {t('allProducts')}
              </h2>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-16">
                <MagnifyingGlassIcon className="h-16 w-16 mx-auto text-secondary-400 mb-4" />
                <p className="text-xl text-secondary-600 dark:text-secondary-400">
                  {t('noProducts')}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cart Sidebar */}
      {isCartOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsCartOpen(false)}
          />
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-secondary-900 shadow-2xl z-50 flex flex-col">
            {/* Cart Header */}
            <div className="p-6 border-b border-secondary-200 dark:border-secondary-800 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">
                {t('cart.title')} ({cartItemsCount})
              </h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {cartItems.length === 0 ? (
                <div className="text-center py-16">
                  <ShoppingCartIcon className="h-16 w-16 mx-auto text-secondary-400 mb-4" />
                  <p className="text-secondary-600 dark:text-secondary-400">
                    {t('cart.empty')}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 p-4 bg-secondary-50 dark:bg-secondary-800 rounded-lg"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-secondary-900 dark:text-white mb-1">
                          {item.name}
                        </h3>
                        <p className="text-primary-600 dark:text-primary-400 font-bold mb-2">
                          ${item.price}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-1 bg-secondary-200 dark:bg-secondary-700 rounded hover:bg-secondary-300 dark:hover:bg-secondary-600"
                          >
                            <MinusIcon className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-1 bg-secondary-200 dark:bg-secondary-700 rounded hover:bg-secondary-300 dark:hover:bg-secondary-600"
                          >
                            <PlusIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="ml-auto p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Footer */}
            {cartItems.length > 0 && (
              <div className="p-6 border-t border-secondary-200 dark:border-secondary-800">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold text-secondary-900 dark:text-white">
                    {t('cart.total')}
                  </span>
                  <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    ${cartTotal.toFixed(2)}
                  </span>
                </div>
                <Button className="w-full" size="lg">
                  {t('cart.checkout')}
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {/* View Modal */}
      {showViewModal && selectedProduct && (
        <ProductModal product={selectedProduct} />
      )}
    </div>
  );
}
