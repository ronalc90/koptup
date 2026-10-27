'use client';

import { useCallback, useEffect, useState } from 'react';
import { LmsProvider, useLms } from './lib/store';
import { activeCertificates, catalogCourses } from './lib/selectors';
import { SEED_ENROLLED } from './lib/seed';
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
import { DemoIntro, GettingStarted, type GuideStep } from './components/Intro';
import type { Role } from './lib/types';

/** Preferencia de este navegador: los primeros pasos plegados. */
const GUIDE_KEY = 'koptup.lms.guideHidden';

/** Lleva a una parte de la página cuando ya se pintó la sección. */
function scrollToId(id: string) {
  window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
}

function LmsApp() {
  const { state, dispatch } = useLms();
  const [role, setRole] = useState<Role>('student');
  const [section, setSection] = useState<Section>('catalog');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(true);

  // Se lee después de montar para que el primer render sea igual en el servidor y en el navegador.
  useEffect(() => {
    try {
      if (window.localStorage.getItem(GUIDE_KEY) === '1') setGuideOpen(false);
    } catch {
      /* sin almacenamiento: los pasos quedan abiertos */
    }
  }, []);

  const toggleGuide = () => {
    const next = !guideOpen;
    setGuideOpen(next);
    try {
      window.localStorage.setItem(GUIDE_KEY, next ? '0' : '1');
    } catch {
      /* sin almacenamiento: solo cambia en esta visita */
    }
  };

  const changeRole = useCallback(
    (r: Role) => {
      setRole(r);
      setSection(DEFAULT_SECTION[r]);
      if (r !== 'student') dispatch({ type: 'role.visit', role: r });
    },
    [dispatch],
  );

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

  // Al cambiar de rol o de sección desde más abajo (p. ej. «Ver certificado» al final de la evaluación),
  // la vista nueva empieza arriba y no en el pie de página.
  useEffect(() => {
    const el = document.getElementById('lms-content');
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: 'start' });
  }, [role, section]);

  // Si el curso abierto deja de existir (p. ej. se borró un borrador), vuelve al primero inscrito.
  useEffect(() => {
    if (!state) return;
    if (courseId && !state.enrollments[courseId]) setCourseId(null);
  }, [state, courseId]);

  const courses = state ? catalogCourses(state) : [];

  const guideSteps: GuideStep[] = state
    ? [
        {
          id: 'buy',
          done: Object.keys(state.enrollments).some((id) => !SEED_ENROLLED.includes(id)),
          onAction: () => {
            setRole('student');
            setSection('catalog');
            setDetailId(null);
            const target = ['marketing', ...courses.map((c) => c.id)].find((id) => courses.some((c) => c.id === id && c.price > 0) && !state.enrollments[id]);
            if (target) setCheckoutId(target);
            else scrollToId('lms-content');
          },
        },
        {
          id: 'tutor',
          done: state.tutorQuestions > 0,
          onAction: () => {
            const mine = Object.keys(state.enrollments).find((id) => !SEED_ENROLLED.includes(id));
            setCourseId(mine ?? (state.enrollments.excel ? 'excel' : null));
            setRole('student');
            setSection('learning');
            scrollToId('lms-tutor');
          },
        },
        {
          id: 'quiz',
          done: activeCertificates(state).some((c) => c.courseId !== 'datos'),
          onAction: () => {
            // Primero «Excel para análisis de datos» (el alumno de ejemplo va en el 40 %), luego cualquier curso sin certificado.
            const pending = ['excel', ...Object.keys(state.enrollments)].find((id) => state.enrollments[id] && !state.enrollments[id].certificateId);
            setCourseId(pending ?? null);
            setRole('student');
            setSection('learning');
            scrollToId('lms-quiz');
          },
        },
        {
          id: 'academy',
          done: !!state.visited?.admin,
          onAction: () => {
            changeRole('admin');
            scrollToId('lms-content');
          },
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-secondary-50 dark:from-secondary-950 dark:via-secondary-900 dark:to-secondary-950">
      <DemoIntro />
      <Header role={role} onRole={changeRole} section={section} onSection={setSection} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {state && <GettingStarted steps={guideSteps} open={guideOpen} onToggle={toggleGuide} />}
        <StatsBar />
        <div id="lms-content" className="scroll-mt-48" aria-hidden="true" />

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
