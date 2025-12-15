'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { api } from '@/lib/api';
import {
  UserIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await api.get(`/api/admin/users?${params.toString()}`);
      setUsers(response.data?.data || []);
    } catch (error: any) {
      console.error('Error loading users:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert('No tienes permisos para acceder a esta página. Debes iniciar sesión con una cuenta de administrador.');
      }
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers();
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    if (!confirm(`¿Estás seguro de cambiar el rol de este usuario a ${newRole}?`)) {
      return;
    }

    try {
      setUpdatingRole(userId);
      await api.patch(`/api/admin/users/${userId}/role`, { role: newRole });
      await loadUsers();
      alert('Rol actualizado exitosamente');
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Error al actualizar el rol');
    } finally {
      setUpdatingRole(null);
    }
  };

  const getRoleBadge = (role: string) => {
    const badges: Record<string, { variant: any; text: string }> = {
      admin: { variant: 'primary', text: 'Admin' },
      manager: { variant: 'primary', text: 'Manager' },
      developer: { variant: 'secondary', text: 'Developer' },
      user: { variant: 'secondary', text: 'Usuario' },
    };
    const badge = badges[role] || { variant: 'secondary', text: role };
    return <Badge variant={badge.variant} size="sm">{badge.text}</Badge>;
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">
            Usuarios
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">
            Gestiona usuarios y sus roles en el sistema
          </p>
        </div>

        {/* Filters */}
        <Card variant="bordered">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por nombre o email..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-950 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <Button type="submit">Buscar</Button>
              </form>

              {/* Role Filter */}
              <div className="flex gap-2">
                <Button
                  variant={roleFilter === 'all' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setRoleFilter('all')}
                >
                  Todos
                </Button>
                <Button
                  variant={roleFilter === 'admin' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setRoleFilter('admin')}
                >
                  Admin
                </Button>
                <Button
                  variant={roleFilter === 'manager' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setRoleFilter('manager')}
                >
                  Manager
                </Button>
                <Button
                  variant={roleFilter === 'user' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setRoleFilter('user')}
                >
                  Usuario
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card variant="bordered">
          <CardHeader>
            <CardTitle>Todos los usuarios ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <UserIcon className="h-12 w-12 mx-auto text-secondary-400 mb-4" />
                <p className="text-secondary-600 dark:text-secondary-400">
                  No se encontraron usuarios
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-secondary-200 dark:border-secondary-700">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-secondary-900 dark:text-white">
                        Usuario
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-secondary-900 dark:text-white">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-secondary-900 dark:text-white">
                        Rol
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-secondary-900 dark:text-white">
                        Proveedor
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-secondary-900 dark:text-white">
                        Último acceso
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-secondary-900 dark:text-white">
                        Fecha registro
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-secondary-900 dark:text-white">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary-200 dark:divide-secondary-700">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-900">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-950 flex items-center justify-center">
                              {user.avatar ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={user.avatar}
                                  alt={user.name}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                                  {user.name[0]?.toUpperCase()}
                                </span>
                              )}
                            </div>
                            <span className="font-medium text-secondary-900 dark:text-white">
                              {user.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-secondary-600 dark:text-secondary-400">
                          {user.email}
                        </td>
                        <td className="py-4 px-4">
                          {getRoleBadge(user.role)}
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant="secondary" size="sm">
                            {user.provider}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-sm text-secondary-600 dark:text-secondary-400">
                          {formatDate(user.lastLogin)}
                        </td>
                        <td className="py-4 px-4 text-sm text-secondary-600 dark:text-secondary-400">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <select
                              value={user.role}
                              onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                              disabled={updatingRole === user.id}
                              className="text-sm px-3 py-1 rounded border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-950 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                            >
                              <option value="user">Usuario</option>
                              <option value="developer">Developer</option>
                              <option value="manager">Manager</option>
                              <option value="admin">Admin</option>
                            </select>
                            {updatingRole === user.id && (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
