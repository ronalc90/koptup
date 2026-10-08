/**
 * JSON-LD de los planes RAG: un `Service` ("Sistemas RAG para empresas") con
 * cada plan como `Offer`. Se arma con los datos de `rag-plans.ts` y los textos
 * en español de `messages/offerings/_rag-plans.es.json`, para que el marcado
 * siempre coincida con la tabla visible de /services#planes-rag (y de /rag).
 *
 * Solo para componentes de servidor (layouts/páginas): importa el JSON de
 * mensajes, que no hace falta en el bundle del cliente.
 */
import ragPlansMessagesEs from '../../messages/offerings/_rag-plans.es.json';
import { RAG_PLANS, RAG_PLANS_PATH, type RagPlan, type RagPlanId } from './rag-plans';
import { SITE_NAME, SITE_URL, absoluteUrl } from './site';

interface RagPlanText {
  name: string;
  tagline: string;
  features: string[];
  monthlyIncludes?: string[];
  note?: string;
}

interface RagPlansText {
  duration: { pilot: string; implementation: string };
  price: { oneTime: string; setup: string; setupFrom: string; monthly: string };
  plans: Record<RagPlanId, RagPlanText>;
}

const TEXT = (ragPlansMessagesEs as unknown as { ragPlans: RagPlansText }).ragPlans;

/** Pone en minúscula la inicial ("Widget web" → "widget web"), pero no siglas ("SSO", "IA"). */
function lowerFirst(value: string): string {
  if (value.length > 1 && value[1] === value[1].toLowerCase() && value[1] !== value[1].toUpperCase()) {
    return value[0].toLowerCase() + value.slice(1);
  }
  return value;
}

/** "a, b y c". */
function joinList(items: string[]): string {
  const list = items.map(lowerFirst);
  if (list.length <= 1) return list.join('');
  return `${list.slice(0, -1).join(', ')} y ${list[list.length - 1]}`;
}

function planDuration(plan: RagPlan): string {
  return plan.monthlyMode === 'none'
    ? `Duración: ${TEXT.duration.pilot.replace('{weeks}', String(plan.weeks.max))}`
    : TEXT.duration.implementation
        .replace('{min}', String(plan.weeks.min))
        .replace('{max}', String(plan.weeks.max));
}

function planDescription(plan: RagPlan): string {
  const text = TEXT.plans[plan.id];
  const parts = [text.tagline, `Incluye ${joinList(text.features)}.`];
  if (plan.hasMonthlyIncludes && text.monthlyIncludes?.length) {
    parts.push(`La mensualidad incluye ${joinList(text.monthlyIncludes)}.`);
  }
  if (plan.monthlyMode === 'sla') parts.push('Mensualidad según SLA.');
  parts.push(`${planDuration(plan)}.`);
  if (plan.hasNote && text.note) parts.push(text.note);
  parts.push('Precios en COP, más IVA si aplica.');
  return parts.join(' ');
}

/** Una `Offer` por plan, con precios en COP sin IVA. */
export function getRagPlanOffers(url: string = absoluteUrl(RAG_PLANS_PATH)) {
  return RAG_PLANS.map((plan) => {
    const setupSpec: Record<string, unknown> = {
      '@type': 'UnitPriceSpecification',
      name:
        plan.monthlyMode === 'none'
          ? TEXT.price.oneTime
          : plan.setupIsFrom
          ? TEXT.price.setupFrom
          : TEXT.price.setup,
      priceCurrency: 'COP',
      valueAddedTaxIncluded: false,
      ...(plan.setupIsFrom ? { minPrice: plan.setup.cop } : { price: plan.setup.cop }),
    };

    const priceSpecification: Record<string, unknown>[] = [setupSpec];
    if (plan.monthlyMode === 'fixed' && plan.monthly) {
      priceSpecification.push({
        '@type': 'UnitPriceSpecification',
        name: TEXT.price.monthly,
        price: plan.monthly.cop,
        priceCurrency: 'COP',
        valueAddedTaxIncluded: false,
        unitCode: 'MON',
        referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'MON' },
      });
    }

    return {
      '@type': 'Offer',
      name: TEXT.plans[plan.id].name,
      description: planDescription(plan),
      url,
      priceCurrency: 'COP',
      // En Empresarial el precio es "desde": va solo como minPrice.
      ...(plan.setupIsFrom ? {} : { price: plan.setup.cop }),
      priceSpecification,
      seller: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    };
  });
}

/** `Service` "Sistemas RAG para empresas" con los planes como ofertas. */
export function getRagServiceJsonLd(pageUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Sistemas RAG para empresas',
    serviceType: 'Retrieval augmented generation (RAG)',
    description:
      'IA que responde con los documentos de tu empresa (manuales, contratos, políticas) y cita la fuente. Piloto con tus documentos en 2 semanas.',
    url: pageUrl,
    provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    areaServed: { '@type': 'Country', name: 'Colombia' },
    offers: getRagPlanOffers(),
  };
}
