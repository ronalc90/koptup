#!/usr/bin/env python3
"""
Regenera los JSONs de servicios y planes para soportar 4 tiers en lugar de 3.

Servicios (`messages/services/*.json`):
  - Tiers: inicial, profesional, avanzado (nuevo), enterprise
  - Cada tier mantiene: name, description, soporte, idealPara, incluye[],
    setupIncluye[], mantenimientoIncluye[].
  - Se interpola "avanzado" entre profesional y enterprise.

Planes (`messages/plans/*.json`):
  - Tiers: starter, growth, pro (nuevo), business
  - Cada tier mantiene: name, tagline, incluye[], idealPara.
  - Se interpola "pro" entre growth y business.

Además, este script LIMPIA contradicciones del tipo "N <unidad> ilimitados"
que existen hoy: o se deja un número finito, o se deja "ilimitado" sin número.

NO escribe a stdout salvo el resumen final. NO toca otros archivos.
"""

from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / 'apps' / 'web' / 'messages'
SERVICES_DIR = ROOT / 'services'
PLANS_DIR = ROOT / 'plans'

# Soporte y SLA por tier, en ambos idiomas
SERVICE_SOPORTE = {
    'es': {
        'inicial': 'Email durante 2 meses incluidos, 24h hábiles',
        'profesional': 'Email + WhatsApp con ticket ID, 4h hábiles',
        'avanzado': 'Email + WhatsApp + Slack Connect, 2h hábiles',
        'enterprise': 'Jira Service Desk o Zendesk + Slack Connect + WhatsApp, 1h crítico / 4h alto / 24h medio',
    },
    'en': {
        'inicial': 'Email during the included 2 months, 24h business response',
        'profesional': 'Email + WhatsApp with ticket ID, 4h business response',
        'avanzado': 'Email + WhatsApp + Slack Connect, 2h business response',
        'enterprise': 'Jira Service Desk or Zendesk + Slack Connect + WhatsApp, 1h critical / 4h high / 24h medium',
    },
}

PLAN_SOPORTE = {
    'es': {
        'starter': 'Soporte por correo en días hábiles (24h hábiles)',
        'growth': 'WhatsApp con ticket ID y respuesta en 4h hábiles',
        'pro': 'WhatsApp + Slack Connect y respuesta en 2h hábiles',
        'business': 'Jira Service Desk + Slack Connect + WhatsApp, SLA 1h crítico / 4h alto / 24h medio',
    },
    'en': {
        'starter': 'Email support on business days (24h business response)',
        'growth': 'WhatsApp with ticket ID and 4h business response',
        'pro': 'WhatsApp + Slack Connect with 2h business response',
        'business': 'Jira Service Desk + Slack Connect + WhatsApp, 1h critical / 4h high / 24h medium SLA',
    },
}

# Reemplazos globales para frases prohibidas (texto plano dentro de cualquier string)
PROHIBITED_REPLACEMENTS_ES = [
    # 24/7 dedicated
    (re.compile(r'24/7\s+dedicated', re.IGNORECASE), 'soporte en horario laboral Colombia con SLA según el tier'),
    (re.compile(r'On-call\s*24h', re.IGNORECASE), 'guardia humana en horario laboral con SLA según el tier'),
    (re.compile(r'24/7', re.IGNORECASE), 'horario laboral Colombia con SLA según el tier'),
    # HIPAA / SOC 2 / ISO 27001 certifications
    (re.compile(r'HIPAA\s+compliant', re.IGNORECASE), 'arquitectura alineada con HIPAA — auditoría a cargo del cliente'),
    (re.compile(r'HIPAA\s+certified', re.IGNORECASE), 'arquitectura alineada con HIPAA — auditoría a cargo del cliente'),
    (re.compile(r'SOC\s*2\s+Type\s*II', re.IGNORECASE), 'controles alineados con SOC 2 — certificación formal por cuenta del cliente'),
    (re.compile(r'SOC\s*2\s+certified', re.IGNORECASE), 'controles alineados con SOC 2 — certificación formal por cuenta del cliente'),
    (re.compile(r'SOC2\s+certified', re.IGNORECASE), 'controles alineados con SOC 2 — certificación formal por cuenta del cliente'),
    (re.compile(r'ISO\s*27001\s+certif\w*', re.IGNORECASE), 'controles alineados con ISO 27001 — certificación formal por cuenta del cliente'),
    # Dedicated team 24/7 / equipo dedicado
    (re.compile(r'Dedicated\s+team\s+24/?7', re.IGNORECASE), 'PM + tech lead asignados como punto único de contacto en horario laboral'),
    (re.compile(r'Equipo\s+dedicado(?:\s+24/?7)?', re.IGNORECASE), 'PM + tech lead asignados como punto único de contacto en horario laboral'),
    # Multi-región failover automático
    (re.compile(r'Multi-regi[óo]n\s+failover\s+autom[áa]tico', re.IGNORECASE), 'despliegue en una región principal — multi-región opcional con costo de infra adicional'),
    # Auditorías trimestrales incluidas
    (re.compile(r'Auditor[íi]as\s+trimestrales\s+incluidas', re.IGNORECASE), 'reportes mensuales de métricas — auditorías externas a cargo del cliente'),
]

PROHIBITED_REPLACEMENTS_EN = [
    (re.compile(r'24/7\s+dedicated', re.IGNORECASE), 'support in Colombian business hours with SLA per tier'),
    (re.compile(r'24/7', re.IGNORECASE), 'Colombian business hours with SLA per tier'),
    (re.compile(r'HIPAA\s+compliant', re.IGNORECASE), 'HIPAA-aligned architecture — audit handled by the client'),
    (re.compile(r'HIPAA\s+certified', re.IGNORECASE), 'HIPAA-aligned architecture — audit handled by the client'),
    (re.compile(r'SOC\s*2\s+Type\s*II', re.IGNORECASE), 'controls aligned with SOC 2 — formal certification handled by the client'),
    (re.compile(r'SOC\s*2\s+certified', re.IGNORECASE), 'controls aligned with SOC 2 — formal certification handled by the client'),
    (re.compile(r'SOC2\s+certified', re.IGNORECASE), 'controls aligned with SOC 2 — formal certification handled by the client'),
    (re.compile(r'ISO\s*27001\s+certif\w*', re.IGNORECASE), 'controls aligned with ISO 27001 — formal certification handled by the client'),
    (re.compile(r'Dedicated\s+team\s+24/?7', re.IGNORECASE), 'PM + tech lead assigned as single point of contact during business hours'),
    (re.compile(r'Multi-region\s+automatic\s+failover', re.IGNORECASE), 'single primary region — multi-region optional with extra infra cost'),
    (re.compile(r'Quarterly\s+audits\s+included', re.IGNORECASE), 'monthly metric reports — external audits handled by the client'),
]

# Patrón para corregir "N <unidad> ilimitados" -> "<unidad> ilimitados"
# El número adelante hace que el bullet se contradiga.
UNLIMITED_CONTRADICTION_ES = re.compile(
    r'(?<![\w\.])([0-9][\d\.,]*)\s+([a-záéíóúñ/\-\s]+?)\s+ilimitad(o|os|a|as)\b',
    re.IGNORECASE,
)
UNLIMITED_CONTRADICTION_EN = re.compile(
    r'(?<![\w\.])([0-9][\d\.,]*)\s+([a-z/\-\s]+?)\s+unlimited\b',
    re.IGNORECASE,
)

# Patrones específicos para frases que se contradicen pero tienen "y" en medio
EXTRA_CONTRADICTIONS_ES = [
    (re.compile(r'100\s+usuarios\s+y\s+tenant\s+ilimitad\w*', re.IGNORECASE), 'usuarios y tenants ilimitados'),
    (re.compile(r'10\s+usuarios\s+y\s+gateway\s+ilimitad\w*', re.IGNORECASE), 'usuarios y gateways ilimitados'),
    (re.compile(r'10\s+repos\s+y\s+200\s+prs/mes\s+ilimitad\w*', re.IGNORECASE), 'repos y PRs/mes ilimitados'),
    (re.compile(r'1\s+caja\s+y\s+1\.000\s+productos\s+ilimitad\w*', re.IGNORECASE), 'cajas y productos ilimitados'),
]
EXTRA_CONTRADICTIONS_EN = [
    (re.compile(r'100\s+users\s+and\s+tenant\s+unlimited', re.IGNORECASE), 'users and tenants unlimited'),
    (re.compile(r'10\s+users\s+and\s+gateway\s+unlimited', re.IGNORECASE), 'users and gateways unlimited'),
    (re.compile(r'10\s+repos\s+and\s+200\s+prs/mo\s+unlimited', re.IGNORECASE), 'repos and PRs/mo unlimited'),
]


def fix_string(value: str, lang: str) -> str:
    """Aplica reemplazos en una cadena: contradicciones + frases prohibidas."""
    out = value
    if lang == 'es':
        for pat, repl in EXTRA_CONTRADICTIONS_ES:
            out = pat.sub(repl, out)
        # Quitar el número adelante para no contradecir "ilimitado"
        out = UNLIMITED_CONTRADICTION_ES.sub(lambda m: f"{m.group(2).strip()} ilimitad{m.group(3)}", out)
        for pat, repl in PROHIBITED_REPLACEMENTS_ES:
            out = pat.sub(repl, out)
    else:
        for pat, repl in EXTRA_CONTRADICTIONS_EN:
            out = pat.sub(repl, out)
        out = UNLIMITED_CONTRADICTION_EN.sub(lambda m: f"{m.group(2).strip()} unlimited", out)
        for pat, repl in PROHIBITED_REPLACEMENTS_EN:
            out = pat.sub(repl, out)
    return out


def fix_recursive(node, lang: str):
    if isinstance(node, str):
        return fix_string(node, lang)
    if isinstance(node, list):
        return [fix_recursive(x, lang) for x in node]
    if isinstance(node, dict):
        return {k: fix_recursive(v, lang) for k, v in node.items()}
    return node


# ---------------------------------------------------------------------------
# Builders por tier sintético
# ---------------------------------------------------------------------------

def build_avanzado_service(profesional: dict, enterprise: dict, lang: str) -> dict:
    """Crea el tier `avanzado` interpolando entre `profesional` y `enterprise`."""
    if lang == 'es':
        name = 'Avanzado'
        description = 'Implementación con escala media-alta, multi-región opcional y soporte 2h hábiles'
        ideal_template_es = 'Empresas en crecimiento que necesitan más capacidad y soporte 2h hábiles'
        soporte = SERVICE_SOPORTE['es']['avanzado']
    else:
        name = 'Advanced'
        description = 'Mid-to-high scale implementation with optional multi-region and 2h business support'
        ideal_template_es = 'Growing companies that need more capacity and 2h business support'
        soporte = SERVICE_SOPORTE['en']['avanzado']

    incluye = interpolate_lists(profesional.get('incluye', []), enterprise.get('incluye', []), lang)
    setup_incluye = interpolate_lists(profesional.get('setupIncluye', []), enterprise.get('setupIncluye', []), lang)
    mant_incluye = interpolate_lists(profesional.get('mantenimientoIncluye', []), enterprise.get('mantenimientoIncluye', []), lang)

    return {
        'name': name,
        'description': description,
        'soporte': soporte,
        'idealPara': profesional.get('idealPara', ideal_template_es),
        'incluye': incluye,
        'setupIncluye': setup_incluye,
        'mantenimientoIncluye': mant_incluye,
    }


def build_pro_plan(growth: dict, business: dict, lang: str) -> dict:
    if lang == 'es':
        name = 'Pro'
        tagline = 'Cuando tu operación ya escala y necesitás SLA 2h hábiles'
        ideal = 'Empresas con operación estable que necesitan más capacidad y SLA más estricto'
        soporte_line = SUPPORT_LINE_ES_PRO
    else:
        name = 'Pro'
        tagline = 'When your operation scales and you need 2h business SLA'
        ideal = 'Companies with stable operations that need more capacity and tighter SLA'
        soporte_line = SUPPORT_LINE_EN_PRO

    incluye = interpolate_lists(growth.get('incluye', []), business.get('incluye', []), lang)

    # Asegurarnos que el bullet de soporte coincide con el tier
    incluye = [item for item in incluye if 'soporte' not in item.lower() and 'support' not in item.lower()]
    incluye.append(soporte_line)

    return {
        'name': name,
        'tagline': tagline,
        'incluye': incluye,
        'idealPara': ideal,
    }


SUPPORT_LINE_ES_PRO = 'Soporte por WhatsApp + Slack Connect con respuesta en 2 horas hábiles'
SUPPORT_LINE_EN_PRO = 'WhatsApp + Slack Connect support with 2-hour business response'


def interpolate_lists(lower: list[str], upper: list[str], lang: str) -> list[str]:
    """Genera una lista intermedia tomando ítems del tier inferior + un par del superior.

    Estrategia simple: mantiene la lista del tier inferior y agrega 1-2 bullets
    del superior que aporten capacidad adicional (sin compliance certificado).
    """
    # No traemos bullets que mencionen compliance certificado, dedicated team 24/7,
    # multi-región failover automático, etc — esos van solo en Enterprise/Business.
    blocked_kw_es = (
        'soc2', 'soc 2', 'iso 27001', 'iso27001', 'hipaa compliant', 'pci-dss',
        'dedicated team', 'multi-región failover', '24/7', 'sla 99,9',
    )
    blocked_kw_en = (
        'soc2', 'soc 2', 'iso 27001', 'iso27001', 'hipaa compliant', 'pci-dss',
        'dedicated team', 'multi-region failover', '24/7', '99.9% sla',
    )
    blocked = blocked_kw_es if lang == 'es' else blocked_kw_en

    extras: list[str] = []
    for item in upper:
        low = item.lower()
        if any(b in low for b in blocked):
            continue
        if item not in lower:
            extras.append(item)
        if len(extras) >= 2:
            break

    return list(lower) + extras


# ---------------------------------------------------------------------------
# Procesamiento principal
# ---------------------------------------------------------------------------

def process_service_file(path: Path, lang: str) -> bool:
    data = json.loads(path.read_text(encoding='utf-8'))
    if not isinstance(data, dict) or len(data) != 1:
        return False
    (ns,) = data.keys()
    body = data[ns]
    plans = body.get('plans')
    if not isinstance(plans, dict):
        return False

    profesional = plans.get('profesional')
    enterprise = plans.get('enterprise')
    if not (isinstance(profesional, dict) and isinstance(enterprise, dict)):
        return False

    # 1) Insertar tier avanzado si no existe
    if 'avanzado' not in plans:
        avanzado = build_avanzado_service(profesional, enterprise, lang)
        # Reordenar manteniendo el orden esperado
        new_plans = {}
        for key in ('inicial', 'profesional', 'avanzado', 'enterprise'):
            if key == 'avanzado':
                new_plans[key] = avanzado
            elif key in plans:
                new_plans[key] = plans[key]
        body['plans'] = new_plans

    # 2) Actualizar soporte por tier
    for tier_key in ('inicial', 'profesional', 'avanzado', 'enterprise'):
        if tier_key in body['plans']:
            body['plans'][tier_key]['soporte'] = SERVICE_SOPORTE[lang][tier_key]

    # 3) Sanitizar todo: contradicciones + frases prohibidas
    body = fix_recursive(body, lang)
    data[ns] = body

    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return True


def process_plan_file(path: Path, lang: str) -> bool:
    data = json.loads(path.read_text(encoding='utf-8'))
    if not isinstance(data, dict) or len(data) != 1:
        return False
    (ns,) = data.keys()
    body = data[ns]
    plans = body.get('plans')
    if not isinstance(plans, dict):
        return False

    growth = plans.get('growth')
    business = plans.get('business')
    if not (isinstance(growth, dict) and isinstance(business, dict)):
        return False

    if 'pro' not in plans:
        pro = build_pro_plan(growth, business, lang)
        new_plans = {}
        for key in ('starter', 'growth', 'pro', 'business'):
            if key == 'pro':
                new_plans[key] = pro
            elif key in plans:
                new_plans[key] = plans[key]
        body['plans'] = new_plans

    # Asegurar bullets de soporte coherentes por tier (reemplazo del último bullet del tier inferior)
    for tier_key in ('starter', 'growth', 'pro', 'business'):
        if tier_key not in body['plans']:
            continue
        tier = body['plans'][tier_key]
        incluye = tier.get('incluye', [])
        if not isinstance(incluye, list):
            continue
        # Sólo aseguramos que el bullet de soporte de Pro esté presente (ya lo agregamos arriba).

    body = fix_recursive(body, lang)
    data[ns] = body

    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return True


def main() -> int:
    if not SERVICES_DIR.exists() or not PLANS_DIR.exists():
        print(f'ERROR: missing dirs {SERVICES_DIR} / {PLANS_DIR}', file=sys.stderr)
        return 1

    modified = 0

    for sub_dir, processor in ((SERVICES_DIR, process_service_file), (PLANS_DIR, process_plan_file)):
        for file in sorted(sub_dir.iterdir()):
            if not file.is_file() or not file.name.endswith('.json'):
                continue
            if file.name.startswith('_'):
                continue
            if file.name.endswith('.es.json'):
                lang = 'es'
            elif file.name.endswith('.en.json'):
                lang = 'en'
            else:
                continue
            if processor(file, lang):
                modified += 1

    print(f'Modified {modified} JSON files')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
