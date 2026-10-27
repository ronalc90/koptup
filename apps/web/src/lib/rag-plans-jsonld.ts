/**
 * JSON-LD de los planes RAG: un `Service` ("Sistemas RAG para empresas") con
 * cada plan como `Offer`. Se arma con los datos de `rag-plans.ts` y los textos
 * de `messages/offerings/_rag-plans.{es,en}.json`, para que el marcado
 * siempre coincida con la tabla visible de /services#planes-rag y de /rag#planes-rag
 * en el mismo idioma. `locale` es "es" (sin prefijo) o "en" (con /en).
 *
 * Solo para componentes de servidor (layouts/páginas): importa el JSON de
 * mensajes, que no hace falta en el bundle del cliente.
 */
import ragPlansMessagesEn from '../../messages/offerings/_rag-plans.en.json';
import ragPlansMessagesEs from '../../messages/offerings/_rag-plans.es.json';
import { localizedUrl } from './i18n-url';
import { RAG_PLANS, RAG_PLANS_PATH, type RagPlan, type RagPlanId } from './rag-plans';
import { SITE_NAME, SITE_URL } from './site';

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

/** Textos del JSON-LD que no están en los mensajes (en español y en inglés). */
interface RagPlansLabels {
  /** Inicio de la lista de alcance: "Incluye …". */
  includes: string;
  /** Inicio de la lista de la mensualidad: "La mensualidad incluye …". */
  monthlyIncludes: string;
  /** Frase de los planes con mensualidad según SLA (Empresarial). */
  sla: string;
  /** Prefijo de la duración del piloto ("Duración: 2 semanas"). */
  duration: string;
  /** Cierre de cada descripción con la nota de precios. */
  taxes: string;
  /** Conjunción antes del último elemento de una lista. */
  and: string;
  /** Nombre y descripción del `Service` de los planes. */
  serviceName: string;
  serviceDescription: string;
}

interface RagPlansCopy {
  texts: RagPlansText;
  labels: RagPlansLabels;
}

const COPY_ES: RagPlansCopy = {
  texts: (ragPlansMessagesEs as unknown as { ragPlans: RagPlansText }).ragPlans,
  labels: {
    includes: 'Incluye',
    monthlyIncludes: 'La mensualidad incluye',
    sla: 'Mensualidad según SLA.',
    duration: 'Duración:',
    taxes: 'Precios en COP, más IVA si aplica.',
    and: 'y',
    serviceName: 'Sistemas RAG para empresas',
    serviceDescription:
      'IA que responde con los documentos de tu empresa (manuales, contratos, políticas) y cita la fuente. Piloto con tus documentos en 2 semanas.',
  },
};

const COPY_EN: RagPlansCopy = {
  texts: (ragPlansMessagesEn as unknown as { ragPlans: RagPlansText }).ragPlans,
  labels: {
    includes: 'Includes',
    monthlyIncludes: 'The monthly fee includes',
    sla: 'Monthly fee based on the SLA.',
    duration: 'Duration:',
    taxes: 'Prices in COP, plus VAT if applicable.',
    and: 'and',
    serviceName: 'RAG systems for companies',
    serviceDescription:
      "AI that answers with your company's documents (manuals, contracts, policies) and cites the source. Pilot with your documents in 2 weeks.",
  },
};

/** Textos del idioma de la página: "en" usa los mensajes en inglés; cualquier otro, español. */
function copyFor(locale: string): RagPlansCopy {
  return locale === 'en' ? COPY_EN : COPY_ES;
}

/** Pone en minúscula la inicial ("Widget web" → "widget web"), pero no siglas ("SSO", "IA"). */
function lowerFirst(value: string): string {
  if (value.length > 1 && value[1] === value[1].toLowerCase() && value[1] !== value[1].toUpperCase()) {
    return value[0].toLowerCase() + value.slice(1);
  }
  return value;
}

/** "a, b y c" (es) / "a, b and c" (en). */
function joinList(items: string[], and: string): string {
  const list = items.map(lowerFirst);
  if (list.length <= 1) return list.join('');
  return `${list.slice(0, -1).join(', ')} ${and} ${list[list.length - 1]}`;
}

function planDuration(plan: RagPlan, { texts, labels }: RagPlansCopy): string {
  return plan.monthlyMode === 'none'
    ? `${labels.duration} ${texts.duration.pilot.replace('{weeks}', String(plan.weeks.max))}`
    : texts.duration.implementation
        .replace('{min}', String(plan.weeks.min))
        .replace('{max}', String(plan.weeks.max));
}

function planDescription(plan: RagPlan, copy: RagPlansCopy): string {
  const { texts, labels } = copy;
  const text = texts.plans[plan.id];
  const parts = [text.tagline, `${labels.includes} ${joinList(text.features, labels.and)}.`];
  if (plan.hasMonthlyIncludes && text.monthlyIncludes?.length) {
    parts.push(`${labels.monthlyIncludes} ${joinList(text.monthlyIncludes, labels.and)}.`);
  }
  if (plan.monthlyMode === 'sla') parts.push(labels.sla);
  parts.push(`${planDuration(plan, copy)}.`);
  if (plan.hasNote && text.note) parts.push(text.note);
  parts.push(labels.taxes);
  return parts.join(' ');
}

/** Una `Offer` por plan, con precios en COP sin IVA. `url` es la tabla de planes de la página. */
export function getRagPlanOffers(url: string, locale = 'es') {
  const copy = copyFor(locale);
  return RAG_PLANS.map((plan) => {
    const setupSpec: Record<string, unknown> = {
      '@type': 'UnitPriceSpecification',
      name:
        plan.monthlyMode === 'none'
          ? copy.texts.price.oneTime
          : plan.setupIsFrom
          ? copy.texts.price.setupFrom
          : copy.texts.price.setup,
      priceCurrency: 'COP',
      valueAddedTaxIncluded: false,
      ...(plan.setupIsFrom ? { minPrice: plan.setup.cop } : { price: plan.setup.cop }),
    };

    const priceSpecification: Record<string, unknown>[] = [setupSpec];
    if (plan.monthlyMode === 'fixed' && plan.monthly) {
      priceSpecification.push({
        '@type': 'UnitPriceSpecification',
        name: copy.texts.price.monthly,
        price: plan.monthly.cop,
        priceCurrency: 'COP',
        valueAddedTaxIncluded: false,
        unitCode: 'MON',
        referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'MON' },
      });
    }

    return {
      '@type': 'Offer',
      name: copy.texts.plans[plan.id].name,
      description: planDescription(plan, copy),
      url,
      priceCurrency: 'COP',
      // En Empresarial el precio es "desde": va solo como minPrice.
      ...(plan.setupIsFrom ? {} : { price: plan.setup.cop }),
      priceSpecification,
      seller: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    };
  });
}

/**
 * `Service` "Sistemas RAG para empresas" con los planes como ofertas.
 * `pageUrl` es la URL de la página; `offersUrl` la de la tabla de planes visible
 * en esa página (por defecto, /services#planes-rag en el idioma `locale`).
 */
export function getRagServiceJsonLd(
  pageUrl: string,
  locale = 'es',
  offersUrl: string = localizedUrl(RAG_PLANS_PATH, locale),
) {
  const { labels } = copyFor(locale);
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: labels.serviceName,
    serviceType: 'Retrieval augmented generation (RAG)',
    description: labels.serviceDescription,
    url: pageUrl,
    provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    areaServed: { '@type': 'Country', name: 'Colombia' },
    offers: getRagPlanOffers(offersUrl, locale),
  };
}
