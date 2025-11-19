# 🔍 Scrapers de Datos Médicos

Este directorio contiene scrapers funcionales para descargar datos reales de fuentes oficiales colombianas.

## Scrapers Disponibles

### 1. CUPS Scraper (`cups-scraper.ts`)

**Descarga**: Códigos CUPS (Clasificación Única de Procedimientos en Salud)

**Fuentes oficiales**:
- **Datos Abiertos Colombia** (RECOMENDADO): https://www.datos.gov.co/resource/9zcz-bjue.json
- SISPRO: https://www.sispro.gov.co/
- Ministerio de Salud PDFs (requiere extracción)

**Ejecución**:
```bash
cd /home/user/koptup/apps/backend
npx ts-node src/scripts/scrapers/cups-scraper.ts
```

**Resultado esperado**: 5,000 - 50,000 códigos CUPS

---

### 2. CIE-10 Scraper (`cie10-scraper.ts`)

**Descarga**: Códigos CIE-10 (Clasificación Internacional de Enfermedades)

**Fuentes oficiales**:
- **GitHub OPS** (RECOMENDADO): CSV en español
- OMS (WHO): https://icd.who.int/browse10/2019/en
- Datos hardcodeados de respaldo

**Ejecución**:
```bash
npx ts-node src/scripts/scrapers/cie10-scraper.ts
```

**Resultado esperado**: 100 - 14,000 códigos CIE-10

---

### 3. INVIMA Scraper (`invima-scraper.ts`)

**Descarga**: Medicamentos con código CUM (Código Único de Medicamentos)

**Fuentes oficiales**:
- **Datos Abiertos Colombia - CUM**: https://www.datos.gov.co/
- INVIMA API: https://consultaregistro.invima.gov.co/
- Medicamentos comunes de respaldo (100 más usados)

**Ejecución**:
```bash
npx ts-node src/scripts/scrapers/invima-scraper.ts
```

**Resultado esperado**: 3,000 - 20,000 medicamentos

---

### 4. Tarifas Scraper (`tarifas-scraper.ts`)

**Descarga**: Tarifas de referencia (ISS 2001, ISS 2004, SOAT 2024)

**Fuentes**:
- Datos Abiertos Colombia (ISS)
- Ministerio de Salud (SOAT)
- Generación sintética basada en UVR

**Ejecución**:
```bash
npx ts-node src/scripts/scrapers/tarifas-scraper.ts
```

**Resultado**: Actualiza tarifas en códigos CUPS existentes

---

## Ejecutar Todos los Scrapers

Script para ejecutar todos los scrapers en secuencia:

```bash
#!/bin/bash

echo "🚀 Iniciando scrapers de datos médicos..."

echo "\n📋 1/4 Scraping CUPS..."
npx ts-node src/scripts/scrapers/cups-scraper.ts

echo "\n🩺 2/4 Scraping CIE-10..."
npx ts-node src/scripts/scrapers/cie10-scraper.ts

echo "\n💊 3/4 Scraping Medicamentos INVIMA..."
npx ts-node src/scripts/scrapers/invima-scraper.ts

echo "\n💰 4/4 Scraping Tarifas..."
npx ts-node src/scripts/scrapers/tarifas-scraper.ts

echo "\n✅ Todos los scrapers completados!"
```

Guardar como `run-all-scrapers.sh` y ejecutar:
```bash
chmod +x run-all-scrapers.sh
./run-all-scrapers.sh
```

---

## Requisitos

### Variables de Entorno

```env
MONGODB_URI=mongodb://localhost:27017/koptup
OPENAI_API_KEY=sk-...  # Solo si usas extracción de PDFs
```

### Dependencias

```bash
npm install axios cheerio csv-parser
```

---

## Notas Importantes

### 1. Rate Limiting
- Los scrapers respetan rate limits de APIs públicas
- Incluyen timeouts y reintentos
- Descargan en lotes para evitar sobrecarga

### 2. Datos de Respaldo
Cada scraper incluye datos hardcodeados de respaldo si falla la conexión:
- CUPS: 16 códigos de ejemplo
- CIE-10: 40+ diagnósticos más comunes
- Medicamentos: 20 medicamentos esenciales
- Tarifas: Referencias SOAT 2024

### 3. Actualización
Para actualizar datos existentes, los scrapers usan `upsert`:
- Si el código existe, actualiza la información
- Si no existe, lo inserta como nuevo

### 4. Performance
- **CUPS**: ~1,000 registros/segundo
- **CIE-10**: ~500 registros/segundo
- **Medicamentos**: ~500 registros/segundo
- **Tarifas**: ~1,000 actualizaciones/segundo

---

## Fuentes Alternativas

Si las URLs fallan, buscar en:

### CUPS
- Google: "CUPS Colombia 2024 Ministerio Salud"
- Google: "CUPS Colombia datos abiertos"

### CIE-10
- Google: "CIE-10 español descarga CSV"
- GitHub: Buscar repositorios con "cie10 español"

### Medicamentos
- https://consultaregistro.invima.gov.co/
- Google: "base datos CUM INVIMA descarga"
- Google: "SISMED Colombia medicamentos"

### Tarifas
- Google: "manual tarifario ISS 2001 Colombia PDF"
- Google: "tarifas SOAT Colombia 2024"
- Ministerio de Salud: Resoluciones oficiales

---

## Troubleshooting

### Error: No se encontraron datos

**Solución**: Verificar URLs en el código y buscar fuentes actualizadas

### Error: Timeout

**Solución**: Aumentar `timeout` en axios o ejecutar en horarios de menor tráfico

### Error: MongoDB connection failed

**Solución**: Verificar que MongoDB esté corriendo
```bash
# Ubuntu/Linux
sudo systemctl status mongod

# Windows
net start MongoDB

# Docker
docker ps | grep mongo
```

---

## Mantenimiento

**Frecuencia de actualización recomendada**:
- CUPS: Semestral (actualizaciones del Ministerio de Salud)
- CIE-10: Anual (nueva versión de OMS)
- Medicamentos: Trimestral (nuevos registros INVIMA)
- Tarifas: Anual (resoluciones del gobierno)

---

## Contribuciones

Si encuentras fuentes de datos mejores o URLs actualizadas, por favor:
1. Actualiza el código del scraper
2. Documenta la fuente
3. Crea un PR o issue

---

**Última actualización**: 2024
**Autor**: Sistema de Auditoría Médica KopTup
