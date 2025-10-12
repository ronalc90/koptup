'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  ChartBarIcon,
  ShoppingBagIcon,
  UsersIcon,
  CubeIcon,
  TruckIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  sales: number;
  category: string;
}

interface Order {
  id: string;
  customer: string;
  email: string;
  date: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: number;
  shippingCost: number;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  orders: number;
  totalSpent: number;
  lastOrder: string;
}

export default function AdminDashboard() {
  const t = useTranslations('demoEcommerce');
  const ta = useTranslations('adminPanel');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'customers'>('dashboard');
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [pendingAction, setPendingAction] = useState<{ type: string; data?: any } | null>(null);
  const [codeError, setCodeError] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    stock: '',
    category: '',
    adminCode: ''
  });
  const [showProductDetailModal, setShowProductDetailModal] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [showCustomerDetailModal, setShowCustomerDetailModal] = useState(false);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);

  // Mock data
  const stats = {
    totalRevenue: 45789.50,
    revenueChange: 12.5,
    totalOrders: 328,
    ordersChange: 8.2,
    totalCustomers: 156,
    customersChange: 15.3,
    avgOrderValue: 139.60,
    avgChange: -2.1,
  };

  const [products, setProducts] = useState<Product[]>([
    { id: 1, name: 'Laptop Pro 15"', price: 1299.99, stock: 45, sales: 89, category: 'Electronics' },
    { id: 2, name: 'Wireless Headphones', price: 89.99, stock: 120, sales: 234, category: 'Electronics' },
    { id: 3, name: 'Smart Watch', price: 299.99, stock: 67, sales: 156, category: 'Electronics' },
    { id: 4, name: 'Designer Jacket', price: 199.99, stock: 34, sales: 67, category: 'Fashion' },
    { id: 5, name: 'Running Shoes', price: 129.99, stock: 89, sales: 178, category: 'Fashion' },
    { id: 6, name: 'Coffee Maker', price: 79.99, stock: 56, sales: 98, category: 'Home' },
  ]);

  const orders: Order[] = [
    { id: 'ORD-001', customer: 'John Doe', email: 'john@example.com', date: '2025-10-10', total: 1299.99, status: 'delivered', items: 1, shippingCost: 15.00 },
    { id: 'ORD-002', customer: 'Jane Smith', email: 'jane@example.com', date: '2025-10-10', total: 389.98, status: 'shipped', items: 2, shippingCost: 12.00 },
    { id: 'ORD-003', customer: 'Bob Johnson', email: 'bob@example.com', date: '2025-10-09', total: 799.97, status: 'processing', items: 3, shippingCost: 18.00 },
    { id: 'ORD-004', customer: 'Alice Williams', email: 'alice@example.com', date: '2025-10-09', total: 129.99, status: 'pending', items: 1, shippingCost: 8.00 },
    { id: 'ORD-005', customer: 'Charlie Brown', email: 'charlie@example.com', date: '2025-10-08', total: 199.99, status: 'delivered', items: 1, shippingCost: 10.00 },
  ];

  const customers: Customer[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com', orders: 8, totalSpent: 3456.78, lastOrder: '2025-10-10' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', orders: 5, totalSpent: 2134.56, lastOrder: '2025-10-10' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', orders: 12, totalSpent: 5678.90, lastOrder: '2025-10-09' },
    { id: 4, name: 'Alice Williams', email: 'alice@example.com', orders: 3, totalSpent: 987.65, lastOrder: '2025-10-09' },
    { id: 5, name: 'Charlie Brown', email: 'charlie@example.com', orders: 7, totalSpent: 2345.67, lastOrder: '2025-10-08' },
  ];

  const recentActivity = [
    { type: 'order', message: 'New order #ORD-001 from John Doe', time: '5 min ago' },
    { type: 'product', message: 'Product "Laptop Pro" stock updated', time: '15 min ago' },
    { type: 'customer', message: 'New customer registered: Jane Smith', time: '1 hour ago' },
    { type: 'order', message: 'Order #ORD-002 shipped', time: '2 hours ago' },
  ];

  const requestCode = (actionType: string, data?: any) => {
    setPendingAction({ type: actionType, data });
    setShowCodeModal(true);
    setCodeInput('');
    setCodeError('');
  };

  const handleOpenProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        price: product.price.toString(),
        stock: product.stock.toString(),
        category: product.category,
        adminCode: ''
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        price: '',
        stock: '',
        category: '',
        adminCode: ''
      });
    }
    setShowProductModal(true);
  };

  const handleSaveProduct = () => {
    // Validate admin code
    if (productForm.adminCode !== adminCode) {
      alert(ta('products.invalidAdminCode'));
      return;
    }

    // Validate form
    if (!productForm.name || !productForm.price || !productForm.stock || !productForm.category) {
      alert(ta('products.fillAllFields'));
      return;
    }

    if (editingProduct) {
      // Update existing product
      setProducts(products.map(p =>
        p.id === editingProduct.id
          ? {
              ...p,
              name: productForm.name,
              price: parseFloat(productForm.price),
              stock: parseInt(productForm.stock),
              category: productForm.category
            }
          : p
      ));
    } else {
      // Add new product
      const newProduct: Product = {
        id: Math.max(...products.map(p => p.id)) + 1,
        name: productForm.name,
        price: parseFloat(productForm.price),
        stock: parseInt(productForm.stock),
        sales: 0,
        category: productForm.category
      };
      setProducts([...products, newProduct]);
    }

    setShowProductModal(false);
    setEditingProduct(null);
    setProductForm({
      name: '',
      price: '',
      stock: '',
      category: '',
      adminCode: ''
    });
  };

  const handleViewProduct = (product: Product) => {
    setViewingProduct(product);
    setShowProductDetailModal(true);
  };

  const handleViewCustomer = (customer: Customer) => {
    setViewingCustomer(customer);
    setShowCustomerDetailModal(true);
  };

  const validateCode = () => {
    if (codeInput === adminCode) {
      // Execute pending action
      if (pendingAction) {
        if (pendingAction.type === 'delete-product') {
          setProducts(products.filter(p => p.id !== pendingAction.data));
        }
        // Add other actions here
      }
      setShowCodeModal(false);
      setPendingAction(null);
      setCodeInput('');
      setCodeError('');
    } else {
      setCodeError(ta('validation.error'));
    }
  };

  // Filter orders by status
  const filteredOrders = orderStatusFilter === 'all'
    ? orders
    : orders.filter(order => order.status.toLowerCase() === orderStatusFilter.toLowerCase());

  // Filter customers by search
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.email.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };
    return colors[status] || colors.pending;
  };

  const getStatusIcon = (status: string) => {
    const icons: { [key: string]: any } = {
      pending: ClockIcon,
      processing: ChartBarIcon,
      shipped: TruckIcon,
      delivered: CheckCircleIcon,
      cancelled: XCircleIcon,
    };
    return icons[status] || ClockIcon;
  };

  const calculateShippingCost = (total: number, items: number) => {
    const baseRate = 5.00;
    const perItemRate = 3.00;
    const freeShippingThreshold = 100;

    if (total >= freeShippingThreshold) return 0;
    return baseRate + (items * perItemRate);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{ta('title')}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">E-commerce Demo Admin Panel</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
                {ta('demoMode')}
              </span>
              <Link
                href="/demo/ecommerce"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                {ta('backToStore')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'dashboard', label: ta('tabs.dashboard'), icon: ChartBarIcon },
              { id: 'products', label: ta('tabs.products'), icon: CubeIcon },
              { id: 'orders', label: ta('tabs.orders'), icon: ShoppingBagIcon },
              { id: 'customers', label: ta('tabs.customers'), icon: UsersIcon },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Code Setup Banner */}
        {!adminCode && (
          <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-500 mb-1">
                  {ta('adminCode.required')}
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-3">
                  {ta('adminCode.setupPrompt')}
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="password"
                    placeholder={ta('adminCode.placeholder')}
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-yellow-300 dark:border-yellow-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={() => {
                      if (adminCode) {
                        alert(ta('adminCode.successAlert'));
                      }
                    }}
                    disabled={!adminCode}
                    className="px-3 py-1.5 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {ta('adminCode.setButton')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{ta('dashboard.stats.revenue')}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      ${stats.totalRevenue.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <ChartBarIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="flex items-center mt-4">
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-500">{stats.revenueChange}%</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{ta('dashboard.stats.vsLastMonth')}</span>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{ta('dashboard.stats.orders')}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalOrders}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <ShoppingBagIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="flex items-center mt-4">
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-500">{stats.ordersChange}%</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{ta('dashboard.stats.vsLastMonth')}</span>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{ta('dashboard.stats.customers')}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalCustomers}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <UsersIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div className="flex items-center mt-4">
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-500">{stats.customersChange}%</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{ta('dashboard.stats.vsLastMonth')}</span>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{ta('dashboard.stats.avgOrderValue')}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      ${stats.avgOrderValue.toFixed(2)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                    <TruckIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
                <div className="flex items-center mt-4">
                  <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                  <span className="text-sm text-red-500">{Math.abs(stats.avgChange)}%</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{ta('dashboard.stats.vsLastMonth')}</span>
                </div>
              </div>
            </div>

            {/* Charts and Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Orders */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{ta('dashboard.recentOrders')}</h3>
                <div className="space-y-4">
                  {orders.slice(0, 5).map((order) => {
                    const StatusIcon = getStatusIcon(order.status);
                    return (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center gap-3">
                          <StatusIcon className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{order.id}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{order.customer}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-white">${order.total.toFixed(2)}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{ta('dashboard.recentActivity')}</h3>
                <div className="space-y-4">
                  {recentActivity.map((activity, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-white">{activity.message}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{ta('tabs.products')}</h2>
              <button
                onClick={() => handleOpenProductModal()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
                {ta('products.addProduct')}
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {ta('products.name')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {ta('products.category')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {ta('products.price')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {ta('products.stock')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {ta('products.sales')}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {ta('products.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{product.category}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            ${product.price.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`text-sm ${
                              product.stock < 50
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-green-600 dark:text-green-400'
                            }`}
                          >
                            {product.stock} {ta('products.units')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{product.sales} {ta('products.sold')}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewProduct(product)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                              title={ta('products.viewDetails')}
                            >
                              <EyeIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleOpenProductModal(product)}
                              className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                              title={ta('products.editProduct')}
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => requestCode('delete-product', product.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                              title={ta('products.deleteProduct')}
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{ta('tabs.orders')}</h2>
              <div className="flex items-center gap-4">
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">{ta('orders.allStatus')}</option>
                  <option value="pending">{ta('orders.status.pending')}</option>
                  <option value="processing">{ta('orders.status.processing')}</option>
                  <option value="shipped">{ta('orders.status.shipped')}</option>
                  <option value="delivered">{ta('orders.status.delivered')}</option>
                  <option value="cancelled">{ta('orders.status.cancelled')}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredOrders.map((order) => {
                const StatusIcon = getStatusIcon(order.status);
                return (
                  <div
                    key={order.id}
                    className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{order.id}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{order.date}</p>
                      </div>
                      <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                        <StatusIcon className="h-4 w-4" />
                        {order.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{ta('orders.customer')}</p>
                        <p className="font-medium text-gray-900 dark:text-white">{order.customer}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{order.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{ta('orders.items')}</p>
                        <p className="font-medium text-gray-900 dark:text-white">{order.items} {ta('orders.products')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{ta('orders.shippingCost')}</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {order.shippingCost === 0 ? ta('orders.free') : `$${order.shippingCost.toFixed(2)}`}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{ta('orders.total')}</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          ${(order.total + order.shippingCost).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Customers Tab */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{ta('tabs.customers')}</h2>
              <input
                type="search"
                placeholder={ta('customers.search')}
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {ta('customers.name')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {ta('customers.email')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {ta('customers.orders')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {ta('customers.totalSpent')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {ta('customers.lastOrder')}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {ta('products.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {customer.name.charAt(0)}
                            </div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{customer.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{customer.email}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{customer.orders}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-bold text-green-600 dark:text-green-400">
                            ${customer.totalSpent.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{customer.lastOrder}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleViewCustomer(customer)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                          >
                            {ta('customers.viewDetails')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {editingProduct ? ta('products.editProduct') : ta('products.addNewProduct')}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {ta('products.productName')}
                </label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder={ta('products.enterProductName')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {ta('products.priceUSD')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {ta('products.stock')}
                </label>
                <input
                  type="number"
                  value={productForm.stock}
                  onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                  placeholder="0"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {ta('products.category')}
                </label>
                <select
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">{ta('products.selectCategory')}</option>
                  <option value="Electronics">{ta('categories.electronics')}</option>
                  <option value="Fashion">{ta('categories.fashion')}</option>
                  <option value="Home">{ta('categories.home')}</option>
                  <option value="Sports">{ta('categories.sports')}</option>
                  <option value="Books">{ta('categories.books')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {ta('products.adminCode')}
                </label>
                <input
                  type="password"
                  value={productForm.adminCode}
                  onChange={(e) => setProductForm({ ...productForm, adminCode: e.target.value })}
                  placeholder={ta('products.enterAdminCode')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowProductModal(false);
                  setEditingProduct(null);
                  setProductForm({
                    name: '',
                    price: '',
                    stock: '',
                    category: '',
                    adminCode: ''
                  });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {ta('products.cancel')}
              </button>
              <button
                onClick={handleSaveProduct}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingProduct ? ta('products.update') : ta('products.create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Code Validation Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{ta('validation.title')}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {ta('validation.description')}
            </p>
            <input
              type="text"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder={ta('validation.inputPlaceholder')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
              onKeyPress={(e) => e.key === 'Enter' && validateCode()}
            />
            {codeError && <p className="text-sm text-red-600 dark:text-red-400 mb-4">{codeError}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCodeModal(false);
                  setPendingAction(null);
                  setCodeInput('');
                  setCodeError('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {ta('validation.cancel')}
              </button>
              <button
                onClick={validateCode}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {ta('validation.verify')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {showProductDetailModal && viewingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{ta('products.productDetails')}</h3>
              <button
                onClick={() => setShowProductDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{ta('products.productName')}</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{viewingProduct.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{ta('products.category')}</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{viewingProduct.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{ta('products.price')}</p>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">${viewingProduct.price.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{ta('products.stock')}</p>
                <p className={`text-lg font-semibold ${viewingProduct.stock < 50 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                  {viewingProduct.stock} {ta('products.units')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{ta('products.sales')}</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{viewingProduct.sales} {ta('products.sold')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{ta('products.revenue')}</p>
                <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  ${(viewingProduct.price * viewingProduct.sales).toFixed(2)}
                </p>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowProductDetailModal(false);
                  handleOpenProductModal(viewingProduct);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {ta('products.editProduct')}
              </button>
              <button
                onClick={() => setShowProductDetailModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {ta('products.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Detail Modal */}
      {showCustomerDetailModal && viewingCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{ta('customers.customerDetails')}</h3>
              <button
                onClick={() => setShowCustomerDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-semibold">
                  {viewingCustomer.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-gray-900 dark:text-white">{viewingCustomer.name}</h4>
                  <p className="text-gray-600 dark:text-gray-400">{viewingCustomer.email}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">{ta('customers.totalOrders')}</p>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{viewingCustomer.orders}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <p className="text-sm text-green-600 dark:text-green-400 mb-1">{ta('customers.totalSpent')}</p>
                <p className="text-3xl font-bold text-green-700 dark:text-green-300">${viewingCustomer.totalSpent.toFixed(2)}</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <p className="text-sm text-purple-600 dark:text-purple-400 mb-1">{ta('customers.avgOrderValue')}</p>
                <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                  ${(viewingCustomer.totalSpent / viewingCustomer.orders).toFixed(2)}
                </p>
              </div>
            </div>
            <div className="mt-6">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{ta('customers.lastOrder')}</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{viewingCustomer.lastOrder}</p>
            </div>
            <div className="mt-6">
              <button
                onClick={() => setShowCustomerDetailModal(false)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {ta('customers.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
