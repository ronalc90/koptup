'use client';

import { useCallback, useEffect, useState } from 'react';
import { LmsProvider, useLms } from './lib/store';
import { catalogCourses } from './lib/selectors';
import Header, { DEFAULT_SECTION, type Section } from './components/Header';
import StatsBar from './components/StatsBar';
import CatalogGrid from './components/CatalogGrid';
import CourseModal from './components/CourseModal';
import CheckoutModal from './components/CheckoutModal';
import LearningView from './components/LearningView';
import { LiveSection, GamificationSection, CertificatesSection } from './components/EngagementSections';
import InstructorPanel from './components/InstructorPanel';
import AuthoringPanel from './components/AuthoringPanel';
import AdminPanel from './components/AdminPanel';
import type { Role } from './lib/types';

function LmsApp() {
  const { state } = useLms();
  const [role, setRole] = useState<Role>('student');
  const [section, setSection] = useState<Section>('catalog');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [courseId, setCourseId] = useState<string | null>(null);

  const changeRole = useCallback((r: Role) => {
    setRole(r);
    setSection(DEFAULT_SECTION[r]);
  }, []);

  const goLearn = useCallback((id: string) => {
    setCourseId(id);
    setRole('student');
    setSection('learning');
    setDetailId(null);
    setCheckoutId(null);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openDetail = useCallback((id: string) => {
    setRole('student');
    setSection('catalog');
    setDetailId(id);
  }, []);

  // Si el curso abierto deja de existir (p. ej. se borró un borrador), vuelve al primero inscrito.
  useEffect(() => {
    if (!state) return;
    if (courseId && !state.enrollments[courseId]) setCourseId(null);
  }, [state, courseId]);

  const courses = state ? catalogCourses(state) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-secondary-50 dark:from-secondary-950 dark:via-secondary-900 dark:to-secondary-950">
      <Header role={role} onRole={changeRole} section={section} onSection={setSection} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <StatsBar />

        {!state ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-72 rounded-2xl bg-secondary-100 dark:bg-secondary-800 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {role === 'student' && section === 'catalog' && (
              <CatalogGrid courses={courses} onOpen={setDetailId} onBuy={setCheckoutId} onContinue={goLearn} />
            )}
            {role === 'student' && section === 'learning' && (
              <LearningView
                courseId={courseId}
                onCourse={setCourseId}
                onCatalog={() => setSection('catalog')}
                onOpenCourse={openDetail}
                onCertificates={() => setSection('certificates')}
              />
            )}
            {role === 'student' && section === 'live' && <LiveSection onOpenCourse={openDetail} />}
            {role === 'student' && section === 'gamification' && <GamificationSection />}
            {role === 'student' && section === 'certificates' && <CertificatesSection onCatalog={() => setSection('catalog')} />}
            {role === 'instructor' && section === 'analytics' && <InstructorPanel />}
            {role === 'instructor' && section === 'authoring' && <AuthoringPanel onPreview={openDetail} />}
            {role === 'admin' && (section === 'sales' || section === 'coupons' || section === 'issued') && <AdminPanel section={section} />}
          </>
        )}
      </div>

      {state && detailId && (
        <CourseModal
          courseId={detailId}
          onClose={() => setDetailId(null)}
          onBuy={(id) => {
            setDetailId(null);
            setCheckoutId(id);
          }}
          onContinue={goLearn}
        />
      )}
      {state && checkoutId && <CheckoutModal courseId={checkoutId} onClose={() => setCheckoutId(null)} onLearn={goLearn} />}
    </div>
  );
}

export default function LmsDemoPage() {
  return (
    <LmsProvider>
      <LmsApp />
    </LmsProvider>
  );
}
