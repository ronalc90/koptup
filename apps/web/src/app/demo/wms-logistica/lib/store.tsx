'use client';

/**
 * Estado de la demo en el navegador: un reducer con todas las acciones del WMS
 * (recibo, ubicación, olas, alistamiento, empaque, guías, conteos, traslados,
 * devoluciones, kits, cross-dock y ruteo) y persistencia en localStorage.
 * Los cambios se guardan hasta que cambia el día; entonces se genera una
 * operación de ejemplo nueva con la fecha de hoy.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import { useLocale } from 'next-intl';
import { BIN_BY_ID, CARRIER_BY_ID, PICKERS, WAREHOUSE_BY_ID } from './catalog';
import { dateOf, localNow, type ISODate, type ISODateTime } from './dates';
import {
  abcClasses,
  allocateFefo,
  availableQty,
  fefoSort,
  quotes,
  suggestBin,
  orderNetKg,
  productMap,
  boxFor,
  BOX_TARE,
} from './engine';
import { buildState, STATE_VERSION } from './seed';
import type {
  AbcClass,
  CarrierId,
  ClientId,
  Lot,
  Milestone,
  MoveType,
  Order,
  PickStrategy,
  Pod,
  Product,
  Rma,
  Shipment,
  ShipStatus,
  Tariff,
  ViewId,
  WarehouseId,
  WmsState,
} from './types';
import type { Lang } from './format';
import type { PickItem } from './engine';

const STORAGE_KEY = 'koptup.wms.state';
const UI_KEY = 'koptup.wms.ui';

export type Action =
  | { type: 'reset'; now: ISODateTime }
  | { type: 'load'; state: WmsState }
  | { type: 'po.scan'; po: string; code: string; units: number; at: ISODateTime }
  | { type: 'po.unload'; po: string; at: ISODateTime }
  | { type: 'po.damage'; po: string; sku: string; delta: number }
  | { type: 'po.close'; po: string; at: ISODateTime }
  | { type: 'putaway.confirm'; task: string; at: ISODateTime }
  | { type: 'putaway.change'; task: string; bin: string }
  | { type: 'wave.release'; wh: WarehouseId; orders: string[]; strategy: PickStrategy; at: ISODateTime }
  | { type: 'wave.strategy'; wave: string; strategy: PickStrategy }
  | { type: 'pick.confirm'; items: PickItem[]; at: ISODateTime }
  | { type: 'pick.short'; items: PickItem[]; at: ISODateTime }
  | { type: 'pack.verify'; order: string; sku: string; units: number }
  | { type: 'pack.verifyAll'; order: string }
  | { type: 'pack.ship'; order: string; carrier: CarrierId; weightKg: number; box: Shipment['box']; at: ISODateTime }
  | { type: 'ship.advance'; shipment: string; at: ISODateTime }
  | { type: 'ship.reschedule'; shipment: string; at: ISODateTime }
  | { type: 'driver.arrive'; shipment: string; at: ISODateTime }
  | { type: 'driver.deliver'; shipment: string; pod: Pod }
  | { type: 'driver.fail'; shipment: string; reason: string; at: ISODateTime }
  | { type: 'driver.retry'; shipment: string; at: ISODateTime }
  | { type: 'routes.apply'; wh: WarehouseId; plan: string[][] }
  | { type: 'routes.start'; wh: WarehouseId; start: string }
  | { type: 'count.submit'; task: string; counted: number; at: ISODateTime }
  | { type: 'count.approve'; task: string; at: ISODateTime }
  | { type: 'count.recount'; task: string }
  | { type: 'count.generate'; wh: WarehouseId; cls: AbcClass; at: ISODateTime }
  | { type: 'lot.quarantine'; lot: string; at: ISODateTime }
  | { type: 'lot.release'; lot: string; at: ISODateTime }
  | { type: 'lot.transfer'; lot: string; to: WarehouseId; qty: number; at: ISODateTime }
  | { type: 'products.import'; products: Product[]; at: ISODateTime; wh: WarehouseId }
  | { type: 'rma.create'; rma: Omit<Rma, 'id' | 'status'>; at: ISODateTime }
  | { type: 'rma.decide'; id: string; approve: boolean; reason?: string; at: ISODateTime }
  | { type: 'rma.receive'; id: string; disposition: 'restock' | 'quarantine'; at: ISODateTime }
  | { type: 'rma.close'; id: string; at: ISODateTime }
  | { type: 'xd.advance'; id: string; at: ISODateTime }
  | { type: 'kit.build'; qty: number; at: ISODateTime }
  | { type: 'carrier.prefer'; wh: WarehouseId; carrier: CarrierId }
  | { type: 'tariff.set'; client: ClientId; field: keyof Tariff; value: number }
  | { type: 'order.add'; order: Order; at: ISODateTime };

function clone<T>(v: T): T {
  return typeof structuredClone === 'function' ? structuredClone(v) : JSON.parse(JSON.stringify(v));
}

const KIT_SKU = 'LIR-KITBV';

function addLog(s: WmsState, wh: WarehouseId, at: ISODateTime, key: string, params: Record<string, string | number> = {}) {
  s.seq += 1;
  s.log.unshift({ id: `LG${s.seq}`, at, wh, key, params });
  if (s.log.length > 60) s.log.length = 60;
}

function addMove(s: WmsState, m: { at: ISODateTime; wh: WarehouseId; sku: string; lot: string; bin: string; qty: number; type: MoveType; ref: string }) {
  s.seq += 1;
  s.moves.unshift({ ...m, id: `M${s.seq}` });
  if (s.moves.length > 600) s.moves.length = 600;
}

function milestone(s: WmsState, m: Milestone) {
  if (!s.milestones.includes(m)) s.milestones.push(m);
}

/** Agrega unidades a un lote existente en la misma ubicación o crea uno nuevo. */
function putLot(s: WmsState, l: Omit<Lot, 'id' | 'reserved'>): Lot {
  const same = s.lots.find((x) => x.wh === l.wh && x.bin === l.bin && x.sku === l.sku && x.lot === l.lot && x.status === l.status);
  if (same) {
    same.qty += l.qty;
    return same;
  }
  s.seq += 1;
  const lot: Lot = { ...l, id: `LT${s.seq}`, reserved: 0 };
  s.lots.push(lot);
  return lot;
}

/** Un pedido queda alistado cuando todas sus asignaciones se tomaron o se reportaron como faltante. */
function orderDone(o: Order) {
  return o.lines.every((ln) => ln.alloc.every((x) => x.picked + x.short >= x.qty));
}

/** Simula la asignación FEFO de varios pedidos en orden (compiten por el mismo stock). */
export function releasePlan(state: WmsState, orderIds: string[], today: ISODate) {
  const lots = clone(state.lots);
  const ok: string[] = [];
  const failed: string[] = [];
  for (const id of orderIds) {
    const o = state.orders.find((x) => x.id === id);
    if (!o || o.status !== 'new' || o.crossDockPo) continue;
    const trial = clone(lots);
    let fine = true;
    for (const ln of o.lines) {
      const { alloc, missing } = allocateFefo(trial, o.wh, ln.sku, ln.qty, today);
      if (missing > 0) {
        fine = false;
        break;
      }
      for (const a of alloc) trial.find((l) => l.id === a.lotId)!.reserved += a.qty;
    }
    if (fine) {
      ok.push(id);
      lots.splice(0, lots.length, ...trial);
    } else failed.push(id);
  }
  return { ok, failed };
}

function reducer(state: WmsState | null, a: Action): WmsState | null {
  if (a.type === 'reset') return buildState(a.now);
  if (a.type === 'load') return a.state;
  if (!state) return state;
  const s = clone(state);
  const today = s.baseDate;
  const pm = productMap(s.products);
  const byBarcode = (code: string) => s.products.find((p) => p.barcode === code || p.sku === code.toUpperCase());

  switch (a.type) {
    case 'po.scan': {
      const po = s.pos.find((p) => p.id === a.po);
      if (!po || po.status === 'closed' || po.status === 'closedIssues') return state;
      const product = byBarcode(a.code.trim());
      const line = product ? po.lines.find((l) => l.sku === product.sku) : undefined;
      const units = Math.max(1, Math.min(999, Math.round(a.units)));
      let result: 'ok' | 'unknown' | 'over' = 'unknown';
      if (line) {
        line.received += units;
        result = line.received > line.expected ? 'over' : 'ok';
      }
      po.status = 'receiving';
      po.scans.unshift({ at: a.at, code: a.code.trim().slice(0, 40), units, result, sku: line?.sku });
      if (po.scans.length > 40) po.scans.length = 40;
      return s;
    }
    case 'po.unload': {
      const po = s.pos.find((p) => p.id === a.po);
      if (!po || po.status === 'closed' || po.status === 'closedIssues') return state;
      for (const l of po.lines) {
        const add = Math.max(0, l.onTruck - l.received);
        if (add > 0) {
          l.received += add;
          po.scans.unshift({ at: a.at, code: pm[l.sku]?.barcode ?? l.sku, units: add, result: l.received > l.expected ? 'over' : 'ok', sku: l.sku });
        }
      }
      po.status = 'receiving';
      return s;
    }
    case 'po.damage': {
      const po = s.pos.find((p) => p.id === a.po);
      const l = po?.lines.find((x) => x.sku === a.sku);
      if (!po || !l || po.status === 'closed' || po.status === 'closedIssues') return state;
      l.damaged = Math.max(0, Math.min(l.received, l.damaged + a.delta));
      return s;
    }
    case 'po.close': {
      const po = s.pos.find((p) => p.id === a.po);
      if (!po || po.status === 'closed' || po.status === 'closedIssues') return state;
      po.issues = [];
      for (const l of po.lines) {
        if (l.received < l.expected) po.issues.push({ type: 'missing', sku: l.sku, qty: l.expected - l.received });
        if (l.received > l.expected) po.issues.push({ type: 'over', sku: l.sku, qty: l.received - l.expected });
        if (l.damaged > 0) po.issues.push({ type: 'damaged', sku: l.sku, qty: l.damaged });
      }
      const unknown = po.scans.filter((x) => x.result === 'unknown').reduce((acc, x) => acc + x.units, 0);
      if (unknown > 0) po.issues.push({ type: 'wrongSku', qty: unknown });
      po.status = po.issues.length ? 'closedIssues' : 'closed';
      po.closedAt = a.at;
      const exclude = new Set<string>();
      let goodTotal = 0;
      for (const l of po.lines) {
        const good = l.received - l.damaged;
        if (l.received > 0) addMove(s, { at: a.at, wh: po.wh, sku: l.sku, lot: l.lot, bin: 'RECIBO', qty: l.received, type: 'receipt', ref: po.id });
        goodTotal += Math.max(0, good);
        if (good > 0 && !po.crossDockOrder) {
          const sug = suggestBin(s, po.wh, l.sku, { exclude });
          exclude.add(sug.bin);
          s.seq += 1;
          s.putaway.push({ id: `UB${s.seq}`, wh: po.wh, sku: l.sku, lot: l.lot, expiry: l.expiry, qty: good, ref: po.id, suggested: sug.bin, rule: sug.rule, quarantine: false, status: 'pending' });
        }
        if (l.damaged > 0) {
          const sug = suggestBin(s, po.wh, l.sku, { quarantine: true });
          s.seq += 1;
          s.putaway.push({ id: `UB${s.seq}`, wh: po.wh, sku: l.sku, lot: l.lot, expiry: l.expiry, qty: l.damaged, ref: po.id, suggested: sug.bin, rule: 'damaged', quarantine: true, status: 'pending' });
        }
      }
      if (po.crossDockOrder && goodTotal > 0) {
        s.seq += 1;
        s.crossDock.push({ id: `XD${s.seq}`, wh: po.wh, po: po.id, order: po.crossDockOrder, units: goodTotal, step: 'sort' });
        addMove(s, { at: a.at, wh: po.wh, sku: po.lines[0].sku, lot: po.lines[0].lot, bin: 'MUELLE', qty: goodTotal, type: 'crossDock', ref: po.id });
      }
      addLog(s, po.wh, a.at, po.issues.length ? 'poClosedIssues' : 'poClosed', { po: po.id, issues: po.issues.length });
      if (po.id === 'OC-24871') milestone(s, 'received');
      return s;
    }
    case 'putaway.change': {
      const t = s.putaway.find((x) => x.id === a.task);
      if (!t || t.status !== 'pending') return state;
      t.suggested = a.bin;
      t.rule = 'manual';
      return s;
    }
    case 'putaway.confirm': {
      const t = s.putaway.find((x) => x.id === a.task);
      if (!t || t.status !== 'pending') return state;
      const bin = t.suggested;
      putLot(s, { wh: t.wh, sku: t.sku, lot: t.lot, expiry: t.expiry, bin, qty: t.qty, status: t.quarantine ? 'quarantine' : 'available' });
      t.status = 'done';
      t.bin = bin;
      addMove(s, { at: a.at, wh: t.wh, sku: t.sku, lot: t.lot, bin, qty: t.qty, type: t.quarantine ? 'quarantine' : 'putaway', ref: t.ref });
      addLog(s, t.wh, a.at, 'putaway', { sku: t.sku, qty: t.qty, bin });
      if (t.ref === 'OC-24871' && s.putaway.filter((x) => x.ref === 'OC-24871').every((x) => x.status === 'done')) milestone(s, 'putaway');
      return s;
    }
    case 'wave.release': {
      const { ok } = releasePlan(s, a.orders, today);
      if (!ok.length) return state;
      s.seq += 1;
      const waveId = `OLA-${400 + s.seq}`;
      for (const id of ok) {
        const o = s.orders.find((x) => x.id === id)!;
        for (const ln of o.lines) {
          const { alloc } = allocateFefo(s.lots, o.wh, ln.sku, ln.qty, today);
          ln.alloc = alloc;
          for (const al of alloc) s.lots.find((l) => l.id === al.lotId)!.reserved += al.qty;
        }
        o.status = 'released';
        o.wave = waveId;
      }
      s.waves.unshift({ id: waveId, wh: a.wh, at: a.at, orders: ok, strategy: a.strategy, status: 'open' });
      addLog(s, a.wh, a.at, 'waveReleased', { wave: waveId, orders: ok.length });
      if (a.wh === 'fun') milestone(s, 'wave');
      return s;
    }
    case 'wave.strategy': {
      const w = s.waves.find((x) => x.id === a.wave);
      if (!w) return state;
      w.strategy = a.strategy;
      return s;
    }
    case 'pick.confirm':
    case 'pick.short': {
      const touched = new Set<string>();
      for (const it of a.items) {
        const o = s.orders.find((x) => x.id === it.order);
        const ln = o?.lines[it.line];
        const al = ln?.alloc[it.a];
        if (!o || !ln || !al || o.status !== 'released') continue;
        const pending = al.qty - al.picked - al.short;
        if (pending <= 0) continue;
        const lot = s.lots.find((l) => l.id === al.lotId);
        touched.add(o.id);
        if (a.type === 'pick.confirm') {
          al.picked += pending;
          if (lot) {
            lot.qty = Math.max(0, lot.qty - pending);
            lot.reserved = Math.max(0, lot.reserved - pending);
          }
          addMove(s, { at: a.at, wh: o.wh, sku: ln.sku, lot: al.lot, bin: al.bin, qty: -pending, type: 'pick', ref: o.id });
        } else {
          al.short += pending;
          if (lot) lot.reserved = Math.max(0, lot.reserved - pending);
          const existing = s.counts.find((c) => c.wh === o.wh && c.bin === al.bin && c.status !== 'done');
          if (existing) {
            existing.urgent = true;
            existing.due = today;
          } else {
            s.seq += 1;
            s.counts.unshift({ id: `CC-${s.seq}`, wh: o.wh, bin: al.bin, lotId: al.lotId, sku: ln.sku, due: today, assignee: PICKERS[s.seq % PICKERS.length], status: 'scheduled', urgent: true });
          }
          // Reasignar desde otro lote (FEFO) si hay existencias.
          const exclude = new Set(ln.alloc.filter((x) => x.short > 0).map((x) => x.lotId));
          const { alloc } = allocateFefo(s.lots, o.wh, ln.sku, pending, today, exclude);
          for (const na of alloc) {
            ln.alloc.push(na);
            s.lots.find((l) => l.id === na.lotId)!.reserved += na.qty;
          }
          addLog(s, o.wh, a.at, 'pickShort', { order: o.id, bin: al.bin, qty: pending, realloc: alloc.reduce((x, y) => x + y.qty, 0) });
        }
      }
      for (const id of touched) {
        const o = s.orders.find((x) => x.id === id)!;
        if (orderDone(o)) {
          o.status = 'picked';
          o.pickedAt = a.at;
          o.verified = Object.fromEntries(o.lines.map((l) => [l.sku, 0]));
          o.shortLines = o.lines.filter((ln) => ln.alloc.reduce((x, y) => x + y.picked, 0) < ln.qty).length;
          const w = s.waves.find((x) => x.id === o.wave);
          if (w && w.orders.every((oid) => s.orders.find((x) => x.id === oid)?.status !== 'released')) {
            w.status = 'done';
            addLog(s, w.wh, a.at, 'waveDone', { wave: w.id });
            if (w.wh === 'fun') milestone(s, 'picked');
          }
        }
      }
      return s;
    }
    case 'pack.verify': {
      const o = s.orders.find((x) => x.id === a.order);
      if (!o || o.status !== 'picked') return state;
      const idx = o.lines.findIndex((l) => l.sku === a.sku);
      if (idx < 0) return state;
      const max = o.lines[idx].alloc.reduce((x, y) => x + y.picked, 0);
      o.verified = { ...(o.verified ?? {}), [a.sku]: Math.min(max, (o.verified?.[a.sku] ?? 0) + Math.max(1, a.units)) };
      return s;
    }
    case 'pack.verifyAll': {
      const o = s.orders.find((x) => x.id === a.order);
      if (!o || o.status !== 'picked') return state;
      o.verified = Object.fromEntries(o.lines.map((l) => [l.sku, l.alloc.reduce((x, y) => x + y.picked, 0)]));
      return s;
    }
    case 'pack.ship': {
      const o = s.orders.find((x) => x.id === a.order);
      if (!o || o.status !== 'picked') return state;
      const carrier = CARRIER_BY_ID[a.carrier];
      const q = quotes(o.wh, o.city, a.weightKg).find((x) => x.carrier.id === a.carrier && x.ok);
      if (!q) return state;
      s.seq += 1;
      const id = `${carrier.prefix}${String(7300000 + s.seq * 37).slice(0, 7)}`;
      s.shipments.unshift({
        id,
        order: o.id,
        wh: o.wh,
        carrier: a.carrier,
        city: o.city,
        cost: q.price,
        weightKg: a.weightKg,
        box: a.box,
        etaDays: q.days,
        status: 'created',
        events: [{ status: 'created', at: a.at }],
      });
      o.status = 'shipped';
      o.shipment = id;
      o.shippedAt = a.at;
      if (a.carrier === 'own' && o.stop) {
        const r = s.routes[o.wh];
        const started = r.plan.flat().some((oid) => {
          const sh = s.shipments.find((x) => x.order === oid);
          return sh && sh.status !== 'created';
        });
        const k = r.plan.reduce((best, cur, i) => (cur.length < r.plan[best].length ? i : best), 0);
        r.plan[k].push(o.id);
        if (!started) r.optimized = false;
      }
      addLog(s, o.wh, a.at, 'shipped', { order: o.id, guide: id });
      if (o.wh === 'fun') milestone(s, 'shipped');
      return s;
    }
    case 'ship.advance': {
      const sh = s.shipments.find((x) => x.id === a.shipment);
      if (!sh || sh.carrier === 'own' || sh.status === 'delivered' || sh.status === 'exception') return state;
      const flow: ShipStatus[] = ['created', 'pickedUp', 'inTransit', 'outForDelivery', 'delivered'];
      const next = flow[flow.indexOf(sh.status) + 1];
      if (!next) return state;
      sh.status = next;
      sh.events.push({ status: next, at: a.at });
      if (next === 'delivered') {
        const o = s.orders.find((x) => x.id === sh.order);
        if (o) {
          o.status = 'delivered';
          o.deliveredAt = a.at;
          sh.pod = { name: o.customer, at: a.at };
        }
        if (sh.wh === 'fun') milestone(s, 'delivered');
      }
      return s;
    }
    case 'ship.reschedule': {
      const sh = s.shipments.find((x) => x.id === a.shipment);
      if (!sh || sh.status !== 'exception') return state;
      sh.status = sh.carrier === 'own' ? 'created' : 'outForDelivery';
      sh.failReason = undefined;
      sh.events.push({ status: sh.status, at: a.at, note: 'rescheduled' });
      return s;
    }
    case 'driver.arrive': {
      const sh = s.shipments.find((x) => x.id === a.shipment);
      if (!sh || sh.carrier !== 'own' || sh.status !== 'created') return state;
      sh.status = 'arrived';
      sh.events.push({ status: 'arrived', at: a.at });
      return s;
    }
    case 'driver.deliver': {
      const sh = s.shipments.find((x) => x.id === a.shipment);
      if (!sh || sh.carrier !== 'own' || (sh.status !== 'arrived' && sh.status !== 'created')) return state;
      sh.status = 'delivered';
      sh.pod = a.pod;
      sh.events.push({ status: 'delivered', at: a.pod.at });
      const o = s.orders.find((x) => x.id === sh.order);
      if (o) {
        o.status = 'delivered';
        o.deliveredAt = a.pod.at;
      }
      addLog(s, sh.wh, a.pod.at, 'delivered', { order: sh.order, name: a.pod.name });
      if (sh.wh === 'fun') milestone(s, 'delivered');
      return s;
    }
    case 'driver.fail': {
      const sh = s.shipments.find((x) => x.id === a.shipment);
      if (!sh || sh.carrier !== 'own' || sh.status === 'delivered') return state;
      sh.status = 'exception';
      sh.failReason = a.reason;
      sh.events.push({ status: 'exception', at: a.at, note: a.reason });
      return s;
    }
    case 'driver.retry': {
      const sh = s.shipments.find((x) => x.id === a.shipment);
      if (!sh || sh.status !== 'exception') return state;
      sh.status = 'created';
      sh.failReason = undefined;
      sh.events.push({ status: 'created', at: a.at, note: 'rescheduled' });
      return s;
    }
    case 'routes.apply': {
      s.routes[a.wh] = { ...s.routes[a.wh], plan: a.plan, optimized: true };
      return s;
    }
    case 'routes.start': {
      s.routes[a.wh] = { ...s.routes[a.wh], start: a.start };
      return s;
    }
    case 'count.submit': {
      const c = s.counts.find((x) => x.id === a.task);
      if (!c || c.status !== 'scheduled') return state;
      const lot = s.lots.find((l) => l.id === c.lotId);
      const system = lot?.qty ?? 0;
      c.system = system;
      c.counted = Math.max(0, Math.round(a.counted));
      if (c.counted === system) {
        c.status = 'done';
        c.result = 'match';
        s.countStats[c.wh].total += 1;
        s.countStats[c.wh].match += 1;
        const cls = abcClasses(s.products)[c.sku] ?? 'C';
        s.lastCount[c.wh][cls] = today;
        addLog(s, c.wh, a.at, 'countMatch', { bin: c.bin });
      } else {
        c.status = 'review';
      }
      return s;
    }
    case 'count.approve': {
      const c = s.counts.find((x) => x.id === a.task);
      if (!c || c.status !== 'review' || c.counted === undefined) return state;
      const lot = s.lots.find((l) => l.id === c.lotId);
      if (lot) {
        const diff = c.counted - lot.qty;
        lot.qty = c.counted;
        lot.reserved = Math.min(lot.reserved, lot.qty);
        addMove(s, { at: a.at, wh: c.wh, sku: c.sku, lot: lot.lot, bin: c.bin, qty: diff, type: 'adjust', ref: c.id });
      }
      c.status = 'done';
      c.result = 'adjusted';
      s.countStats[c.wh].total += 1;
      const cls = abcClasses(s.products)[c.sku] ?? 'C';
      s.lastCount[c.wh][cls] = today;
      addLog(s, c.wh, a.at, 'countAdjusted', { bin: c.bin, diff: (c.counted ?? 0) - (c.system ?? 0) });
      return s;
    }
    case 'count.recount': {
      const c = s.counts.find((x) => x.id === a.task);
      if (!c || c.status !== 'review') return state;
      c.status = 'scheduled';
      c.counted = undefined;
      c.system = undefined;
      return s;
    }
    case 'count.generate': {
      const cls = abcClasses(s.products);
      const pending = new Set(s.counts.filter((c) => c.wh === a.wh && c.status !== 'done').map((c) => c.bin));
      const lots = s.lots.filter((l) => l.wh === a.wh && l.qty > 0 && l.status === 'available' && cls[l.sku] === a.cls && !pending.has(l.bin));
      const seen = new Set<string>();
      let n = 0;
      for (const l of lots) {
        if (seen.has(l.bin)) continue;
        seen.add(l.bin);
        s.seq += 1;
        s.counts.push({ id: `CC-${s.seq}`, wh: a.wh, bin: l.bin, lotId: l.id, sku: l.sku, due: today, assignee: PICKERS[n % PICKERS.length], status: 'scheduled' });
        n += 1;
      }
      addLog(s, a.wh, a.at, 'countGenerated', { cls: a.cls, n });
      return s;
    }
    case 'lot.quarantine': {
      const lot = s.lots.find((l) => l.id === a.lot);
      if (!lot || lot.status === 'quarantine' || lot.reserved > 0) return state;
      const sug = suggestBin(s, lot.wh, lot.sku, { quarantine: true });
      addMove(s, { at: a.at, wh: lot.wh, sku: lot.sku, lot: lot.lot, bin: lot.bin, qty: -lot.qty, type: 'quarantine', ref: sug.bin });
      lot.bin = sug.bin;
      lot.status = 'quarantine';
      addMove(s, { at: a.at, wh: lot.wh, sku: lot.sku, lot: lot.lot, bin: sug.bin, qty: lot.qty, type: 'quarantine', ref: 'Q' });
      addLog(s, lot.wh, a.at, 'quarantine', { sku: lot.sku, lot: lot.lot });
      return s;
    }
    case 'lot.release': {
      const lot = s.lots.find((l) => l.id === a.lot);
      if (!lot || lot.status !== 'quarantine' || (lot.expiry && lot.expiry < today)) return state;
      const sug = suggestBin({ ...s, lots: s.lots.filter((l) => l.id !== lot.id) }, lot.wh, lot.sku);
      addMove(s, { at: a.at, wh: lot.wh, sku: lot.sku, lot: lot.lot, bin: sug.bin, qty: lot.qty, type: 'release', ref: lot.bin });
      lot.bin = sug.bin;
      lot.status = 'available';
      addLog(s, lot.wh, a.at, 'released', { sku: lot.sku, lot: lot.lot, bin: sug.bin });
      return s;
    }
    case 'lot.transfer': {
      const lot = s.lots.find((l) => l.id === a.lot);
      if (!lot || lot.wh === a.to) return state;
      const qty = Math.min(availableQty(lot), Math.max(1, Math.round(a.qty)));
      if (qty <= 0) return state;
      lot.qty -= qty;
      const dest = suggestBin(s, a.to, lot.sku);
      putLot(s, { wh: a.to, sku: lot.sku, lot: lot.lot, expiry: lot.expiry, bin: dest.bin, qty, status: 'available' });
      s.seq += 1;
      const ref = `TR-${s.seq}`;
      addMove(s, { at: a.at, wh: lot.wh, sku: lot.sku, lot: lot.lot, bin: lot.bin, qty: -qty, type: 'transferOut', ref });
      addMove(s, { at: a.at, wh: a.to, sku: lot.sku, lot: lot.lot, bin: dest.bin, qty, type: 'transferIn', ref });
      addLog(s, lot.wh, a.at, 'transfer', { sku: lot.sku, qty, to: WAREHOUSE_BY_ID[a.to].name });
      return s;
    }
    case 'products.import': {
      const fresh = a.products.filter((p) => !s.products.some((x) => x.sku === p.sku));
      if (!fresh.length) return state;
      s.products.push(...fresh);
      addLog(s, a.wh, a.at, 'imported', { n: fresh.length });
      return s;
    }
    case 'rma.create': {
      s.seq += 1;
      const id = `DEV-${1100 + s.seq}`;
      s.rmas.unshift({ ...a.rma, id, status: 'requested' });
      addLog(s, a.rma.wh, a.at, 'rmaCreated', { id, order: a.rma.order });
      return s;
    }
    case 'rma.decide': {
      const r = s.rmas.find((x) => x.id === a.id);
      if (!r || r.status !== 'requested') return state;
      r.status = a.approve ? 'approved' : 'rejected';
      r.rejectReason = a.approve ? undefined : a.reason;
      addLog(s, r.wh, a.at, a.approve ? 'rmaApproved' : 'rmaRejected', { id: r.id });
      return s;
    }
    case 'rma.receive': {
      const r = s.rmas.find((x) => x.id === a.id);
      if (!r || r.status !== 'approved') return state;
      const o = s.orders.find((x) => x.id === r.order);
      const srcAlloc = o?.lines.find((l) => l.sku === r.sku)?.alloc[0];
      const srcLot = srcAlloc ? s.lots.find((l) => l.id === srcAlloc.lotId) : undefined;
      const lotCode = srcAlloc?.lot ?? r.id;
      const sug = suggestBin(s, r.wh, r.sku, { quarantine: a.disposition === 'quarantine' });
      putLot(s, { wh: r.wh, sku: r.sku, lot: lotCode, expiry: srcLot?.expiry ?? null, bin: sug.bin, qty: r.qty, status: a.disposition === 'quarantine' ? 'quarantine' : 'available' });
      addMove(s, { at: a.at, wh: r.wh, sku: r.sku, lot: lotCode, bin: sug.bin, qty: r.qty, type: 'return', ref: r.id });
      r.status = 'received';
      r.disposition = a.disposition;
      addLog(s, r.wh, a.at, a.disposition === 'restock' ? 'rmaRestock' : 'rmaQuarantine', { id: r.id, bin: sug.bin });
      return s;
    }
    case 'rma.close': {
      const r = s.rmas.find((x) => x.id === a.id);
      if (!r || r.status !== 'received') return state;
      r.status = 'closed';
      addLog(s, r.wh, a.at, 'rmaClosed', { id: r.id });
      return s;
    }
    case 'xd.advance': {
      const x = s.crossDock.find((c) => c.id === a.id);
      if (!x || x.step === 'done') return state;
      if (x.step === 'sort') x.step = 'consolidate';
      else if (x.step === 'consolidate') x.step = 'dispatch';
      else {
        const o = s.orders.find((ord) => ord.id === x.order);
        if (!o) return state;
        for (const ln of o.lines) ln.alloc = [{ lotId: '', bin: 'MUELLE', lot: '', qty: ln.qty, picked: ln.qty, short: 0 }];
        const net = orderNetKg(o, pm);
        const box = boxFor(net);
        const kg = Math.round((net + BOX_TARE[box]) * 100) / 100;
        const list = quotes(o.wh, o.city, kg).filter((q) => q.ok);
        const q = list.find((c) => c.carrier.id === s.preferred[o.wh]) ?? list[0];
        if (!q) return state;
        s.seq += 1;
        const id = `${q.carrier.prefix}${String(7300000 + s.seq * 37).slice(0, 7)}`;
        s.shipments.unshift({ id, order: o.id, wh: o.wh, carrier: q.carrier.id, city: o.city, cost: q.price, weightKg: kg, box, etaDays: q.days, status: 'created', events: [{ status: 'created', at: a.at }] });
        o.status = 'shipped';
        o.shipment = id;
        o.pickedAt = a.at;
        o.shippedAt = a.at;
        x.step = 'done';
        addLog(s, x.wh, a.at, 'xdShipped', { order: o.id, guide: id });
      }
      return s;
    }
    case 'kit.build': {
      const kit = pm[KIT_SKU];
      if (!kit?.kit) return state;
      const qty = Math.max(1, Math.round(a.qty));
      const consumed: { lot: Lot; qty: number }[] = [];
      for (const comp of kit.kit) {
        const { alloc, missing } = allocateFefo(s.lots, 'fun', comp.sku, comp.qty * qty, today);
        if (missing > 0) return state;
        for (const al of alloc) consumed.push({ lot: s.lots.find((l) => l.id === al.lotId)!, qty: al.qty });
      }
      let minExpiry: string | null = null;
      for (const c of consumed) {
        c.lot.qty -= c.qty;
        if (c.lot.expiry && (!minExpiry || c.lot.expiry < minExpiry)) minExpiry = c.lot.expiry;
      }
      s.seq += 1;
      const lotCode = `KB${today.slice(2, 4)}${today.slice(5, 7)}-${s.seq}`;
      for (const c of consumed) addMove(s, { at: a.at, wh: 'fun', sku: c.lot.sku, lot: c.lot.lot, bin: c.lot.bin, qty: -c.qty, type: 'kitConsume', ref: lotCode });
      const sug = suggestBin(s, 'fun', KIT_SKU);
      putLot(s, { wh: 'fun', sku: KIT_SKU, lot: lotCode, expiry: minExpiry, bin: sug.bin, qty, status: 'available' });
      addMove(s, { at: a.at, wh: 'fun', sku: KIT_SKU, lot: lotCode, bin: sug.bin, qty, type: 'kitBuild', ref: lotCode });
      addLog(s, 'fun', a.at, 'kits', { qty, bin: sug.bin });
      return s;
    }
    case 'carrier.prefer': {
      s.preferred[a.wh] = a.carrier;
      return s;
    }
    case 'tariff.set': {
      if (!Number.isFinite(a.value) || a.value < 0) return state;
      s.tariffs[a.client] = { ...s.tariffs[a.client], [a.field]: Math.round(a.value) };
      return s;
    }
    case 'order.add': {
      s.orders.unshift(a.order);
      addLog(s, a.order.wh, a.at, 'orderIn', { order: a.order.id, channel: a.order.channel });
      return s;
    }
    default:
      return state;
  }
}

export const __test = { reducer };

/* ---------------- Contexto ---------------- */

export interface Toast {
  id: number;
  text: string;
  tone: 'ok' | 'warn' | 'error';
}

export interface Nav {
  view: ViewId;
  wh: WarehouseId;
  /** Elemento a resaltar al abrir una vista (pedido, SKU, OC, guía…). */
  focus?: string;
}

interface Ctx {
  state: WmsState;
  dispatch: (a: Action) => void;
  today: ISODate;
  lang: Lang;
  nav: Nav;
  go: (view: ViewId, opts?: { wh?: WarehouseId; focus?: string }) => void;
  setWh: (wh: WarehouseId) => void;
  notify: (text: string, tone?: Toast['tone']) => void;
  toasts: Toast[];
  reset: () => void;
  saved: boolean;
}

const WmsContext = createContext<Ctx | null>(null);

export function useWms(): Ctx {
  const c = useContext(WmsContext);
  if (!c) throw new Error('useWms fuera de WmsProvider');
  return c;
}

export function now(): ISODateTime {
  return localNow();
}

const VIEW_IDS: ViewId[] = ['dashboard', 'receiving', 'crossdock', 'map', 'stock', 'counts', 'orders', 'picking', 'packing', 'carriers', 'routes', 'driver', 'tracking', 'returns', 'billing'];

function readUi(): Nav {
  const fallback: Nav = { view: 'dashboard', wh: 'fun' };
  if (typeof window === 'undefined') return fallback;
  try {
    const ui = JSON.parse(window.localStorage.getItem(UI_KEY) || 'null');
    if (ui && VIEW_IDS.includes(ui.view) && ['fun', 'ita', 'baq'].includes(ui.wh)) return { view: ui.view, wh: ui.wh };
  } catch {
    /* sin preferencias guardadas */
  }
  return fallback;
}

function readStored(): WmsState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WmsState;
    if (parsed?.version !== STATE_VERSION) return null;
    if (parsed.baseDate !== dateOf(localNow())) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function WmsProvider({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const lang: Lang = locale === 'en' ? 'en' : 'es';
  const [state, dispatch] = useReducer(reducer, null);
  // La vista y la bodega elegidas se recuerdan en este navegador. Leerlas aquí no
  // afecta la hidratación: mientras no hay estado se muestra el esqueleto de carga.
  const [nav, setNav] = useState<Nav>(readUi);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [saved, setSaved] = useState(true);
  const toastSeq = useRef(0);

  useEffect(() => {
    const stored = readStored();
    if (stored) dispatch({ type: 'load', state: stored });
    else dispatch({ type: 'reset', now: localNow() });
  }, []);

  useEffect(() => {
    if (!state) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }, [state]);

  useEffect(() => {
    try {
      window.localStorage.setItem(UI_KEY, JSON.stringify({ view: nav.view, wh: nav.wh }));
    } catch {
      /* almacenamiento no disponible */
    }
  }, [nav.view, nav.wh]);

  const notify = useCallback((text: string, tone: Toast['tone'] = 'ok') => {
    toastSeq.current += 1;
    const id = toastSeq.current;
    setToasts((prev) => [...prev.slice(-2), { id, text, tone }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4200);
  }, []);

  const go = useCallback((view: ViewId, opts?: { wh?: WarehouseId; focus?: string }) => {
    setNav((n) => ({ view, wh: opts?.wh ?? n.wh, focus: opts?.focus }));
    if (typeof window !== 'undefined') {
      // Lleva la vista al área de trabajo si quedó fuera de la pantalla (p. ej. desde el recorrido).
      const el = document.getElementById('wms-workspace');
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top < 0 || rect.top > window.innerHeight * 0.6) {
          window.scrollTo({ top: rect.top + window.scrollY - 80, behavior: 'smooth' });
        }
      }
    }
  }, []);

  const setWh = useCallback((wh: WarehouseId) => setNav((n) => ({ ...n, wh, focus: undefined })), []);

  const reset = useCallback(() => {
    dispatch({ type: 'reset', now: localNow() });
    setNav({ view: 'dashboard', wh: 'fun' });
  }, []);

  const value = useMemo<Ctx | null>(
    () => (state ? { state, dispatch, today: state.baseDate, lang, nav, go, setWh, notify, toasts, reset, saved } : null),
    [state, lang, nav, go, setWh, notify, toasts, reset, saved],
  );

  if (!value) return <WmsLoading />;
  return <WmsContext.Provider value={value}>{children}</WmsContext.Provider>;
}

function WmsLoading() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true">
      <div className="h-28 rounded-2xl bg-secondary-200/60 dark:bg-secondary-800/60" />
      <div className="h-64 rounded-2xl bg-secondary-200/60 dark:bg-secondary-800/60" />
    </div>
  );
}

/** Cantidad disponible para alistar de un lote (helper para la UI). */
export { availableQty, fefoSort };
export { BIN_BY_ID };
