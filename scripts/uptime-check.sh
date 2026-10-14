#!/usr/bin/env bash
# uptime-check.sh — revisa que la web y la API respondan. Lo usa el workflow
# "Monitoreo" (.github/workflows/monitor.yml) cada 15 minutos.
#
# Uso: scripts/uptime-check.sh <url-web> [<url-salud-api>]
#   - La web debe responder 2xx o 3xx (sigue las redirecciones).
#   - La salud de la API (GET /health) debe responder 200: con 503 la API está
#     arriba pero sin base de datos, y eso también es una caída para el sitio.
# Cada URL se intenta 3 veces (15 s entre intentos) para no alertar por un
# corte de segundos. Sale con 1 si alguna falla (GitHub avisa al dueño).
set -uo pipefail

ATTEMPTS="${UPTIME_ATTEMPTS:-3}"
WAIT_SECONDS="${UPTIME_WAIT_SECONDS:-15}"
TIMEOUT_SECONDS="${UPTIME_TIMEOUT_SECONDS:-20}"

check() {
  local name="$1" url="$2" expect="$3" code="000"
  for attempt in $(seq 1 "$ATTEMPTS"); do
    code="$(curl -sS -L -o /dev/null -w '%{http_code}' --max-time "$TIMEOUT_SECONDS" "$url" 2>/dev/null || true)"
    code="${code:-000}"
    if [[ "$code" =~ $expect ]]; then
      echo "OK    $name ($url) respondió $code"
      return 0
    fi
    echo "Intento $attempt/$ATTEMPTS: $name ($url) respondió $code"
    if [[ "$attempt" -lt "$ATTEMPTS" ]]; then sleep "$WAIT_SECONDS"; fi
  done
  echo "::error title=$name no responde::$url respondió $code después de $ATTEMPTS intentos (000 = sin respuesta)."
  return 1
}

if [[ $# -lt 1 || -z "${1:-}" ]]; then
  echo "Uso: $0 <url-web> [<url-salud-api>]" >&2
  exit 2
fi

status=0
check "La web" "$1" '^[23][0-9][0-9]$' || status=1
if [[ -n "${2:-}" ]]; then
  check "La API" "$2" '^200$' || status=1
else
  echo "::warning title=API sin monitorear::Falta la variable del repositorio BACKEND_HEALTH_URL (por ejemplo https://<api>/health). Solo se revisó la web."
fi
exit "$status"
