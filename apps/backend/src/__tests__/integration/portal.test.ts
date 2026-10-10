/**
 * Portal del cliente y operación del panel (integración, supertest):
 *  - consecutivos asignados antes de validar (factura, entregable,
 *    conversación, mensaje, pedido) y sin repetirse con guardados simultáneos;
 *  - pedido nuevo → conversación automática con el resumen, fecha en Colombia;
 *  - aprobar, rechazar o cambiar el estado → notificación al cliente y
 *    mensaje en la conversación del pedido;
 *  - factura a nombre del CLIENTE (desde pedido, proyecto o cliente), sin
 *    duplicados, con datos para el PDF solo para el dueño o el equipo;
 *  - proyecto para un cliente (el prospecto pasa a cliente) con conversación
 *    y aviso; el cliente ya no crea ni edita proyectos;
 *  - entregables (archivo o enlace) a nombre del cliente, descarga solo para
 *    el dueño o el equipo, revisión del cliente;
 *  - conversaciones: no leídos con lean(), respuesta desde el panel y aviso;
 *  - preferencias de correo respetadas por los envíos.
 */
import fs from 'fs';
import path from 'path';
import request from 'supertest';
import type { Express } from 'express';
import mongoose from 'mongoose';
import { TestUser, bearer, connectTestDb, createUser, describeDb, disconnectTestDb } from './helpers';

const oid = (id: string) => new mongoose.Types.ObjectId(id);

describeDb('portal del cliente y operación del panel (integración)', () => {
  let app: Express;
  let admin: TestUser;
  let manager: TestUser;
  let developer: TestUser;
  let client: TestUser;
  let other: TestUser;
  let emailService: typeof import('../../services/email.service').emailService;
  const createdFiles: string[] = [];

  beforeAll(async () => {
    await connectTestDb('portal');
    const { createApp } = await import('../../app');
    app = createApp();
    emailService = (await import('../../services/email.service')).emailService;
    admin = await createUser('admin');
    manager = await createUser('manager');
    developer = await createUser('developer');
    client = await createUser('client');
    other = await createUser('user');
    fs.mkdirSync(path.resolve('uploads/orders'), { recursive: true });
    fs.mkdirSync(path.resolve('uploads/deliverables'), { recursive: true });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    for (const f of createdFiles) fs.rmSync(f, { force: true });
    await disconnectTestDb();
  });

  const notifications = (userId: string) => mongoose.connection.collection('notifications').find({ userId }).sort({ created_at: 1 }).toArray();

  async function createOrderAsClient(user: TestUser, name = 'Sitio corporativo') {
    const res = await request(app)
      .post('/api/orders')
      .set(bearer(user))
      .field('name', name)
      .field('description', 'Sitio con 5 secciones')
      .field('comments', 'Necesito formulario de contacto')
      .field('items', JSON.stringify([{ name: 'Diseño', quantity: 1, price: 300 }, { name: 'Desarrollo', quantity: 2, price: 450.5 }]));
    expect(res.status).toBe(201);
    return res.body.data as { id: string; amount: number };
  }

  // -------------------------------------------------------------------------
  describe('consecutivos', () => {
    it('factura, entregable, conversación y mensaje reciben su número antes de validar', async () => {
      const Invoice = (await import('../../models/Invoice')).default;
      const Deliverable = (await import('../../models/Deliverable')).default;
      const Conversation = (await import('../../models/Conversation')).default;
      const Message = (await import('../../models/Message')).default;
      const inv = await Invoice.create({
        userId: oid(client.id),
        clientInfo: { name: 'Cliente', email: client.email },
        items: [{ description: 'Servicio', quantity: 1, unitPrice: 10, total: 10 }],
        subtotal: 10,
        taxAmount: 1.9,
        total: 11.9,
        dueDate: new Date(Date.now() + 86400000),
      });
      expect(inv.invoiceNumber).toMatch(/^FAC-\d{4}-\d{4}$/);
      const del = await Deliverable.create({
        projectId: new mongoose.Types.ObjectId(),
        userId: oid(client.id),
        title: 'Documento',
        type: 'documentation',
        fileUrl: 'https://ejemplo.test/doc',
        fileName: 'doc',
        fileSize: 0,
        uploadedBy: oid(admin.id),
      });
      expect(del.deliverableId).toMatch(/^DEL-\d{4}$/);
      const conv = await Conversation.create({
        title: 'Prueba',
        participants: [{ userId: oid(client.id), role: 'client', name: 'Cliente', email: client.email }],
        createdBy: oid(admin.id),
      });
      expect(conv.conversationId).toMatch(/^CONV-\d{4}$/);
      const msg = await Message.create({ conversationId: conv._id, sender: oid(admin.id), senderName: 'Equipo', senderRole: 'admin', content: 'Hola' });
      expect(msg.messageId).toMatch(/^MSG-\d{6}$/);
    });

    it('guardados simultáneos no repiten número', async () => {
      const Conversation = (await import('../../models/Conversation')).default;
      const docs = await Promise.all(
        Array.from({ length: 12 }, (_, i) =>
          Conversation.create({
            title: `Simultánea ${i}`,
            participants: [{ userId: oid(client.id), role: 'client', name: 'Cliente', email: client.email }],
            createdBy: oid(admin.id),
          }),
        ),
      );
      const ids = docs.map((d) => d.conversationId);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('el contador respeta los números que ya existían (sin choque de índice único)', async () => {
      const { resetSequenceSyncCache } = await import('../../utils/sequence');
      await mongoose.connection.collection('counters').deleteOne({ _id: 'order' });
      resetSequenceSyncCache();
      await mongoose.connection.collection('orders').insertOne({
        orderId: 'ORD-0001',
        name: 'Antiguo',
        userId: oid(other.id),
        amount: 1,
        items: [{ name: 'x', quantity: 1, price: 1 }],
        status: 'pending',
        orderDate: new Date(),
        history: [],
      });
      const created = await createOrderAsClient(other, 'Después del antiguo');
      expect(created.id).not.toBe('ORD-0001');
      expect(created.id).toMatch(/^ORD-\d{4}$/);
    });
  });

  // -------------------------------------------------------------------------
  describe('pedidos', () => {
    it('crear un pedido deja la conversación automática con el resumen y avisa en Mensajes', async () => {
      const order = await createOrderAsClient(client);
      expect(order.amount).toBe(1201);
      const stored = await mongoose.connection.collection('orders').findOne({ orderId: order.id });
      expect(stored?.conversationId).toBeTruthy();
      const conv = await mongoose.connection.collection('conversations').findOne({ _id: stored!.conversationId });
      expect(conv?.title).toContain(order.id);
      expect(conv?.participants.map((p: any) => p.role)).toEqual(['client']);
      const messages = await mongoose.connection.collection('messages').find({ conversationId: conv!._id }).toArray();
      expect(messages).toHaveLength(1);
      expect(messages[0].content).toMatch(/Ítems:[\s\S]*Diseño/);

      const list = await request(app).get('/api/messages/conversations').set(bearer(client));
      expect(list.status).toBe(200);
      expect(list.body.data.find((c: any) => c.id === conv!.conversationId)).toMatchObject({ unreadCount: 0, orderId: order.id });

      const detail = await request(app).get(`/api/orders/${order.id}`).set(bearer(client));
      expect(detail.body.data.conversationId).toBe(conv!.conversationId);
    });

    it('moneda del pedido (COP o USD), detalle del cliente y factura en el detalle', async () => {
      const cop = await request(app)
        .post('/api/orders')
        .set(bearer(client))
        .field('name', 'Pedido en pesos')
        .field('currency', 'COP')
        .field('comments', 'Detalle del proyecto en pesos')
        .field('items', JSON.stringify([{ name: 'Landing', quantity: 1, price: 2500000 }]));
      expect(cop.status).toBe(201);
      expect(cop.body.data.currency).toBe('COP');
      const bad = await request(app)
        .post('/api/orders')
        .set(bearer(client))
        .field('name', 'Moneda rara')
        .field('currency', 'EUR')
        .field('items', JSON.stringify([{ name: 'x', quantity: 1, price: 1 }]));
      expect(bad.status).toBe(400);
      expect(bad.body.code).toBe('invalid_currency');

      const detail = await request(app).get(`/api/orders/${cop.body.data.id}`).set(bearer(client));
      expect(detail.body.data).toMatchObject({ currency: 'COP', detail: 'Detalle del proyecto en pesos', invoice: null, editable: true });

      expect((await request(app).post(`/api/admin/orders/${cop.body.data.id}/approve`).set(bearer(admin))).status).toBe(200);
      const inv = await request(app).post(`/api/admin/orders/${cop.body.data.id}/invoice`).set(bearer(admin)).send({});
      expect(inv.status).toBe(201);
      const after = await request(app).get(`/api/orders/${cop.body.data.id}`).set(bearer(client));
      expect(after.body.data.invoice).toMatchObject({ invoiceNumber: inv.body.data.invoiceNumber, status: 'pending' });
      expect(after.body.data.editable).toBe(false);
    });

    it('rechaza ítems inválidos y no liga proyectos ajenos', async () => {
      const bad = await request(app).post('/api/orders').set(bearer(client)).field('name', 'Malo').field('items', JSON.stringify([{ name: 'x', quantity: 0, price: 1 }]));
      expect(bad.status).toBe(400);
      expect(bad.body.code).toBe('invalid_items');
      const Project = (await import('../../models/Project')).default;
      const foreign = await Project.create({ name: 'Ajeno', client_id: oid(other.id) });
      const res = await request(app)
        .post('/api/orders')
        .set(bearer(client))
        .field('name', 'Con proyecto ajeno')
        .field('projectId', String(foreign._id))
        .field('items', JSON.stringify([{ name: 'x', quantity: 1, price: 1 }]));
      expect(res.status).toBe(201);
      expect((await mongoose.connection.collection('orders').findOne({ orderId: res.body.data.id }))?.projectId).toBeNull();
    });

    it('la fecha del pedido es el día en Colombia (no el de UTC)', async () => {
      const order = await createOrderAsClient(client, 'Pedido nocturno');
      // 9 de octubre, 9:00 p. m. en Bogotá = 10 de octubre 02:00 UTC.
      await mongoose.connection.collection('orders').updateOne({ orderId: order.id }, { $set: { orderDate: new Date('2026-10-10T02:00:00Z') } });
      const list = await request(app).get('/api/orders').set(bearer(client));
      expect(list.body.data.find((o: any) => o.id === order.id).date).toBe('2026-10-09');
      const adminList = await request(app).get('/api/admin/orders').set(bearer(admin));
      expect(adminList.body.data.find((o: any) => o.id === order.id).date).toBe('2026-10-09');
    });

    it('aprobar, cambiar de estado y rechazar avisan al cliente y dejan mensaje en la conversación', async () => {
      const order = await createOrderAsClient(client, 'Pedido con avisos');
      const before = (await notifications(client.id)).length;

      expect((await request(app).post(`/api/admin/orders/${order.id}/approve`).set(bearer(manager))).status).toBe(200);
      expect((await request(app).patch(`/api/admin/orders/${order.id}/status`).set(bearer(admin)).send({ status: 'in_progress' })).status).toBe(200);
      const notes = (await notifications(client.id)).slice(before);
      expect(notes.map((n) => n.metadata.evento)).toEqual(['order_approved', 'order_status']);
      expect(notes[1]).toMatchObject({ type: 'order', actionUrl: `/dashboard/orders/${order.id}` });
      expect(notes[1].metadata.params).toMatchObject({ id: order.id, status: 'in_progress' });

      const stored = await mongoose.connection.collection('orders').findOne({ orderId: order.id });
      const msgs = await mongoose.connection.collection('messages').find({ conversationId: stored!.conversationId }).toArray();
      expect(msgs.map((m) => m.type)).toEqual(['text', 'system', 'system']);
      expect(msgs[2].content).toMatch(/En proceso/);

      expect((await request(app).post(`/api/admin/orders/${order.id}/reject`).set(bearer(admin)).send({})).status).toBe(400);
      const rej = await request(app).post(`/api/admin/orders/${order.id}/reject`).set(bearer(admin)).send({ reason: 'Fuera de alcance' });
      expect(rej.status).toBe(200);
      expect((await notifications(client.id)).at(-1)?.metadata.evento).toBe('order_rejected');
    });
  });

  // -------------------------------------------------------------------------
  describe('facturas', () => {
    it('desde un pedido: queda a nombre del cliente, sin duplicados, y avisa', async () => {
      const order = await createOrderAsClient(client, 'Pedido facturable');
      const res = await request(app).post(`/api/admin/orders/${order.id}/invoice`).set(bearer(admin)).send({});
      expect(res.status).toBe(201);
      const inv = res.body.data;
      expect(inv.invoiceNumber).toMatch(/^FAC-\d{4}-\d{4}$/);
      expect(inv).toMatchObject({ orderId: order.id, subtotal: 1201, taxAmount: 228.19, total: 1429.19, currency: 'USD', status: 'pending' });
      expect(inv.client).toMatchObject({ id: client.id, email: client.email });
      const stored = await mongoose.connection.collection('invoices').findOne({ invoiceNumber: inv.invoiceNumber });
      expect(String(stored?.userId)).toBe(client.id);
      expect(String(stored?.createdBy)).toBe(admin.id);

      const dup = await request(app).post(`/api/admin/orders/${order.id}/invoice`).set(bearer(admin)).send({});
      expect(dup.status).toBe(409);
      expect(dup.body.code).toBe('invoice_exists');

      const mine = await request(app).get('/api/invoices').set(bearer(client));
      expect(mine.body.data.map((i: any) => i.invoiceNumber)).toContain(inv.invoiceNumber);
      expect((await notifications(client.id)).at(-1)).toMatchObject({ type: 'billing', actionUrl: '/dashboard/billing' });
      expect((await notifications(client.id)).at(-1)?.metadata.evento).toBe('invoice_issued');
    });

    it('datos del PDF: dueño y equipo sí, otra cuenta no', async () => {
      const res = await request(app)
        .post('/api/invoices')
        .set(bearer(manager))
        .send({ clientId: client.id, items: [{ description: 'Consultoría', quantity: 2, unitPrice: 150000 }], currency: 'COP', taxRate: 0, dueDate: '2099-01-31' });
      expect(res.status).toBe(201);
      const id = res.body.data.id;
      expect(res.body.data).toMatchObject({ total: 300000, taxAmount: 0, currency: 'COP', dueDate: '2099-01-31' });
      const own = await request(app).get(`/api/invoices/${id}/download`).set(bearer(client));
      expect(own.status).toBe(200);
      expect(own.body.data).toMatchObject({ fileName: `factura-${res.body.data.invoiceNumber}.pdf`, items: [{ description: 'Consultoría', quantity: 2, unitPrice: 150000, total: 300000 }] });
      expect(own.headers['cache-control']).toMatch(/no-store/);
      expect((await request(app).get(`/api/invoices/${id}/download`).set(bearer(admin))).status).toBe(200);
      expect((await request(app).get(`/api/invoices/${id}/download`).set(bearer(other))).status).toBe(403);
      expect((await request(app).get(`/api/invoices/${id}`).set(bearer(manager))).status).toBe(200);
      expect((await request(app).get(`/api/invoices/${id}`).set(bearer(other))).status).toBe(403);
    });

    it('valida el cliente: cuenta del equipo, proyecto de otro cliente o sin cliente → 400', async () => {
      const items = [{ description: 'x', quantity: 1, unitPrice: 1 }];
      expect((await request(app).post('/api/invoices').set(bearer(admin)).send({ items })).body.code).toBe('client_required');
      expect((await request(app).post('/api/invoices').set(bearer(admin)).send({ clientId: manager.id, items })).body.code).toBe('client_is_staff');
      const Project = (await import('../../models/Project')).default;
      const p = await Project.create({ name: 'De otro', client_id: oid(other.id) });
      const mismatch = await request(app).post('/api/invoices').set(bearer(admin)).send({ clientId: client.id, projectId: String(p._id), items });
      expect(mismatch.status).toBe(400);
      expect(mismatch.body.code).toBe('client_mismatch');
      expect((await request(app).post('/api/invoices').set(bearer(client)).send({ clientId: client.id, items })).status).toBe(403);
    });

    it('vencida, pago registrado y anulación', async () => {
      const res = await request(app).post('/api/invoices').set(bearer(admin)).send({ clientId: client.id, items: [{ description: 'Hosting', quantity: 1, unitPrice: 100 }] });
      const id = res.body.data.id;
      await mongoose.connection.collection('invoices').updateOne({ _id: oid(id) }, { $set: { dueDate: new Date(Date.now() - 3 * 86400000) } });
      const overdue = await request(app).get('/api/admin/invoices').query({ status: 'overdue' }).set(bearer(admin));
      expect(overdue.body.data.map((i: any) => i.id)).toContain(id);
      expect((await request(app).post(`/api/invoices/${id}/pay`).set(bearer(admin)).send({ paymentMethod: 'transferencia' })).status).toBe(200);
      expect((await notifications(client.id)).at(-1)?.metadata.evento).toBe('invoice_paid');
      expect((await request(app).post(`/api/invoices/${id}/cancel`).set(bearer(admin)).send({ motivo: 'Error' })).status).toBe(409);
    });
  });

  // -------------------------------------------------------------------------
  describe('proyectos', () => {
    it('el equipo crea el proyecto de un prospecto: pasa a cliente, conversación y aviso', async () => {
      const prospect = await createUser('prospect');
      const res = await request(app)
        .post('/api/admin/projects')
        .set(bearer(manager))
        .send({ clientId: prospect.id, name: 'Chatbot RAG', budget: 12000000, currency: 'COP', startDate: '2026-10-01', endDate: '2026-12-15', welcomeMessage: 'Bienvenido a tu proyecto' });
      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({ name: 'Chatbot RAG', status: 'planning', currency: 'COP', startDate: '2026-10-01', endDate: '2026-12-15', client: { id: prospect.id } });
      expect((await mongoose.connection.collection('users').findOne({ _id: oid(prospect.id) }))?.role).toBe('client');
      const audit = await mongoose.connection.collection('auditlogs').find({ 'entidad.id': prospect.id, accion: 'user.role_change' }).toArray();
      expect(audit).toHaveLength(1);

      const conv = await mongoose.connection.collection('conversations').findOne({ projectId: oid(res.body.data.id) });
      expect(conv?.participants.map((p: any) => p.role).sort()).toEqual(['client', 'support']);
      expect((await notifications(prospect.id)).map((n) => n.metadata.evento)).toEqual(['message_new', 'project_created']);

      const mine = await request(app).get('/api/projects').set(bearer(prospect));
      expect(mine.body.data).toHaveLength(1);
      expect(mine.body.data[0]).toMatchObject({ name: 'Chatbot RAG', conversation_id: conv!.conversationId, deliverables_count: 0, invoices_count: 0 });

      const upd = await request(app).patch(`/api/admin/projects/${res.body.data.id}`).set(bearer(admin)).send({ status: 'active', progress: 20 });
      expect(upd.status).toBe(200);
      expect((await notifications(prospect.id)).at(-1)?.metadata).toMatchObject({ evento: 'project_status', params: { status: 'active' } });

      const list = await request(app).get('/api/admin/projects').query({ q: 'Chatbot' }).set(bearer(manager));
      expect(list.body.data[0]).toMatchObject({ name: 'Chatbot RAG', conversation: conv!.conversationId, progress: 20 });
      expect((await request(app).get('/api/admin/projects').set(bearer(developer))).status).toBe(403);
    });

    it('no acepta cuentas del equipo como cliente ni fechas invertidas', async () => {
      expect((await request(app).post('/api/admin/projects').set(bearer(admin)).send({ clientId: manager.id, name: 'Interno' })).body.code).toBe('client_is_staff');
      const bad = await request(app).post('/api/admin/projects').set(bearer(admin)).send({ clientId: client.id, name: 'Fechas', startDate: '2026-12-01', endDate: '2026-11-01' });
      expect(bad.status).toBe(400);
      expect(bad.body.code).toBe('invalid_dates');
    });

    it('el buscador de clientes devuelve solo cuentas de cliente', async () => {
      const res = await request(app).get('/api/admin/clients').set(bearer(admin));
      const roles = new Set(res.body.data.map((u: any) => u.role));
      expect([...roles].every((r) => ['client', 'user', 'prospect'].includes(r as string))).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  describe('entregables', () => {
    let projectId: string;
    beforeAll(async () => {
      const res = await request(app).post('/api/admin/projects').set(bearer(admin)).send({ clientId: client.id, name: 'Proyecto con entregables' });
      projectId = res.body.data.id;
    });

    it('archivo: queda a nombre del cliente y solo el dueño o el equipo lo descargan', async () => {
      const res = await request(app)
        .post('/api/deliverables')
        .set(bearer(developer))
        .field('projectId', projectId)
        .field('title', 'Manual de usuario')
        .field('type', 'documentation')
        .attach('file', Buffer.from('contenido del manual'), 'manual.txt');
      expect(res.status).toBe(201);
      const d = res.body.data;
      expect(d).toMatchObject({ title: 'Manual de usuario', status: 'in_review', storage: 'file', url: null, client: { id: client.id }, project: { id: projectId } });
      const stored = await mongoose.connection.collection('deliverables').findOne({ deliverableId: d.id });
      expect(String(stored?.userId)).toBe(client.id);
      createdFiles.push(path.resolve(`.${stored!.fileUrl}`));

      const dl = await request(app).get(`/api/deliverables/${d.id}/download`).set(bearer(client)).buffer(true).parse((r, cb) => {
        let data = '';
        r.on('data', (c) => (data += c));
        r.on('end', () => cb(null, data));
      });
      expect(dl.status).toBe(200);
      expect(dl.headers['content-disposition']).toMatch(/attachment; filename="manual.txt"/);
      expect(dl.body).toBe('contenido del manual');
      expect((await request(app).get(`/api/deliverables/${d.id}/download`).set(bearer(other))).status).toBe(403);
      expect((await notifications(client.id)).at(-1)?.metadata.evento).toBe('deliverable_uploaded');

      const mine = await request(app).get('/api/deliverables').set(bearer(client));
      expect(mine.body.data.map((x: any) => x.id)).toContain(d.id);
      expect((await request(app).get('/api/deliverables').set(bearer(developer))).body.data).toHaveLength(0);
    });

    it('enlace https, revisión del cliente y validaciones', async () => {
      const bad = await request(app).post('/api/deliverables').set(bearer(admin)).send({ projectId, title: 'X', type: 'code', link: 'http://inseguro.test' });
      expect(bad.status).toBe(400);
      expect(bad.body.code).toBe('invalid_link');
      expect((await request(app).post('/api/deliverables').set(bearer(client)).send({ projectId, title: 'X', type: 'code', link: 'https://a.test' })).status).toBe(403);
      const res = await request(app).post('/api/deliverables').set(bearer(admin)).send({ projectId, title: 'Repositorio', type: 'code', link: 'https://git.ejemplo.test/repo' });
      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({ storage: 'link', url: 'https://git.ejemplo.test/repo' });
      const id = res.body.data.id;
      const link = await request(app).get(`/api/deliverables/${id}/download`).set(bearer(client));
      expect(link.body.data).toEqual({ storage: 'link', url: 'https://git.ejemplo.test/repo' });
      expect((await request(app).post(`/api/deliverables/${id}/reject`).set(bearer(client)).send({})).body.code).toBe('comments_required');
      expect((await request(app).post(`/api/deliverables/${id}/approve`).set(bearer(client)).send({})).status).toBe(200);
      expect((await request(app).post(`/api/deliverables/${id}/approve`).set(bearer(client)).send({})).status).toBe(409);
      expect((await request(app).put(`/api/deliverables/${id}`).set(bearer(client)).send({ title: 'Otro' })).status).toBe(403);
    });
  });

  // -------------------------------------------------------------------------
  describe('conversaciones', () => {
    it('el equipo responde desde el panel; no leídos para el cliente y para el equipo', async () => {
      const order = await createOrderAsClient(client, 'Pedido para conversar');
      const stored = await mongoose.connection.collection('orders').findOne({ orderId: order.id });
      const conv = await mongoose.connection.collection('conversations').findOne({ _id: stored!.conversationId });
      const id = conv!.conversationId as string;

      const list = await request(app).get('/api/admin/conversations').query({ q: order.id }).set(bearer(manager));
      expect(list.status).toBe(200);
      // El pedido nuevo llega sin leer para el equipo.
      expect(list.body.data[0]).toMatchObject({ id, orderId: order.id, teamUnread: 1 });

      const reply = await request(app).post(`/api/admin/conversations/${id}/messages`).set(bearer(manager)).send({ content: 'Hola, ya revisamos tu pedido.' });
      expect(reply.status).toBe(201);
      expect((await request(app).get('/api/admin/conversations').query({ q: order.id }).set(bearer(manager))).body.data[0].teamUnread).toBe(0);
      expect((await request(app).post(`/api/admin/conversations/${id}/messages`).set(bearer(manager)).send({ content: '  ' })).status).toBe(400);
      const forClient = await request(app).get('/api/messages/conversations').set(bearer(client));
      expect(forClient.body.data.find((c: any) => c.id === id).unreadCount).toBe(1);
      expect((await notifications(client.id)).at(-1)).toMatchObject({ type: 'message', actionUrl: `/dashboard/messages?c=${encodeURIComponent(id)}` });

      // Segundo mensaje sin leer: no repite el aviso.
      const count = (await notifications(client.id)).length;
      await request(app).post(`/api/admin/conversations/${id}/messages`).set(bearer(manager)).send({ content: 'Otro mensaje' });
      expect((await notifications(client.id)).length).toBe(count);

      expect((await request(app).post(`/api/messages/conversations/${id}/read`).set(bearer(client))).status).toBe(200);
      const send = await request(app).post('/api/messages/send').set(bearer(client)).send({ conversationId: id, content: 'Gracias' });
      expect(send.status).toBe(201);
      const afterClient = await request(app).get('/api/admin/conversations').query({ q: order.id }).set(bearer(admin));
      expect(afterClient.body.data[0].teamUnread).toBe(1);
      const detail = await request(app).get(`/api/admin/conversations/${id}`).set(bearer(admin));
      expect(detail.body.data.messages.map((m: any) => m.senderRole)).toEqual(['client', 'support', 'support', 'client']);
      const read = await request(app).get('/api/admin/conversations').query({ q: order.id }).set(bearer(admin));
      expect(read.body.data[0].teamUnread).toBe(0);

      expect((await request(app).patch(`/api/admin/conversations/${id}/status`).set(bearer(admin)).send({ status: 'archived' })).status).toBe(200);
      expect((await request(app).post('/api/messages/send').set(bearer(other)).send({ conversationId: id, content: 'Intruso' })).status).toBe(403);
    });

    it('el equipo abre una conversación con un cliente con primer mensaje', async () => {
      const res = await request(app).post('/api/messages/conversations').set(bearer(admin)).send({ clientId: client.id, title: 'Seguimiento', message: '¿Cómo vas con la revisión?' });
      expect(res.status).toBe(201);
      const conv = await request(app).get(`/api/messages/conversations/${res.body.data.id}`).set(bearer(client));
      expect(conv.status).toBe(200);
      expect(conv.body.data.messages[0]).toMatchObject({ content: '¿Cómo vas con la revisión?', senderRole: 'admin', isOwnMessage: false });
      expect((await request(app).post('/api/messages/conversations').set(bearer(admin)).send({ clientId: manager.id, title: 'x' })).body.code).toBe('client_is_staff');
    });

    it('el cliente le escribe al equipo: conversación propia, no leída para el equipo y con límite diario', async () => {
      const cliente = await createUser('client');
      // Un cliente no usa la ruta del equipo.
      expect((await request(app).post('/api/messages/conversations').set(bearer(cliente)).send({ clientId: cliente.id, title: 'x' })).status).toBe(403);
      expect((await request(app).post('/api/messages/conversations/support').set(bearer(cliente)).send({ title: 'Duda', message: '  ' })).status).toBe(400);
      // Un pedido ajeno no se liga.
      const ajeno = await createOrderAsClient(client, 'Pedido de otro cliente');
      const res = await request(app)
        .post('/api/messages/conversations/support')
        .set(bearer(cliente))
        .send({ title: 'Duda sobre facturación', message: '¿Puedo pagar en dos cuotas?', orderId: ajeno.id });
      expect(res.status).toBe(201);
      const id = res.body.data.id as string;
      expect(id).toMatch(/^CONV-\d{4,}$/);
      const stored = await mongoose.connection.collection('conversations').findOne({ conversationId: id });
      expect(stored?.orderId ?? null).toBeNull();
      expect(stored?.participants.map((p: any) => p.role)).toEqual(['client']);

      const mine = await request(app).get('/api/messages/conversations').set(bearer(cliente));
      expect(mine.body.data.map((c: any) => c.id)).toContain(id);
      const panel = await request(app).get('/api/admin/conversations').query({ q: 'Duda sobre facturación' }).set(bearer(manager));
      expect(panel.body.data[0]).toMatchObject({ id, teamUnread: 1 });
      // Otra cuenta no la ve.
      expect((await request(app).get(`/api/messages/conversations/${id}`).set(bearer(other))).status).toBe(403);
      // El equipo no usa la ruta del cliente.
      expect((await request(app).post('/api/messages/conversations/support').set(bearer(admin)).send({ title: 'x', message: 'y' })).status).toBe(403);

      for (let i = 0; i < 4; i++) {
        expect((await request(app).post('/api/messages/conversations/support').set(bearer(cliente)).send({ title: `Tema ${i}`, message: 'Hola' })).status).toBe(201);
      }
      const limited = await request(app).post('/api/messages/conversations/support').set(bearer(cliente)).send({ title: 'Uno más', message: 'Hola' });
      expect(limited.status).toBe(429);
      expect(limited.body.code).toBe('too_many_conversations');
    });
  });

  // -------------------------------------------------------------------------
  describe('preferencias de notificación', () => {
    it('se guardan en el servidor y los correos las respetan', async () => {
      const cliente = await createUser('client');
      const prefs = await request(app).patch('/api/auth/me/preferences').set(bearer(cliente)).send({ email: { facturacion: false } });
      expect(prefs.status).toBe(200);
      expect(prefs.body.data.notificationPrefs.email).toEqual({ pedidos: true, facturacion: false, proyectos: true, mensajes: true });
      expect((await request(app).get('/api/auth/me').set(bearer(cliente))).body.data.notificationPrefs.email.facturacion).toBe(false);
      expect((await request(app).patch('/api/auth/me/preferences').set(bearer(cliente)).send({ email: { sms: true } })).status).toBe(400);

      jest.spyOn(emailService, 'isConfigured').mockReturnValue(true);
      const send = jest.spyOn(emailService, 'sendMail').mockResolvedValue(true);
      const { notifyClient } = await import('../../services/portal-notify.service');
      const billing = await notifyClient({ userId: cliente.id, type: 'billing', evento: 'invoice_issued', title: 'Factura', message: 'Nueva factura', actionUrl: '/dashboard/billing' });
      expect(await billing.email).toBe(false);
      expect(send).not.toHaveBeenCalled();
      const orders = await notifyClient({ userId: cliente.id, type: 'order', evento: 'order_status', title: 'Pedido', message: 'Cambió', actionUrl: '/dashboard/orders' });
      expect(await orders.email).toBe(true);
      expect(send).toHaveBeenCalledTimes(1);
      expect(send.mock.calls[0][0].to).toBe(cliente.email);
      // La notificación del portal se crea siempre.
      expect((await notifications(cliente.id)).map((n) => n.metadata.evento)).toEqual(['invoice_issued', 'order_status']);
    });
  });
});
