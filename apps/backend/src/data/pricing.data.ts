/**
 * Precios que usa el backend para precargar las propuestas (planes RAG y
 * catálogo "otras soluciones a medida").
 *
 * GENERADO por `npm run sync:pricing --workspace=apps/backend`
 * (src/scripts/sync-pricing.ts) desde apps/web/src/lib/rag-plans.ts,
 * apps/web/src/lib/services-catalog.ts y apps/web/messages/offerings. No lo
 * edites a mano: cambia la web y vuelve a generarlo. La prueba
 * __tests__/unit/pricing-sync.test.ts falla si esta copia y la web divergen.
 */
import type { PricingData } from './pricing.types';

export const PRICING_DATA: PricingData = {
  "trmReferencia": 3300,
  "ragPlans": [
    {
      "id": "piloto",
      "nombre": {
        "es": "Piloto RAG",
        "en": "RAG Pilot"
      },
      "setup": {
        "cop": 3900000,
        "usd": 1200
      },
      "setupIsFrom": false,
      "monthlyMode": "none",
      "monthly": null,
      "weeks": {
        "min": 2,
        "max": 2
      }
    },
    {
      "id": "esencial",
      "nombre": {
        "es": "Esencial",
        "en": "Essential"
      },
      "setup": {
        "cop": 9900000,
        "usd": 2990
      },
      "setupIsFrom": false,
      "monthlyMode": "fixed",
      "monthly": {
        "cop": 1490000,
        "usd": 450
      },
      "weeks": {
        "min": 3,
        "max": 4
      }
    },
    {
      "id": "profesional",
      "nombre": {
        "es": "Profesional",
        "en": "Professional"
      },
      "setup": {
        "cop": 24900000,
        "usd": 7490
      },
      "setupIsFrom": false,
      "monthlyMode": "fixed",
      "monthly": {
        "cop": 2990000,
        "usd": 890
      },
      "weeks": {
        "min": 6,
        "max": 8
      }
    },
    {
      "id": "empresarial",
      "nombre": {
        "es": "Empresarial",
        "en": "Enterprise"
      },
      "setup": {
        "cop": 59900000,
        "usd": 17900
      },
      "setupIsFrom": true,
      "monthlyMode": "sla",
      "monthly": null,
      "weeks": {
        "min": 10,
        "max": 14
      }
    }
  ],
  "offerings": [
    {
      "slug": "chatbot-rag-ia",
      "demoSlug": "chatbot",
      "nombre": {
        "es": "Chatbot RAG con IA",
        "en": "AI RAG Chatbot"
      },
      "tiers": [
        {
          "key": "basico",
          "nombre": {
            "es": "Básico",
            "en": "Basic"
          },
          "compra": {
            "setupCOP": 46000000,
            "mantenimientoCOP": 4200000
          },
          "saas": {
            "setupCOP": 2900000,
            "monthlyCOP": 1590000
          },
          "implementacionSemanas": {
            "min": 2,
            "max": 5
          }
        },
        {
          "key": "profesional",
          "nombre": {
            "es": "Profesional",
            "en": "Professional"
          },
          "compra": {
            "setupCOP": 117000000,
            "mantenimientoCOP": 10400000
          },
          "saas": {
            "setupCOP": 6900000,
            "monthlyCOP": 3790000
          },
          "implementacionSemanas": {
            "min": 5,
            "max": 9
          }
        },
        {
          "key": "avanzado",
          "nombre": {
            "es": "Avanzado",
            "en": "Advanced"
          },
          "compra": {
            "setupCOP": 273000000,
            "mantenimientoCOP": 23400000
          },
          "saas": {
            "setupCOP": 12900000,
            "monthlyCOP": 7090000
          },
          "implementacionSemanas": {
            "min": 9,
            "max": 14
          }
        },
        {
          "key": "enterprise",
          "nombre": {
            "es": "Enterprise",
            "en": "Enterprise"
          },
          "compra": {
            "setupCOP": 585000000,
            "mantenimientoCOP": 45500000
          },
          "saas": {
            "setupCOP": 0,
            "monthlyCOP": 12890000
          },
          "implementacionSemanas": {
            "min": 12,
            "max": 20
          }
        }
      ]
    },
    {
      "slug": "ecommerce",
      "demoSlug": "ecommerce",
      "nombre": {
        "es": "Tienda en línea",
        "en": "Ecommerce Storefront"
      },
      "tiers": [
        {
          "key": "basico",
          "nombre": {
            "es": "Básico",
            "en": "Basic"
          },
          "compra": {
            "setupCOP": 56000000,
            "mantenimientoCOP": 5100000
          },
          "saas": {
            "setupCOP": 2900000,
            "monthlyCOP": 1890000
          },
          "implementacionSemanas": {
            "min": 2,
            "max": 5
          }
        },
        {
          "key": "profesional",
          "nombre": {
            "es": "Profesional",
            "en": "Professional"
          },
          "compra": {
            "setupCOP": 144000000,
            "mantenimientoCOP": 12800000
          },
          "saas": {
            "setupCOP": 6900000,
            "monthlyCOP": 4590000
          },
          "implementacionSemanas": {
            "min": 5,
            "max": 9
          }
        },
        {
          "key": "avanzado",
          "nombre": {
            "es": "Avanzado",
            "en": "Advanced"
          },
          "compra": {
            "setupCOP": 336000000,
            "mantenimientoCOP": 28800000
          },
          "saas": {
            "setupCOP": 12900000,
            "monthlyCOP": 8790000
          },
          "implementacionSemanas": {
            "min": 9,
            "max": 14
          }
        },
        {
          "key": "enterprise",
          "nombre": {
            "es": "Enterprise",
            "en": "Enterprise"
          },
          "compra": {
            "setupCOP": 720000000,
            "mantenimientoCOP": 56000000
          },
          "saas": {
            "setupCOP": 0,
            "monthlyCOP": 15790000
          },
          "implementacionSemanas": {
            "min": 12,
            "max": 20
          }
        }
      ]
    },
    {
      "slug": "bi-dashboard",
      "demoSlug": "dashboard-ejecutivo",
      "nombre": {
        "es": "Dashboard ejecutivo con IA",
        "en": "Executive BI Dashboard with AI"
      },
      "tiers": [
        {
          "key": "basico",
          "nombre": {
            "es": "Básico",
            "en": "Basic"
          },
          "compra": {
            "setupCOP": 46000000,
            "mantenimientoCOP": 4200000
          },
          "saas": {
            "setupCOP": 2900000,
            "monthlyCOP": 1590000
          },
          "implementacionSemanas": {
            "min": 2,
            "max": 5
          }
        },
        {
          "key": "profesional",
          "nombre": {
            "es": "Profesional",
            "en": "Professional"
          },
          "compra": {
            "setupCOP": 117000000,
            "mantenimientoCOP": 10400000
          },
          "saas": {
            "setupCOP": 6900000,
            "monthlyCOP": 3790000
          },
          "implementacionSemanas": {
            "min": 5,
            "max": 9
          }
        },
        {
          "key": "avanzado",
          "nombre": {
            "es": "Avanzado",
            "en": "Advanced"
          },
          "compra": {
            "setupCOP": 273000000,
            "mantenimientoCOP": 23400000
          },
          "saas": {
            "setupCOP": 12900000,
            "monthlyCOP": 7090000
          },
          "implementacionSemanas": {
            "min": 9,
            "max": 14
          }
        },
        {
          "key": "enterprise",
          "nombre": {
            "es": "Enterprise",
            "en": "Enterprise"
          },
          "compra": {
            "setupCOP": 585000000,
            "mantenimientoCOP": 45500000
          },
          "saas": {
            "setupCOP": 0,
            "monthlyCOP": 12890000
          },
          "implementacionSemanas": {
            "min": 12,
            "max": 20
          }
        }
      ]
    },
    {
      "slug": "gestor-documental",
      "demoSlug": "gestor-documentos",
      "nombre": {
        "es": "Gestor documental con IA",
        "en": "Document management with AI"
      },
      "tiers": [
        {
          "key": "basico",
          "nombre": {
            "es": "Básico",
            "en": "Basic"
          },
          "compra": {
            "setupCOP": 35000000,
            "mantenimientoCOP": 3200000
          },
          "saas": {
            "setupCOP": 2900000,
            "monthlyCOP": 1190000
          },
          "implementacionSemanas": {
            "min": 2,
            "max": 5
          }
        },
        {
          "key": "profesional",
          "nombre": {
            "es": "Profesional",
            "en": "Professional"
          },
          "compra": {
            "setupCOP": 90000000,
            "mantenimientoCOP": 8000000
          },
          "saas": {
            "setupCOP": 6900000,
            "monthlyCOP": 2890000
          },
          "implementacionSemanas": {
            "min": 5,
            "max": 9
          }
        },
        {
          "key": "avanzado",
          "nombre": {
            "es": "Avanzado",
            "en": "Advanced"
          },
          "compra": {
            "setupCOP": 210000000,
            "mantenimientoCOP": 18000000
          },
          "saas": {
            "setupCOP": 12900000,
            "monthlyCOP": 5490000
          },
          "implementacionSemanas": {
            "min": 9,
            "max": 14
          }
        },
        {
          "key": "enterprise",
          "nombre": {
            "es": "Enterprise",
            "en": "Enterprise"
          },
          "compra": {
            "setupCOP": 450000000,
            "mantenimientoCOP": 35000000
          },
          "saas": {
            "setupCOP": 0,
            "monthlyCOP": 9890000
          },
          "implementacionSemanas": {
            "min": 12,
            "max": 20
          }
        }
      ]
    },
    {
      "slug": "sistema-reservas",
      "demoSlug": "sistema-reservas",
      "nombre": {
        "es": "Sistema de reservas",
        "en": "Booking system"
      },
      "tiers": [
        {
          "key": "basico",
          "nombre": {
            "es": "Básico",
            "en": "Basic"
          },
          "compra": {
            "setupCOP": 32000000,
            "mantenimientoCOP": 2900000
          },
          "saas": {
            "setupCOP": 2900000,
            "monthlyCOP": 1090000
          },
          "implementacionSemanas": {
            "min": 2,
            "max": 5
          }
        },
        {
          "key": "profesional",
          "nombre": {
            "es": "Profesional",
            "en": "Professional"
          },
          "compra": {
            "setupCOP": 81000000,
            "mantenimientoCOP": 7200000
          },
          "saas": {
            "setupCOP": 6900000,
            "monthlyCOP": 2590000
          },
          "implementacionSemanas": {
            "min": 5,
            "max": 9
          }
        },
        {
          "key": "avanzado",
          "nombre": {
            "es": "Avanzado",
            "en": "Advanced"
          },
          "compra": {
            "setupCOP": 189000000,
            "mantenimientoCOP": 16200000
          },
          "saas": {
            "setupCOP": 12900000,
            "monthlyCOP": 4990000
          },
          "implementacionSemanas": {
            "min": 9,
            "max": 14
          }
        },
        {
          "key": "enterprise",
          "nombre": {
            "es": "Enterprise",
            "en": "Enterprise"
          },
          "compra": {
            "setupCOP": 405000000,
            "mantenimientoCOP": 31500000
          },
          "saas": {
            "setupCOP": 0,
            "monthlyCOP": 8890000
          },
          "implementacionSemanas": {
            "min": 12,
            "max": 20
          }
        }
      ]
    },
    {
      "slug": "cms-headless",
      "demoSlug": "gestor-contenido",
      "nombre": {
        "es": "CMS headless",
        "en": "Headless CMS"
      },
      "tiers": [
        {
          "key": "basico",
          "nombre": {
            "es": "Básico",
            "en": "Basic"
          },
          "compra": {
            "setupCOP": 35000000,
            "mantenimientoCOP": 3200000
          },
          "saas": {
            "setupCOP": 2900000,
            "monthlyCOP": 1190000
          },
          "implementacionSemanas": {
            "min": 2,
            "max": 5
          }
        },
        {
          "key": "profesional",
          "nombre": {
            "es": "Profesional",
            "en": "Professional"
          },
          "compra": {
            "setupCOP": 90000000,
            "mantenimientoCOP": 8000000
          },
          "saas": {
            "setupCOP": 6900000,
            "monthlyCOP": 2890000
          },
          "implementacionSemanas": {
            "min": 5,
            "max": 9
          }
        },
        {
          "key": "avanzado",
          "nombre": {
            "es": "Avanzado",
            "en": "Advanced"
          },
          "compra": {
            "setupCOP": 210000000,
            "mantenimientoCOP": 18000000
          },
          "saas": {
            "setupCOP": 12900000,
            "monthlyCOP": 5490000
          },
          "implementacionSemanas": {
            "min": 9,
            "max": 14
          }
        },
        {
          "key": "enterprise",
          "nombre": {
            "es": "Enterprise",
            "en": "Enterprise"
          },
          "compra": {
            "setupCOP": 450000000,
            "mantenimientoCOP": 35000000
          },
          "saas": {
            "setupCOP": 0,
            "monthlyCOP": 9890000
          },
          "implementacionSemanas": {
            "min": 12,
            "max": 20
          }
        }
      ]
    },
    {
      "slug": "gestion-proyectos",
      "demoSlug": "control-proyectos",
      "nombre": {
        "es": "Gestión de proyectos",
        "en": "Project management"
      },
      "tiers": [
        {
          "key": "basico",
          "nombre": {
            "es": "Básico",
            "en": "Basic"
          },
          "compra": {
            "setupCOP": 35000000,
            "mantenimientoCOP": 3200000
          },
          "saas": {
            "setupCOP": 2900000,
            "monthlyCOP": 1190000
          },
          "implementacionSemanas": {
            "min": 2,
            "max": 5
          }
        },
        {
          "key": "profesional",
          "nombre": {
            "es": "Profesional",
            "en": "Professional"
          },
          "compra": {
            "setupCOP": 90000000,
            "mantenimientoCOP": 8000000
          },
          "saas": {
            "setupCOP": 6900000,
            "monthlyCOP": 2890000
          },
          "implementacionSemanas": {
            "min": 5,
            "max": 9
          }
        },
        {
          "key": "avanzado",
          "nombre": {
            "es": "Avanzado",
            "en": "Advanced"
          },
          "compra": {
            "setupCOP": 210000000,
            "mantenimientoCOP": 18000000
          },
          "saas": {
            "setupCOP": 12900000,
            "monthlyCOP": 5490000
          },
          "implementacionSemanas": {
            "min": 9,
            "max": 14
          }
        },
        {
          "key": "enterprise",
          "nombre": {
            "es": "Enterprise",
            "en": "Enterprise"
          },
          "compra": {
            "setupCOP": 450000000,
            "mantenimientoCOP": 35000000
          },
          "saas": {
            "setupCOP": 0,
            "monthlyCOP": 9890000
          },
          "implementacionSemanas": {
            "min": 12,
            "max": 20
          }
        }
      ]
    },
    {
      "slug": "crm-ia",
      "demoSlug": "crm-ia",
      "nombre": {
        "es": "CRM con IA",
        "en": "AI-powered CRM"
      },
      "tiers": [
        {
          "key": "basico",
          "nombre": {
            "es": "Básico",
            "en": "Basic"
          },
          "compra": {
            "setupCOP": 56000000,
            "mantenimientoCOP": 5100000
          },
          "saas": {
            "setupCOP": 2900000,
            "monthlyCOP": 1890000
          },
          "implementacionSemanas": {
            "min": 2,
            "max": 5
          }
        },
        {
          "key": "profesional",
          "nombre": {
            "es": "Profesional",
            "en": "Professional"
          },
          "compra": {
            "setupCOP": 144000000,
            "mantenimientoCOP": 12800000
          },
          "saas": {
            "setupCOP": 6900000,
            "monthlyCOP": 4590000
          },
          "implementacionSemanas": {
            "min": 5,
            "max": 9
          }
        },
        {
          "key": "avanzado",
          "nombre": {
            "es": "Avanzado",
            "en": "Advanced"
          },
          "compra": {
            "setupCOP": 336000000,
            "mantenimientoCOP": 28800000
          },
          "saas": {
            "setupCOP": 12900000,
            "monthlyCOP": 8790000
          },
          "implementacionSemanas": {
            "min": 9,
            "max": 14
          }
        },
        {
          "key": "enterprise",
          "nombre": {
            "es": "Enterprise",
            "en": "Enterprise"
          },
          "compra": {
            "setupCOP": 720000000,
            "mantenimientoCOP": 56000000
          },
          "saas": {
            "setupCOP": 0,
            "monthlyCOP": 15790000
          },
          "implementacionSemanas": {
            "min": 12,
            "max": 20
          }
        }
      ]
    },
    {
      "slug": "erp-modular",
      "demoSlug": "erp",
      "nombre": {
        "es": "ERP modular",
        "en": "Modular ERP"
      },
      "tiers": [
        {
          "key": "basico",
          "nombre": {
            "es": "Básico",
            "en": "Basic"
          },
          "compra": {
            "setupCOP": 60000000,
            "mantenimientoCOP": 5400000
          },
          "saas": {
            "setupCOP": 2900000,
            "monthlyCOP": 1990000
          },
          "implementacionSemanas": {
            "min": 2,
            "max": 5
          }
        },
        {
          "key": "profesional",
          "nombre": {
            "es": "Profesional",
            "en": "Professional"
          },
          "compra": {
            "setupCOP": 153000000,
            "mantenimientoCOP": 13600000
          },
          "saas": {
            "setupCOP": 6900000,
            "monthlyCOP": 4890000
          },
          "implementacionSemanas": {
            "min": 5,
            "max": 9
          }
        },
        {
          "key": "avanzado",
          "nombre": {
            "es": "Avanzado",
            "en": "Advanced"
          },
          "compra": {
            "setupCOP": 357000000,
            "mantenimientoCOP": 30600000
          },
          "saas": {
            "setupCOP": 12900000,
            "monthlyCOP": 9290000
          },
          "implementacionSemanas": {
            "min": 9,
            "max": 14
          }
        },
        {
          "key": "enterprise",
          "nombre": {
            "es": "Enterprise",
            "en": "Enterprise"
          },
          "compra": {
            "setupCOP": 765000000,
            "mantenimientoCOP": 59500000
          },
          "saas": {
            "setupCOP": 0,
            "monthlyCOP": 16790000
          },
          "implementacionSemanas": {
            "min": 12,
            "max": 20
          }
        }
      ]
    },
    {
      "slug": "helpdesk-ia",
      "demoSlug": "helpdesk-ia",
      "nombre": {
        "es": "Helpdesk con IA",
        "en": "AI-powered Helpdesk"
      },
      "tiers": [
        {
          "key": "basico",
          "nombre": {
            "es": "Básico",
            "en": "Basic"
          },
          "compra": {
            "setupCOP": 46000000,
            "mantenimientoCOP": 4200000
          },
          "saas": {
            "setupCOP": 2900000,
            "monthlyCOP": 1590000
          },
          "implementacionSemanas": {
            "min": 2,
            "max": 5
          }
        },
        {
          "key": "profesional",
          "nombre": {
            "es": "Profesional",
            "en": "Professional"
          },
          "compra": {
            "setupCOP": 117000000,
            "mantenimientoCOP": 10400000
          },
          "saas": {
            "setupCOP": 6900000,
            "monthlyCOP": 3790000
          },
          "implementacionSemanas": {
            "min": 5,
            "max": 9
          }
        },
        {
          "key": "avanzado",
          "nombre": {
            "es": "Avanzado",
            "en": "Advanced"
          },
          "compra": {
            "setupCOP": 273000000,
            "mantenimientoCOP": 23400000
          },
          "saas": {
            "setupCOP": 12900000,
            "monthlyCOP": 7090000
          },
          "implementacionSemanas": {
            "min": 9,
            "max": 14
          }
        },
        {
          "key": "enterprise",
          "nombre": {
            "es": "Enterprise",
            "en": "Enterprise"
          },
          "compra": {
            "setupCOP": 585000000,
            "mantenimientoCOP": 45500000
          },
          "saas": {
            "setupCOP": 0,
            "monthlyCOP": 12890000
          },
          "implementacionSemanas": {
            "min": 12,
            "max": 20
          }
        }
      ]
    },
    {
      "slug": "lms-elearning",
      "demoSlug": "lms",
      "nombre": {
        "es": "LMS de e-learning",
        "en": "E-learning LMS"
      },
      "tiers": [
        {
          "key": "basico",
          "nombre": {
            "es": "Básico",
            "en": "Basic"
          },
          "compra": {
            "setupCOP": 46000000,
            "mantenimientoCOP": 4200000
          },
          "saas": {
            "setupCOP": 2900000,
            "monthlyCOP": 1590000
          },
          "implementacionSemanas": {
            "min": 2,
            "max": 5
          }
        },
        {
          "key": "profesional",
          "nombre": {
            "es": "Profesional",
            "en": "Professional"
          },
          "compra": {
            "setupCOP": 117000000,
            "mantenimientoCOP": 10400000
          },
          "saas": {
            "setupCOP": 6900000,
            "monthlyCOP": 3790000
          },
          "implementacionSemanas": {
            "min": 5,
            "max": 9
          }
        },
        {
          "key": "avanzado",
          "nombre": {
            "es": "Avanzado",
            "en": "Advanced"
          },
          "compra": {
            "setupCOP": 273000000,
            "mantenimientoCOP": 23400000
          },
          "saas": {
            "setupCOP": 12900000,
            "monthlyCOP": 7090000
          },
          "implementacionSemanas": {
            "min": 9,
            "max": 14
          }
        },
        {
          "key": "enterprise",
          "nombre": {
            "es": "Enterprise",
            "en": "Enterprise"
          },
          "compra": {
            "setupCOP": 585000000,
            "mantenimientoCOP": 45500000
          },
          "saas": {
            "setupCOP": 0,
            "monthlyCOP": 12890000
          },
          "implementacionSemanas": {
            "min": 12,
            "max": 20
          }
        }
      ]
    },
    {
      "slug": "telemedicina",
      "demoSlug": "telemedicina",
      "nombre": {
        "es": "Plataforma de telemedicina",
        "en": "Telemedicine platform"
      },
      "tiers": [
        {
          "key": "basico",
          "nombre": {
            "es": "Básico",
            "en": "Basic"
          },
          "compra": {
            "setupCOP": 56000000,
            "mantenimientoCOP": 5100000
          },
          "saas": {
            "setupCOP": 2900000,
            "monthlyCOP": 1890000
          },
          "implementacionSemanas": {
            "min": 2,
            "max": 5
          }
        },
        {
          "key": "profesional",
          "nombre": {
            "es": "Profesional",
            "en": "Professional"
          },
          "compra": {
            "setupCOP": 144000000,
            "mantenimientoCOP": 12800000
          },
          "saas": {
            "setupCOP": 6900000,
            "monthlyCOP": 4590000
          },
          "implementacionSemanas": {
            "min": 5,
            "max": 9
          }
        },
        {
          "key": "avanzado",
          "nombre": {
            "es": "Avanzado",
            "en": "Advanced"
          },
          "compra": {
            "setupCOP": 336000000,
            "mantenimientoCOP": 28800000
          },
          "saas": {
            "setupCOP": 12900000,
            "monthlyCOP": 8790000
          },
          "implementacionSemanas": {
            "min": 9,
            "max": 14
          }
        },
        {
          "key": "enterprise",
          "nombre": {
            "es": "Enterprise",
            "en": "Enterprise"
          },
          "compra": {
            "setupCOP": 720000000,
            "mantenimientoCOP": 56000000
          },
          "saas": {
            "setupCOP": 0,
            "monthlyCOP": 15790000
          },
          "implementacionSemanas": {
            "min": 12,
            "max": 20
          }
        }
      ]
    },
    {
      "slug": "facturacion-electronica",
      "demoSlug": "facturacion-electronica",
      "nombre": {
        "es": "Facturación electrónica",
        "en": "Electronic invoicing"
      },
      "tiers": [
        {
          "key": "basico",
          "nombre": {
            "es": "Básico",
            "en": "Basic"
          },
          "compra": {
            "setupCOP": 49000000,
            "mantenimientoCOP": 4500000
          },
          "saas": {
            "setupCOP": 2900000,
            "monthlyCOP": 1690000
          },
          "implementacionSemanas": {
            "min": 2,
            "max": 5
          }
        },
        {
          "key": "profesional",
          "nombre": {
            "es": "Profesional",
            "en": "Professional"
          },
          "compra": {
            "setupCOP": 126000000,
            "mantenimientoCOP": 11200000
          },
          "saas": {
            "setupCOP": 6900000,
            "monthlyCOP": 4090000
          },
          "implementacionSemanas": {
            "min": 5,
            "max": 9
          }
        },
        {
          "key": "avanzado",
          "nombre": {
            "es": "Avanzado",
            "en": "Advanced"
          },
          "compra": {
            "setupCOP": 294000000,
            "mantenimientoCOP": 25200000
          },
          "saas": {
            "setupCOP": 12900000,
            "monthlyCOP": 7690000
          },
          "implementacionSemanas": {
            "min": 9,
            "max": 14
          }
        },
        {
          "key": "enterprise",
          "nombre": {
            "es": "Enterprise",
            "en": "Enterprise"
          },
          "compra": {
            "setupCOP": 630000000,
            "mantenimientoCOP": 49000000
          },
          "saas": {
            "setupCOP": 0,
            "monthlyCOP": 13890000
          },
          "implementacionSemanas": {
            "min": 12,
            "max": 20
          }
        }
      ]
    },
    {
      "slug": "wms-logistica",
      "demoSlug": "wms-logistica",
      "nombre": {
        "es": "WMS logística",
        "en": "WMS logistics"
      },
      "tiers": [
        {
          "key": "basico",
          "nombre": {
            "es": "Básico",
            "en": "Basic"
          },
          "compra": {
            "setupCOP": 56000000,
            "mantenimientoCOP": 5100000
          },
          "saas": {
            "setupCOP": 2900000,
            "monthlyCOP": 1890000
          },
          "implementacionSemanas": {
            "min": 2,
            "max": 5
          }
        },
        {
          "key": "profesional",
          "nombre": {
            "es": "Profesional",
            "en": "Professional"
          },
          "compra": {
            "setupCOP": 144000000,
            "mantenimientoCOP": 12800000
          },
          "saas": {
            "setupCOP": 6900000,
            "monthlyCOP": 4590000
          },
          "implementacionSemanas": {
            "min": 5,
            "max": 9
          }
        },
        {
          "key": "avanzado",
          "nombre": {
            "es": "Avanzado",
            "en": "Advanced"
          },
          "compra": {
            "setupCOP": 336000000,
            "mantenimientoCOP": 28800000
          },
          "saas": {
            "setupCOP": 12900000,
            "monthlyCOP": 8790000
          },
          "implementacionSemanas": {
            "min": 9,
            "max": 14
          }
        },
        {
          "key": "enterprise",
          "nombre": {
            "es": "Enterprise",
            "en": "Enterprise"
          },
          "compra": {
            "setupCOP": 720000000,
            "mantenimientoCOP": 56000000
          },
          "saas": {
            "setupCOP": 0,
            "monthlyCOP": 15790000
          },
          "implementacionSemanas": {
            "min": 12,
            "max": 20
          }
        }
      ]
    },
    {
      "slug": "pos-retail",
      "demoSlug": "pos",
      "nombre": {
        "es": "POS retail",
        "en": "Retail POS"
      },
      "tiers": [
        {
          "key": "basico",
          "nombre": {
            "es": "Básico",
            "en": "Basic"
          },
          "compra": {
            "setupCOP": 46000000,
            "mantenimientoCOP": 4200000
          },
          "saas": {
            "setupCOP": 2900000,
            "monthlyCOP": 1590000
          },
          "implementacionSemanas": {
            "min": 2,
            "max": 5
          }
        },
        {
          "key": "profesional",
          "nombre": {
            "es": "Profesional",
            "en": "Professional"
          },
          "compra": {
            "setupCOP": 117000000,
            "mantenimientoCOP": 10400000
          },
          "saas": {
            "setupCOP": 6900000,
            "monthlyCOP": 3790000
          },
          "implementacionSemanas": {
            "min": 5,
            "max": 9
          }
        },
        {
          "key": "avanzado",
          "nombre": {
            "es": "Avanzado",
            "en": "Advanced"
          },
          "compra": {
            "setupCOP": 273000000,
            "mantenimientoCOP": 23400000
          },
          "saas": {
            "setupCOP": 12900000,
            "monthlyCOP": 7090000
          },
          "implementacionSemanas": {
            "min": 9,
            "max": 14
          }
        },
        {
          "key": "enterprise",
          "nombre": {
            "es": "Enterprise",
            "en": "Enterprise"
          },
          "compra": {
            "setupCOP": 585000000,
            "mantenimientoCOP": 45500000
          },
          "saas": {
            "setupCOP": 0,
            "monthlyCOP": 12890000
          },
          "implementacionSemanas": {
            "min": 12,
            "max": 20
          }
        }
      ]
    },
    {
      "slug": "hrms",
      "demoSlug": "hrms",
      "nombre": {
        "es": "HRMS",
        "en": "HRMS"
      },
      "tiers": [
        {
          "key": "basico",
          "nombre": {
            "es": "Básico",
            "en": "Basic"
          },
          "compra": {
            "setupCOP": 53000000,
            "mantenimientoCOP": 4800000
          },
          "saas": {
            "setupCOP": 2900000,
            "monthlyCOP": 1790000
          },
          "implementacionSemanas": {
            "min": 2,
            "max": 5
          }
        },
        {
          "key": "profesional",
          "nombre": {
            "es": "Profesional",
            "en": "Professional"
          },
          "compra": {
            "setupCOP": 135000000,
            "mantenimientoCOP": 12000000
          },
          "saas": {
            "setupCOP": 6900000,
            "monthlyCOP": 4290000
          },
          "implementacionSemanas": {
            "min": 5,
            "max": 9
          }
        },
        {
          "key": "avanzado",
          "nombre": {
            "es": "Avanzado",
            "en": "Advanced"
          },
          "compra": {
            "setupCOP": 315000000,
            "mantenimientoCOP": 27000000
          },
          "saas": {
            "setupCOP": 12900000,
            "monthlyCOP": 8190000
          },
          "implementacionSemanas": {
            "min": 9,
            "max": 14
          }
        },
        {
          "key": "enterprise",
          "nombre": {
            "es": "Enterprise",
            "en": "Enterprise"
          },
          "compra": {
            "setupCOP": 675000000,
            "mantenimientoCOP": 52500000
          },
          "saas": {
            "setupCOP": 0,
            "monthlyCOP": 14790000
          },
          "implementacionSemanas": {
            "min": 12,
            "max": 20
          }
        }
      ]
    },
    {
      "slug": "automatizacion-workflows",
      "demoSlug": "automatizacion",
      "nombre": {
        "es": "Automatización de workflows",
        "en": "Workflow automation"
      },
      "tiers": [
        {
          "key": "basico",
          "nombre": {
            "es": "Básico",
            "en": "Basic"
          },
          "compra": {
            "setupCOP": 49000000,
            "mantenimientoCOP": 4500000
          },
          "saas": {
            "setupCOP": 2900000,
            "monthlyCOP": 1690000
          },
          "implementacionSemanas": {
            "min": 2,
            "max": 5
          }
        },
        {
          "key": "profesional",
          "nombre": {
            "es": "Profesional",
            "en": "Professional"
          },
          "compra": {
            "setupCOP": 126000000,
            "mantenimientoCOP": 11200000
          },
          "saas": {
            "setupCOP": 6900000,
            "monthlyCOP": 4090000
          },
          "implementacionSemanas": {
            "min": 5,
            "max": 9
          }
        },
        {
          "key": "avanzado",
          "nombre": {
            "es": "Avanzado",
            "en": "Advanced"
          },
          "compra": {
            "setupCOP": 294000000,
            "mantenimientoCOP": 25200000
          },
          "saas": {
            "setupCOP": 12900000,
            "monthlyCOP": 7690000
          },
          "implementacionSemanas": {
            "min": 9,
            "max": 14
          }
        },
        {
          "key": "enterprise",
          "nombre": {
            "es": "Enterprise",
            "en": "Enterprise"
          },
          "compra": {
            "setupCOP": 630000000,
            "mantenimientoCOP": 49000000
          },
          "saas": {
            "setupCOP": 0,
            "monthlyCOP": 13890000
          },
          "implementacionSemanas": {
            "min": 12,
            "max": 20
          }
        }
      ]
    },
    {
      "slug": "saas-multi-tenant",
      "demoSlug": "saas-boilerplate",
      "nombre": {
        "es": "Plataforma SaaS multi-tenant",
        "en": "Multi-tenant SaaS platform"
      },
      "tiers": [
        {
          "key": "basico",
          "nombre": {
            "es": "Básico",
            "en": "Basic"
          },
          "compra": {
            "setupCOP": 60000000,
            "mantenimientoCOP": 5400000
          },
          "saas": {
            "setupCOP": 2900000,
            "monthlyCOP": 1990000
          },
          "implementacionSemanas": {
            "min": 2,
            "max": 5
          }
        },
        {
          "key": "profesional",
          "nombre": {
            "es": "Profesional",
            "en": "Professional"
          },
          "compra": {
            "setupCOP": 153000000,
            "mantenimientoCOP": 13600000
          },
          "saas": {
            "setupCOP": 6900000,
            "monthlyCOP": 4890000
          },
          "implementacionSemanas": {
            "min": 5,
            "max": 9
          }
        },
        {
          "key": "avanzado",
          "nombre": {
            "es": "Avanzado",
            "en": "Advanced"
          },
          "compra": {
            "setupCOP": 357000000,
            "mantenimientoCOP": 30600000
          },
          "saas": {
            "setupCOP": 12900000,
            "monthlyCOP": 9290000
          },
          "implementacionSemanas": {
            "min": 9,
            "max": 14
          }
        },
        {
          "key": "enterprise",
          "nombre": {
            "es": "Enterprise",
            "en": "Enterprise"
          },
          "compra": {
            "setupCOP": 765000000,
            "mantenimientoCOP": 59500000
          },
          "saas": {
            "setupCOP": 0,
            "monthlyCOP": 16790000
          },
          "implementacionSemanas": {
            "min": 12,
            "max": 20
          }
        }
      ]
    },
    {
      "slug": "voice-ai-callcenter",
      "demoSlug": "voice-ai",
      "nombre": {
        "es": "Voice AI para call center",
        "en": "Voice AI for call centers"
      },
      "tiers": [
        {
          "key": "basico",
          "nombre": {
            "es": "Básico",
            "en": "Basic"
          },
          "compra": {
            "setupCOP": 53000000,
            "mantenimientoCOP": 4800000
          },
          "saas": {
            "setupCOP": 2900000,
            "monthlyCOP": 1790000
          },
          "implementacionSemanas": {
            "min": 2,
            "max": 5
          }
        },
        {
          "key": "profesional",
          "nombre": {
            "es": "Profesional",
            "en": "Professional"
          },
          "compra": {
            "setupCOP": 135000000,
            "mantenimientoCOP": 12000000
          },
          "saas": {
            "setupCOP": 6900000,
            "monthlyCOP": 4290000
          },
          "implementacionSemanas": {
            "min": 5,
            "max": 9
          }
        },
        {
          "key": "avanzado",
          "nombre": {
            "es": "Avanzado",
            "en": "Advanced"
          },
          "compra": {
            "setupCOP": 315000000,
            "mantenimientoCOP": 27000000
          },
          "saas": {
            "setupCOP": 12900000,
            "monthlyCOP": 8190000
          },
          "implementacionSemanas": {
            "min": 9,
            "max": 14
          }
        },
        {
          "key": "enterprise",
          "nombre": {
            "es": "Enterprise",
            "en": "Enterprise"
          },
          "compra": {
            "setupCOP": 675000000,
            "mantenimientoCOP": 52500000
          },
          "saas": {
            "setupCOP": 0,
            "monthlyCOP": 14790000
          },
          "implementacionSemanas": {
            "min": 12,
            "max": 20
          }
        }
      ]
    },
    {
      "slug": "firma-electronica",
      "demoSlug": "firma-electronica",
      "nombre": {
        "es": "Firma electrónica",
        "en": "E-signature"
      },
      "tiers": [
        {
          "key": "basico",
          "nombre": {
            "es": "Básico",
            "en": "Basic"
          },
          "compra": {
            "setupCOP": 35000000,
            "mantenimientoCOP": 3200000
          },
          "saas": {
            "setupCOP": 2900000,
            "monthlyCOP": 1190000
          },
          "implementacionSemanas": {
            "min": 2,
            "max": 5
          }
        },
        {
          "key": "profesional",
          "nombre": {
            "es": "Profesional",
            "en": "Professional"
          },
          "compra": {
            "setupCOP": 90000000,
            "mantenimientoCOP": 8000000
          },
          "saas": {
            "setupCOP": 6900000,
            "monthlyCOP": 2890000
          },
          "implementacionSemanas": {
            "min": 5,
            "max": 9
          }
        },
        {
          "key": "avanzado",
          "nombre": {
            "es": "Avanzado",
            "en": "Advanced"
          },
          "compra": {
            "setupCOP": 210000000,
            "mantenimientoCOP": 18000000
          },
          "saas": {
            "setupCOP": 12900000,
            "monthlyCOP": 5490000
          },
          "implementacionSemanas": {
            "min": 9,
            "max": 14
          }
        },
        {
          "key": "enterprise",
          "nombre": {
            "es": "Enterprise",
            "en": "Enterprise"
          },
          "compra": {
            "setupCOP": 450000000,
            "mantenimientoCOP": 35000000
          },
          "saas": {
            "setupCOP": 0,
            "monthlyCOP": 9890000
          },
          "implementacionSemanas": {
            "min": 12,
            "max": 20
          }
        }
      ]
    },
    {
      "slug": "scraping-extraccion",
      "demoSlug": "scraping",
      "nombre": {
        "es": "Scraping y extracción de datos",
        "en": "Scraping and data extraction"
      },
      "tiers": [
        {
          "key": "basico",
          "nombre": {
            "es": "Básico",
            "en": "Basic"
          },
          "compra": {
            "setupCOP": 35000000,
            "mantenimientoCOP": 3200000
          },
          "saas": {
            "setupCOP": 2900000,
            "monthlyCOP": 1190000
          },
          "implementacionSemanas": {
            "min": 2,
            "max": 5
          }
        },
        {
          "key": "profesional",
          "nombre": {
            "es": "Profesional",
            "en": "Professional"
          },
          "compra": {
            "setupCOP": 90000000,
            "mantenimientoCOP": 8000000
          },
          "saas": {
            "setupCOP": 6900000,
            "monthlyCOP": 2890000
          },
          "implementacionSemanas": {
            "min": 5,
            "max": 9
          }
        },
        {
          "key": "avanzado",
          "nombre": {
            "es": "Avanzado",
            "en": "Advanced"
          },
          "compra": {
            "setupCOP": 210000000,
            "mantenimientoCOP": 18000000
          },
          "saas": {
            "setupCOP": 12900000,
            "monthlyCOP": 5490000
          },
          "implementacionSemanas": {
            "min": 9,
            "max": 14
          }
        },
        {
          "key": "enterprise",
          "nombre": {
            "es": "Enterprise",
            "en": "Enterprise"
          },
          "compra": {
            "setupCOP": 450000000,
            "mantenimientoCOP": 35000000
          },
          "saas": {
            "setupCOP": 0,
            "monthlyCOP": 9890000
          },
          "implementacionSemanas": {
            "min": 12,
            "max": 20
          }
        }
      ]
    },
    {
      "slug": "code-review-ia",
      "demoSlug": "code-review-ia",
      "nombre": {
        "es": "Code review con IA",
        "en": "AI code review"
      },
      "tiers": [
        {
          "key": "basico",
          "nombre": {
            "es": "Básico",
            "en": "Basic"
          },
          "compra": {
            "setupCOP": 35000000,
            "mantenimientoCOP": 3200000
          },
          "saas": {
            "setupCOP": 2900000,
            "monthlyCOP": 1190000
          },
          "implementacionSemanas": {
            "min": 2,
            "max": 5
          }
        },
        {
          "key": "profesional",
          "nombre": {
            "es": "Profesional",
            "en": "Professional"
          },
          "compra": {
            "setupCOP": 90000000,
            "mantenimientoCOP": 8000000
          },
          "saas": {
            "setupCOP": 6900000,
            "monthlyCOP": 2890000
          },
          "implementacionSemanas": {
            "min": 5,
            "max": 9
          }
        },
        {
          "key": "avanzado",
          "nombre": {
            "es": "Avanzado",
            "en": "Advanced"
          },
          "compra": {
            "setupCOP": 210000000,
            "mantenimientoCOP": 18000000
          },
          "saas": {
            "setupCOP": 12900000,
            "monthlyCOP": 5490000
          },
          "implementacionSemanas": {
            "min": 9,
            "max": 14
          }
        },
        {
          "key": "enterprise",
          "nombre": {
            "es": "Enterprise",
            "en": "Enterprise"
          },
          "compra": {
            "setupCOP": 450000000,
            "mantenimientoCOP": 35000000
          },
          "saas": {
            "setupCOP": 0,
            "monthlyCOP": 9890000
          },
          "implementacionSemanas": {
            "min": 12,
            "max": 20
          }
        }
      ]
    },
    {
      "slug": "moderacion-contenido",
      "demoSlug": "moderacion-contenido",
      "nombre": {
        "es": "Moderación de contenido",
        "en": "Content moderation"
      },
      "tiers": [
        {
          "key": "basico",
          "nombre": {
            "es": "Básico",
            "en": "Basic"
          },
          "compra": {
            "setupCOP": 46000000,
            "mantenimientoCOP": 4200000
          },
          "saas": {
            "setupCOP": 2900000,
            "monthlyCOP": 1590000
          },
          "implementacionSemanas": {
            "min": 2,
            "max": 5
          }
        },
        {
          "key": "profesional",
          "nombre": {
            "es": "Profesional",
            "en": "Professional"
          },
          "compra": {
            "setupCOP": 117000000,
            "mantenimientoCOP": 10400000
          },
          "saas": {
            "setupCOP": 6900000,
            "monthlyCOP": 3790000
          },
          "implementacionSemanas": {
            "min": 5,
            "max": 9
          }
        },
        {
          "key": "avanzado",
          "nombre": {
            "es": "Avanzado",
            "en": "Advanced"
          },
          "compra": {
            "setupCOP": 273000000,
            "mantenimientoCOP": 23400000
          },
          "saas": {
            "setupCOP": 12900000,
            "monthlyCOP": 7090000
          },
          "implementacionSemanas": {
            "min": 9,
            "max": 14
          }
        },
        {
          "key": "enterprise",
          "nombre": {
            "es": "Enterprise",
            "en": "Enterprise"
          },
          "compra": {
            "setupCOP": 585000000,
            "mantenimientoCOP": 45500000
          },
          "saas": {
            "setupCOP": 0,
            "monthlyCOP": 12890000
          },
          "implementacionSemanas": {
            "min": 12,
            "max": 20
          }
        }
      ]
    },
    {
      "slug": "app-delivery",
      "demoSlug": "delivery",
      "nombre": {
        "es": "App de delivery",
        "en": "Delivery app"
      },
      "tiers": [
        {
          "key": "basico",
          "nombre": {
            "es": "Básico",
            "en": "Basic"
          },
          "compra": {
            "setupCOP": 60000000,
            "mantenimientoCOP": 5400000
          },
          "saas": {
            "setupCOP": 2900000,
            "monthlyCOP": 1990000
          },
          "implementacionSemanas": {
            "min": 2,
            "max": 5
          }
        },
        {
          "key": "profesional",
          "nombre": {
            "es": "Profesional",
            "en": "Professional"
          },
          "compra": {
            "setupCOP": 153000000,
            "mantenimientoCOP": 13600000
          },
          "saas": {
            "setupCOP": 6900000,
            "monthlyCOP": 4890000
          },
          "implementacionSemanas": {
            "min": 5,
            "max": 9
          }
        },
        {
          "key": "avanzado",
          "nombre": {
            "es": "Avanzado",
            "en": "Advanced"
          },
          "compra": {
            "setupCOP": 357000000,
            "mantenimientoCOP": 30600000
          },
          "saas": {
            "setupCOP": 12900000,
            "monthlyCOP": 9290000
          },
          "implementacionSemanas": {
            "min": 9,
            "max": 14
          }
        },
        {
          "key": "enterprise",
          "nombre": {
            "es": "Enterprise",
            "en": "Enterprise"
          },
          "compra": {
            "setupCOP": 765000000,
            "mantenimientoCOP": 59500000
          },
          "saas": {
            "setupCOP": 0,
            "monthlyCOP": 16790000
          },
          "implementacionSemanas": {
            "min": 12,
            "max": 20
          }
        }
      ]
    },
    {
      "slug": "loyalty-fidelizacion",
      "demoSlug": "loyalty",
      "nombre": {
        "es": "Programa de fidelización",
        "en": "Loyalty program"
      },
      "tiers": [
        {
          "key": "basico",
          "nombre": {
            "es": "Básico",
            "en": "Basic"
          },
          "compra": {
            "setupCOP": 35000000,
            "mantenimientoCOP": 3200000
          },
          "saas": {
            "setupCOP": 2900000,
            "monthlyCOP": 1190000
          },
          "implementacionSemanas": {
            "min": 2,
            "max": 5
          }
        },
        {
          "key": "profesional",
          "nombre": {
            "es": "Profesional",
            "en": "Professional"
          },
          "compra": {
            "setupCOP": 90000000,
            "mantenimientoCOP": 8000000
          },
          "saas": {
            "setupCOP": 6900000,
            "monthlyCOP": 2890000
          },
          "implementacionSemanas": {
            "min": 5,
            "max": 9
          }
        },
        {
          "key": "avanzado",
          "nombre": {
            "es": "Avanzado",
            "en": "Advanced"
          },
          "compra": {
            "setupCOP": 210000000,
            "mantenimientoCOP": 18000000
          },
          "saas": {
            "setupCOP": 12900000,
            "monthlyCOP": 5490000
          },
          "implementacionSemanas": {
            "min": 9,
            "max": 14
          }
        },
        {
          "key": "enterprise",
          "nombre": {
            "es": "Enterprise",
            "en": "Enterprise"
          },
          "compra": {
            "setupCOP": 450000000,
            "mantenimientoCOP": 35000000
          },
          "saas": {
            "setupCOP": 0,
            "monthlyCOP": 9890000
          },
          "implementacionSemanas": {
            "min": 12,
            "max": 20
          }
        }
      ]
    },
    {
      "slug": "qa-automatizado-ia",
      "demoSlug": "",
      "nombre": {
        "es": "QA automatizado con IA",
        "en": "AI-driven QA automation"
      },
      "tiers": [
        {
          "key": "basico",
          "nombre": {
            "es": "Básico",
            "en": "Basic"
          },
          "compra": {
            "setupCOP": 35000000,
            "mantenimientoCOP": 3200000
          },
          "saas": {
            "setupCOP": 2900000,
            "monthlyCOP": 1190000
          },
          "implementacionSemanas": {
            "min": 2,
            "max": 5
          }
        },
        {
          "key": "profesional",
          "nombre": {
            "es": "Profesional",
            "en": "Professional"
          },
          "compra": {
            "setupCOP": 90000000,
            "mantenimientoCOP": 8000000
          },
          "saas": {
            "setupCOP": 6900000,
            "monthlyCOP": 2890000
          },
          "implementacionSemanas": {
            "min": 5,
            "max": 9
          }
        },
        {
          "key": "avanzado",
          "nombre": {
            "es": "Avanzado",
            "en": "Advanced"
          },
          "compra": {
            "setupCOP": 210000000,
            "mantenimientoCOP": 18000000
          },
          "saas": {
            "setupCOP": 12900000,
            "monthlyCOP": 5490000
          },
          "implementacionSemanas": {
            "min": 9,
            "max": 14
          }
        },
        {
          "key": "enterprise",
          "nombre": {
            "es": "Enterprise",
            "en": "Enterprise"
          },
          "compra": {
            "setupCOP": 450000000,
            "mantenimientoCOP": 35000000
          },
          "saas": {
            "setupCOP": 0,
            "monthlyCOP": 9890000
          },
          "implementacionSemanas": {
            "min": 12,
            "max": 20
          }
        }
      ]
    },
    {
      "slug": "vpn-empresarial",
      "demoSlug": "",
      "nombre": {
        "es": "VPN empresarial",
        "en": "Enterprise VPN"
      },
      "tiers": [
        {
          "key": "basico",
          "nombre": {
            "es": "Básico",
            "en": "Basic"
          },
          "compra": {
            "setupCOP": 21000000,
            "mantenimientoCOP": 1900000
          },
          "saas": {
            "setupCOP": 2900000,
            "monthlyCOP": 690000
          },
          "implementacionSemanas": {
            "min": 2,
            "max": 5
          }
        },
        {
          "key": "profesional",
          "nombre": {
            "es": "Profesional",
            "en": "Professional"
          },
          "compra": {
            "setupCOP": 54000000,
            "mantenimientoCOP": 4800000
          },
          "saas": {
            "setupCOP": 6900000,
            "monthlyCOP": 1690000
          },
          "implementacionSemanas": {
            "min": 5,
            "max": 9
          }
        },
        {
          "key": "avanzado",
          "nombre": {
            "es": "Avanzado",
            "en": "Advanced"
          },
          "compra": {
            "setupCOP": 126000000,
            "mantenimientoCOP": 10800000
          },
          "saas": {
            "setupCOP": 12900000,
            "monthlyCOP": 3290000
          },
          "implementacionSemanas": {
            "min": 9,
            "max": 14
          }
        },
        {
          "key": "enterprise",
          "nombre": {
            "es": "Enterprise",
            "en": "Enterprise"
          },
          "compra": {
            "setupCOP": 270000000,
            "mantenimientoCOP": 21000000
          },
          "saas": {
            "setupCOP": 0,
            "monthlyCOP": 5890000
          },
          "implementacionSemanas": {
            "min": 12,
            "max": 20
          }
        }
      ]
    }
  ]
};
