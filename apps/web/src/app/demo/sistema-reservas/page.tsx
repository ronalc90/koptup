'use client';

import { useState } from 'react';
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  CheckCircleIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  ArrowPathIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';

interface Service {
  id: number;
  name: string;
  description: string;
  duration: string;
  price: string;
  image: string;
}

interface Booking {
  id: number;
  service: string;
  client: string;
  date: string;
  time: string;
  status: 'confirmado' | 'pendiente' | 'cancelado';
}

type CalendarView = 'month' | 'week';

export default function SistemaReservas() {
  const [view, setView] = useState<'public' | 'booking' | 'admin'>('public');
  const [calendarView, setCalendarView] = useState<CalendarView>('month');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookingStep, setBookingStep] = useState(1);
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const services: Service[] = [
    {
      id: 1,
      name: 'Consulta Médica General',
      description: 'Evaluación médica completa con profesional certificado',
      duration: '45 minutos',
      price: '$50.000',
      image: '🏥',
    },
    {
      id: 2,
      name: 'Terapia Física',
      description: 'Sesión de rehabilitación y fisioterapia personalizada',
      duration: '60 minutos',
      price: '$65.000',
      image: '💪',
    },
    {
      id: 3,
      name: 'Consulta Nutricional',
      description: 'Asesoría personalizada en nutrición y plan alimenticio',
      duration: '30 minutos',
      price: '$40.000',
      image: '🥗',
    },
    {
      id: 4,
      name: 'Masaje Terapéutico',
      description: 'Masaje profesional para relajación y alivio muscular',
      duration: '90 minutos',
      price: '$80.000',
      image: '💆',
    },
  ];

  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: 1,
      service: 'Consulta Médica General',
      client: 'María González',
      date: '2024-01-30',
      time: '09:00',
      status: 'confirmado',
    },
    {
      id: 2,
      service: 'Terapia Física',
      client: 'Carlos Rodríguez',
      date: '2024-01-30',
      time: '10:30',
      status: 'confirmado',
    },
    {
      id: 3,
      service: 'Consulta Nutricional',
      client: 'Ana Martínez',
      date: '2024-01-30',
      time: '14:00',
      status: 'pendiente',
    },
    {
      id: 4,
      service: 'Masaje Terapéutico',
      client: 'Pedro López',
      date: '2024-01-30',
      time: '16:00',
      status: 'confirmado',
    },
    {
      id: 5,
      service: 'Consulta Médica General',
      client: 'Laura Fernández',
      date: '2024-01-31',
      time: '09:00',
      status: 'cancelado',
    },
  ]);

  const updateBookingStatus = (bookingId: number, newStatus: 'confirmado' | 'pendiente' | 'cancelado') => {
    setBookings(bookings.map(booking =>
      booking.id === bookingId ? { ...booking, status: newStatus } : booking
    ));
  };

  const getFilteredBookings = () => {
    return bookings.filter(booking => {
      if (statusFilter !== 'all' && booking.status !== statusFilter) return false;
      if (serviceFilter !== 'all' && booking.service !== serviceFilter) return false;
      if (dateFilter !== 'all') {
        const today = new Date();
        const bookingDate = new Date(booking.date);

        if (dateFilter === 'today') {
          if (bookingDate.toDateString() !== today.toDateString()) return false;
        } else if (dateFilter === 'week') {
          const weekFromNow = new Date(today);
          weekFromNow.setDate(weekFromNow.getDate() + 7);
          if (bookingDate < today || bookingDate > weekFromNow) return false;
        } else if (dateFilter === 'month') {
          if (bookingDate.getMonth() !== today.getMonth() ||
              bookingDate.getFullYear() !== today.getFullYear()) return false;
        }
      }
      return true;
    });
  };

  const selectedBooking = bookings.find(b => b.id === selectedBookingId);

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00',
  ];

  const occupiedSlots = ['09:00', '10:30', '14:00', '16:00'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const startBooking = (service: Service) => {
    setSelectedService(service);
    setView('booking');
    setBookingStep(1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmado':
        return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400';
      case 'cancelado':
        return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  // Public Landing View
  if (view === 'public') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        {/* Hero Banner */}
        <div className="relative bg-gradient-to-r from-orange-600 to-amber-600 text-white py-20 overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-10" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl font-bold mb-4">Reserva tu Cita en Línea</h1>
            <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
              Sistema moderno y profesional para agendar tus servicios de forma rápida y sencilla
            </p>
            <div className="flex items-center justify-center gap-6 text-orange-100">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                <span>Disponibilidad 24/7</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5" />
                <span>Confirmación Instantánea</span>
              </div>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Nuestros Servicios
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Selecciona el servicio que necesitas y agenda tu cita
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service) => (
              <div
                key={service.id}
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden"
              >
                <div className="bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-950 dark:to-amber-950 p-8 text-center">
                  <div className="text-6xl mb-2">{service.image}</div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    {service.name}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 min-h-[40px]">
                    {service.description}
                  </p>
                  <div className="flex items-center justify-between mb-4 text-sm">
                    <div className="flex items-center gap-1 text-slate-500">
                      <ClockIcon className="w-4 h-4" />
                      <span>{service.duration}</span>
                    </div>
                    <div className="text-orange-600 dark:text-orange-400 font-bold text-lg">
                      {service.price}
                    </div>
                  </div>
                  <button
                    onClick={() => startBooking(service)}
                    className="w-full bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg px-4 py-3 font-semibold hover:from-orange-700 hover:to-amber-700 transition-all shadow-lg"
                  >
                    Reservar ahora
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Admin Access Button */}
          <div className="mt-12 text-center">
            <button
              onClick={() => setView('admin')}
              className="px-6 py-3 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors font-semibold"
            >
              Panel de Administración
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Booking Flow View
  if (view === 'booking') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => setView('public')}
              className="text-orange-600 dark:text-orange-400 hover:underline mb-4"
            >
              ← Volver a servicios
            </button>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Reserva tu Cita
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              {selectedService?.name}
            </p>
          </div>

          {/* Progress Steps */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              {[
                { num: 1, label: 'Fecha' },
                { num: 2, label: 'Hora' },
                { num: 3, label: 'Datos' },
                { num: 4, label: 'Confirmar' },
              ].map((step, index) => (
                <div key={step.num} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                        bookingStep >= step.num
                          ? 'bg-orange-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                      }`}
                    >
                      {bookingStep > step.num ? <CheckCircleIcon className="w-6 h-6" /> : step.num}
                    </div>
                    <span className="text-xs mt-2 text-slate-600 dark:text-slate-400">
                      {step.label}
                    </span>
                  </div>
                  {index < 3 && (
                    <div
                      className={`h-1 flex-1 mx-2 transition-all ${
                        bookingStep > step.num
                          ? 'bg-orange-600'
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step 1: Select Date */}
          {bookingStep === 1 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                Selecciona una Fecha
              </h2>

              {/* Calendar View Toggle */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <button
                    onClick={goToPreviousMonth}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>
                  <h3 className="text-lg font-semibold">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </h3>
                  <button
                    onClick={goToNextMonth}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <ChevronRightIcon className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCalendarView('month')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      calendarView === 'month'
                        ? 'bg-orange-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800'
                    }`}
                  >
                    Mes
                  </button>
                  <button
                    onClick={() => setCalendarView('week')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      calendarView === 'week'
                        ? 'bg-orange-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800'
                    }`}
                  >
                    Semana
                  </button>
                </div>
              </div>

              {/* Month Calendar */}
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day) => (
                  <div key={day} className="text-center text-sm font-semibold text-slate-500 py-2">
                    {day}
                  </div>
                ))}
                {getDaysInMonth(currentMonth).map((day, index) => (
                  <button
                    key={index}
                    disabled={day === null}
                    onClick={() => {
                      if (day) {
                        const dateStr = `2024-01-${day.toString().padStart(2, '0')}`;
                        setSelectedDate(dateStr);
                        setBookingStep(2);
                      }
                    }}
                    className={`aspect-square rounded-lg text-sm font-medium transition-all ${
                      day === null
                        ? 'invisible'
                        : day === new Date().getDate()
                        ? 'bg-orange-100 dark:bg-orange-950 text-orange-600 hover:bg-orange-200'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Select Time */}
          {bookingStep === 2 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Selecciona una Hora
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                Fecha seleccionada: {selectedDate}
              </p>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {timeSlots.map((time) => {
                  const isOccupied = occupiedSlots.includes(time);
                  return (
                    <button
                      key={time}
                      disabled={isOccupied}
                      onClick={() => {
                        setSelectedTime(time);
                        setBookingStep(3);
                      }}
                      className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        isOccupied
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-50'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-orange-600 hover:text-white'
                      }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setBookingStep(1)}
                  className="px-6 py-3 bg-slate-200 dark:bg-slate-800 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                >
                  Atrás
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Client Information */}
          {bookingStep === 3 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                Tus Datos
              </h2>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Juan Pérez"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="juan@ejemplo.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="+57 300 123 4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Comentarios (Opcional)
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Información adicional sobre tu cita..."
                  />
                </div>
              </form>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setBookingStep(2)}
                  className="px-6 py-3 bg-slate-200 dark:bg-slate-800 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                >
                  Atrás
                </button>
                <button
                  onClick={() => setBookingStep(4)}
                  className="flex-1 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg px-6 py-3 font-semibold hover:from-orange-700 hover:to-amber-700 transition-all"
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {bookingStep === 4 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircleIcon className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  ¡Reserva Confirmada!
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Tu cita ha sido agendada exitosamente
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <CalendarIcon className="w-5 h-5 text-slate-500 mt-0.5" />
                  <div>
                    <div className="text-sm text-slate-500">Servicio</div>
                    <div className="font-semibold">{selectedService?.name}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ClockIcon className="w-5 h-5 text-slate-500 mt-0.5" />
                  <div>
                    <div className="text-sm text-slate-500">Fecha y Hora</div>
                    <div className="font-semibold">{selectedDate} - {selectedTime}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <UserIcon className="w-5 h-5 text-slate-500 mt-0.5" />
                  <div>
                    <div className="text-sm text-slate-500">Duración</div>
                    <div className="font-semibold">{selectedService?.duration}</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setView('public')}
                  className="flex-1 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg px-6 py-3 font-semibold hover:from-orange-700 hover:to-amber-700 transition-all"
                >
                  Volver al Inicio
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Admin Panel View
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => setView('public')}
            className="text-orange-600 dark:text-orange-400 hover:underline mb-4"
          >
            ← Volver a vista pública
          </button>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Panel de Reservas
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Gestiona todas las reservas de tu negocio
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <FunnelIcon className="w-5 h-5 text-slate-500" />
              <span className="font-semibold">Filtros:</span>
            </div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg"
            >
              <option value="all">Todas las fechas</option>
              <option value="today">Hoy</option>
              <option value="week">Esta semana</option>
              <option value="month">Este mes</option>
            </select>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg"
            >
              <option value="all">Todos los servicios</option>
              {services.map((service) => (
                <option key={service.id} value={service.name}>{service.name}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg"
            >
              <option value="all">Todos los estados</option>
              <option value="confirmado">Confirmado</option>
              <option value="pendiente">Pendiente</option>
              <option value="cancelado">Cancelado</option>
            </select>
            <button
              onClick={() => {
                setDateFilter('all');
                setServiceFilter('all');
                setStatusFilter('all');
              }}
              className="ml-auto px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
            >
              <ArrowPathIcon className="w-5 h-5" />
              Limpiar Filtros
            </button>
          </div>
        </div>

        {/* Bookings List */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Cliente
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Servicio
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Fecha
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Hora
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {getFilteredBookings().length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No se encontraron reservas con los filtros seleccionados
                    </td>
                  </tr>
                ) : (
                  getFilteredBookings().map((booking) => (
                    <tr key={booking.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-400 rounded-full flex items-center justify-center text-white font-semibold">
                            {booking.client.charAt(0)}
                          </div>
                          <span className="font-medium">{booking.client}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {booking.service}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {booking.date}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {booking.time}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedBookingId(booking.id);
                            setShowDetailModal(true);
                          }}
                          className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                        >
                          Ver Detalles
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedBooking && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Detalles de la Reserva
                  </h2>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedBookingId(null);
                    }}
                    className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Client Info */}
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-slate-800 dark:to-slate-800 rounded-xl p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-400 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        {selectedBooking.client.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                          {selectedBooking.client}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400">Cliente</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <PhoneIcon className="w-4 h-4 text-slate-500" />
                        <span>+57 300 123 4567</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <EnvelopeIcon className="w-4 h-4 text-slate-500" />
                        <span>cliente@email.com</span>
                      </div>
                    </div>
                  </div>

                  {/* Service Info */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-900 dark:text-white">Información del Servicio</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-slate-500">Servicio</div>
                        <div className="font-semibold">{selectedBooking.service}</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-500">Fecha</div>
                        <div className="font-semibold">{selectedBooking.date}</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-500">Hora</div>
                        <div className="font-semibold">{selectedBooking.time}</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-500">Estado</div>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedBooking.status)}`}>
                          {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Actions */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-900 dark:text-white">Cambiar Estado</h4>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          updateBookingStatus(selectedBooking.id, 'confirmado');
                          setShowDetailModal(false);
                        }}
                        disabled={selectedBooking.status === 'confirmado'}
                        className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                          selectedBooking.status === 'confirmado'
                            ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        ✓ Confirmar
                      </button>
                      <button
                        onClick={() => {
                          updateBookingStatus(selectedBooking.id, 'pendiente');
                          setShowDetailModal(false);
                        }}
                        disabled={selectedBooking.status === 'pendiente'}
                        className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                          selectedBooking.status === 'pendiente'
                            ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                            : 'bg-yellow-600 text-white hover:bg-yellow-700'
                        }`}
                      >
                        ⏳ Pendiente
                      </button>
                      <button
                        onClick={() => {
                          updateBookingStatus(selectedBooking.id, 'cancelado');
                          setShowDetailModal(false);
                        }}
                        disabled={selectedBooking.status === 'cancelado'}
                        className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                          selectedBooking.status === 'cancelado'
                            ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        ✕ Cancelar
                      </button>
                    </div>
                  </div>

                  {/* Notes Section */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-900 dark:text-white">Notas</h4>
                    <textarea
                      className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-lg resize-none"
                      rows={4}
                      placeholder="Agregar notas sobre la reserva..."
                    ></textarea>
                    <button className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                      Guardar Notas
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
