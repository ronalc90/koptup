/**
 * Archivos que la demo genera de verdad en el navegador: eventos de calendario
 * (.ics, se abren en Google Calendar, Outlook o Apple Calendar) y la lista de
 * reservas en CSV.
 */
import { utcCompact } from './dates';
import type { Booking, Business } from './types';

export interface EventText {
  title: string;
  description: string;
  location: string;
}

const icsEscape = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');

/** Corta las líneas largas en tramos de 60 caracteres (RFC 5545 pide máximo 75 octetos). */
function fold(line: string): string {
  if (line.length <= 60) return line;
  const parts: string[] = [];
  for (let i = 0; i < line.length; i += 60) parts.push((i ? ' ' : '') + line.slice(i, i + 60));
  return parts.join('\r\n');
}

export function buildIcs(events: { booking: Booking; text: EventText }[], stamp: string, reminderLabel: string): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//KopTup//Demo sistema de reservas//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  const [sd, st = '00:00'] = stamp.split('T');
  const [sh, sm] = st.split(':').map(Number);
  const dtstamp = utcCompact(sd, sh * 60 + sm);
  for (const { booking: b, text } of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${b.id}-${b.code}@demo-reservas.koptup.com`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${utcCompact(b.date, b.start)}`,
      `DTEND:${utcCompact(b.date, b.end)}`,
      fold(`SUMMARY:${icsEscape(text.title)}`),
      fold(`LOCATION:${icsEscape(text.location)}`),
      fold(`DESCRIPTION:${icsEscape(text.description)}`),
      'BEGIN:VALARM',
      'TRIGGER:-PT24H',
      'ACTION:DISPLAY',
      fold(`DESCRIPTION:${icsEscape(reminderLabel)}`),
      'END:VALARM',
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

/** Enlace público de Google Calendar con el evento prellenado (no requiere integración). */
export function googleCalendarUrl(b: Booking, text: EventText): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: text.title,
    dates: `${utcCompact(b.date, b.start)}/${utcCompact(b.date, b.end)}`,
    details: text.description,
    location: text.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function toCsv(rows: (string | number)[][], sep: string): string {
  const esc = (v: string | number) => {
    const s = String(v);
    return /["\n\r;,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return '\uFEFF' + rows.map((r) => r.map(esc).join(sep)).join('\r\n') + '\r\n';
}

export function download(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function fileSlug(biz: Business): string {
  return biz.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
