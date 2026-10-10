/**
 * Revisión de seguridad del portal y del panel (integración, supertest):
 *  - pedidos: el dueño edita solo nombre, descripción y adjuntos mientras el
 *    pedido está pendiente, y lo cancela; el estado lo cambia el equipo;
 *  - facturas: el pago lo registra solo el equipo; el portal lee los métodos
 *    de pago configurados;
 *  - "dueño o staff" con el rol vigente de la BD (no el del token);
 *  - crear conversaciones: solo el equipo;
 *  - una petición mal formada al panel no deja promesas sin manejar.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import request from 'supertest';
import type { Express } from 'express';
import mongoose from 'mongoose';
import { TestUser, bearer, connectTestDb, createUser, describeDb, disconnectTestDb, signToken } from './helpers';

const oid = (id: string) => new mongoose.Types.ObjectId(id);
const LEGACY_BOT_ID = 'kbot_legacysec00000001';

describeDb('revisión de seguridad: portal y panel (integración)', () => {
  let app: Express;
  let admin: TestUser;
  let manager: TestUser;
  let owner: TestUser;
  let other: TestUser;
  const createdFiles: string[] = [];
  const prevStateDir = process.env.CHATBOT_STATE_DIR;
  let stateDir: string;

  beforeAll(async () => {
    await connectTestDb('security');
    // Chatbot con un bot heredado (sin dueño registrado), antes de cargar la app.
    stateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'koptup-chatbot-sec-'));
    process.env.CHATBOT_STATE_DIR = stateDir;
    const now = new Date().toISOString();
    fs.writeFileSync(
      path.join(stateDir, 'state.json'),
      JSON.stringify({
        bots: [[LEGACY_BOT_ID, { botId: LEGACY_BOT_ID, name: 'Bot antiguo', color: '#000000', position: 'br', avatar: '🤖', welcome: 'Hola', systemPrompt: 'x', tone: 'professional', languages: ['es'], createdAt: now, updatedAt: now, docs: [] }]],
        docs: [[LEGACY_BOT_ID, []]],
        chunks: [],
        conversations: [],
        updatedAt: now,
      }),
    );
    const { createApp } = await import('../../app');
    app = createApp();
    admin = await createUser('admin');
    manager = await createUser('manager');
    owner = await createUser('client');
    other = await createUser('user');
    fs.mkdirSync(path.resolve('uploads/orders'), { recursive: true });
  });

  afterAll(async () => {
    for (const f of createdFiles) fs.rmSync(f, { force: true });
    fs.rmSync(stateDir, { recursive: true, force: true });
    if (prevStateDir === undefined) delete process.env.CHATBOT_STATE_DIR;
    else process.env.CHATBOT_STATE_DIR = prevStateDir;
    await disconnectTestDb();
  });

  async function insertOrder(fields: Record<string, unknown> = {}) {
    const orderId = `ORD-T${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    await mongoose.connection.collection('orders').insertOne({
      orderId,
      name: 'Pedido de prueba',
      description: 'Descripción inicial',
      status: 'pending',
      approvalStatus: 'pending',
      userId: oid(owner.id),
      amount: 100,
      currency: 'USD',
      items: [{ name: 'Ítem', quantity: 1, price: 100 }],
      attachments: [],
      comments: [],
      orderDate: new Date(),
      history: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...fields,
    });
    return orderId;
  }

  const getOrder = (orderId: string) => mongoose.connection.collection('orders').findOne({ orderId });

  describe('pedidos del portal', () => {
    it('el dueño no puede cambiar el estado (403) y el pedido queda igual', async () => {
      const orderId = await insertOrder();
      const res = await request(app).put(`/api/orders/${orderId}`).set(bearer(owner)).send({ status: 'completed' });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('status_team_only');
      expect((await getOrder(orderId))?.status).toBe('pending');
    });

    it('el dueño no puede tocar ítems, monto ni aprobación (400)', async () => {
      const orderId = await insertOrder();
      const res = await request(app).put(`/api/orders/${orderId}`).set(bearer(owner)).send({ amount: 1, approvalStatus: 'approved' });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('invalid_fields');
      const order = await getOrder(orderId);
      expect(order?.amount).toBe(100);
      expect(order?.approvalStatus).toBe('pending');
    });

    it('mientras está pendiente, el dueño edita nombre y descripción', async () => {
      const orderId = await insertOrder();
      const res = await request(app).put(`/api/orders/${orderId}`).set(bearer(owner)).send({ name: 'Nuevo nombre', description: 'Nueva descripción' });
      expect(res.status).toBe(200);
      const order = await getOrder(orderId);
      expect(order).toMatchObject({ name: 'Nuevo nombre', description: 'Nueva descripción', status: 'pending' });
      expect(order?.history.at(-1)?.description).toMatch(/editado por el cliente/);
    });

    it('mientras está pendiente, el dueño agrega y quita adjuntos', async () => {
      const orderId = await insertOrder();
      const add = await request(app)
        .put(`/api/orders/${orderId}`)
        .set(bearer(owner))
        .attach('attachments', Buffer.from('hola'), 'nota.txt');
      expect(add.status).toBe(200);
      expect(add.body.data.attachments).toHaveLength(1);
      const stored = await getOrder(orderId);
      const fileUrl: string = stored?.attachments[0].fileUrl;
      createdFiles.push(path.resolve(`.${fileUrl}`));
      expect(fs.existsSync(path.resolve(`.${fileUrl}`))).toBe(true);

      const remove = await request(app)
        .put(`/api/orders/${orderId}`)
        .set(bearer(owner))
        .send({ removeAttachments: [String(add.body.data.attachments[0].id)] });
      expect(remove.status).toBe(200);
      expect((await getOrder(orderId))?.attachments).toHaveLength(0);
      // El archivo quitado también sale del disco.
      expect(fs.existsSync(path.resolve(`.${fileUrl}`))).toBe(false);
    });

    it('un archivo enviado en una edición rechazada no queda en disco', async () => {
      const orderId = await insertOrder({ approvalStatus: 'approved' });
      const before = fs.readdirSync(path.resolve('uploads/orders')).length;
      const res = await request(app)
        .put(`/api/orders/${orderId}`)
        .set(bearer(owner))
        .attach('attachments', Buffer.from('hola'), 'nota.txt');
      expect(res.status).toBe(409);
      expect(fs.readdirSync(path.resolve('uploads/orders')).length).toBe(before);
    });

    it('revisado o en curso: el dueño ya no lo edita ni lo cancela (409)', async () => {
      const approved = await insertOrder({ approvalStatus: 'approved' });
      expect((await request(app).put(`/api/orders/${approved}`).set(bearer(owner)).send({ name: 'Otro' })).status).toBe(409);
      expect((await request(app).post(`/api/orders/${approved}/cancel`).set(bearer(owner))).status).toBe(409);
      const inProgress = await insertOrder({ status: 'in_progress' });
      expect((await request(app).post(`/api/orders/${inProgress}/cancel`).set(bearer(owner))).status).toBe(409);
      expect((await getOrder(inProgress))?.status).toBe('in_progress');
    });

    it('el dueño cancela su pedido pendiente; otra cuenta no puede', async () => {
      const orderId = await insertOrder();
      expect((await request(app).post(`/api/orders/${orderId}/cancel`).set(bearer(other))).status).toBe(403);
      expect((await request(app).put(`/api/orders/${orderId}`).set(bearer(other)).send({ name: 'x' })).status).toBe(403);
      const res = await request(app).post(`/api/orders/${orderId}/cancel`).set(bearer(owner));
      expect(res.status).toBe(200);
      expect((await getOrder(orderId))?.status).toBe('cancelled');
    });

    it('el detalle le dice al portal si el pedido es editable', async () => {
      const pending = await insertOrder();
      const res = await request(app).get(`/api/orders/${pending}`).set(bearer(owner));
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ editable: true, approvalStatus: 'pending' });
      const approved = await insertOrder({ approvalStatus: 'approved' });
      expect((await request(app).get(`/api/orders/${approved}`).set(bearer(owner))).body.data.editable).toBe(false);
    });

    it('el equipo sí cambia el estado desde el panel', async () => {
      const orderId = await insertOrder();
      const res = await request(app).patch(`/api/admin/orders/${orderId}/status`).set(bearer(manager)).send({ status: 'in_progress' });
      expect(res.status).toBe(200);
      expect((await getOrder(orderId))?.status).toBe('in_progress');
    });
  });

  describe('facturas', () => {
    async function insertInvoice() {
      const res = await mongoose.connection.collection('invoices').insertOne({
        invoiceNumber: `INV-T-${Math.random().toString(36).slice(2, 8)}`,
        projectId: new mongoose.Types.ObjectId(),
        userId: oid(owner.id),
        clientInfo: { name: 'Cliente', email: owner.email },
        items: [{ description: 'Servicio', quantity: 1, unitPrice: 100, total: 100 }],
        subtotal: 100,
        taxRate: 0.19,
        taxAmount: 19,
        total: 119,
        currency: 'USD',
        status: 'pending',
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 86400000),
        history: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return String(res.insertedId);
    }
    const getInvoice = (id: string) => mongoose.connection.collection('invoices').findOne({ _id: oid(id) });

    it('el dueño no puede marcar su factura como pagada (403)', async () => {
      const id = await insertInvoice();
      const res = await request(app).post(`/api/invoices/${id}/pay`).set(bearer(owner)).send({ paymentMethod: 'credit_card' });
      expect(res.status).toBe(403);
      expect((await getInvoice(id))?.status).toBe('pending');
    });

    it('un token que dice "admin" de una cuenta normal tampoco (rol de la BD)', async () => {
      const id = await insertInvoice();
      const forged = signToken({ id: owner.id, email: owner.email, role: 'admin' });
      const res = await request(app).post(`/api/invoices/${id}/pay`).set({ Authorization: `Bearer ${forged}` }).send({ paymentMethod: 'x' });
      expect(res.status).toBe(403);
      expect((await getInvoice(id))?.status).toBe('pending');
    });

    it('el equipo registra el pago', async () => {
      const id = await insertInvoice();
      const res = await request(app).post(`/api/invoices/${id}/pay`).set(bearer(admin)).send({ paymentMethod: 'transferencia', transactionId: 'REF-1' });
      expect(res.status).toBe(200);
      const invoice = await getInvoice(id);
      expect(invoice).toMatchObject({ status: 'paid', paymentMethod: 'transferencia', transactionId: 'REF-1' });
      expect((await request(app).post('/api/invoices/no-es-un-id/pay').set(bearer(admin)).send({ paymentMethod: 'x' })).status).toBe(404);
    });

    it('métodos de pago: vacío sin configuración; transferencia cuando el admin la configura', async () => {
      await mongoose.connection.collection('appsettings').deleteMany({ clave: 'commerce' });
      const empty = await request(app).get('/api/invoices/payment-methods').set(bearer(owner));
      expect(empty.status).toBe(200);
      expect(empty.body.data.metodos).toEqual([]);
      await mongoose.connection.collection('appsettings').insertOne({
        clave: 'commerce',
        valor: { instruccionesTransferencia: 'Bancolombia ahorros 000-000000-00' },
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const configured = await request(app).get('/api/invoices/payment-methods').set(bearer(owner));
      expect(configured.body.data.metodos).toEqual([{ tipo: 'transferencia', instrucciones: 'Bancolombia ahorros 000-000000-00' }]);
      expect((await request(app).get('/api/invoices/payment-methods')).status).toBe(401);
    });

    it('descargar: el rol del token no da acceso a una factura ajena', async () => {
      const id = await insertInvoice();
      const forged = signToken({ id: other.id, email: other.email, role: 'admin' });
      expect((await request(app).get(`/api/invoices/${id}/download`).set({ Authorization: `Bearer ${forged}` })).status).toBe(403);
      expect((await request(app).get(`/api/invoices/${id}/download`).set(bearer(manager))).status).toBe(200);
      expect((await request(app).get(`/api/invoices/${id}/download`).set(bearer(owner))).status).toBe(200);
    });
  });

  describe('"dueño o staff" con el rol vigente de la BD', () => {
    it('entregables: un token con rol admin de una cuenta normal no ve ni aprueba uno ajeno', async () => {
      await mongoose.connection.collection('deliverables').insertOne({
        deliverableId: 'DEL-SEC-1',
        userId: oid(owner.id),
        projectId: new mongoose.Types.ObjectId(),
        title: 'Entregable',
        status: 'pending',
        history: [],
      });
      const forged = { Authorization: `Bearer ${signToken({ id: other.id, email: other.email, role: 'admin' })}` };
      expect((await request(app).get('/api/deliverables/DEL-SEC-1').set(forged)).status).toBe(403);
      expect((await request(app).post('/api/deliverables/DEL-SEC-1/approve').set(forged).send({})).status).toBe(403);
      expect((await request(app).post('/api/deliverables/DEL-SEC-1/reject').set(forged).send({ comments: 'no' })).status).toBe(403);
      expect((await mongoose.connection.collection('deliverables').findOne({ deliverableId: 'DEL-SEC-1' }))?.status).toBe('pending');
      expect((await request(app).get('/api/deliverables/DEL-SEC-1').set(bearer(manager))).status).toBe(200);
    });

    it('si al staff le quitan el rol, su token vigente deja de servir para recursos ajenos', async () => {
      const temp = await createUser('manager');
      expect((await request(app).get('/api/deliverables/DEL-SEC-1').set(bearer(temp))).status).toBe(200);
      await mongoose.connection.collection('users').updateOne({ _id: oid(temp.id) }, { $set: { role: 'user' } });
      expect((await request(app).get('/api/deliverables/DEL-SEC-1').set(bearer(temp))).status).toBe(403);
    });

    it('notificaciones: un token con rol admin de una cuenta normal no notifica a otra cuenta', async () => {
      const forged = { Authorization: `Bearer ${signToken({ id: other.id, email: other.email, role: 'admin' })}` };
      const res = await request(app)
        .post('/api/notifications')
        .set(forged)
        .send({ type: 'system', title: 'Hola', message: 'Prueba', targetUserId: owner.id });
      expect(res.status).toBe(403);
    });

    it('conversaciones: crear es solo del equipo (rol de la BD); el rol "project_manager" ya no existe', async () => {
      const forged = { Authorization: `Bearer ${signToken({ id: other.id, email: other.email, role: 'admin' })}` };
      expect((await request(app).post('/api/messages/conversations').set(forged).send({ title: 'x', clientId: owner.id })).status).toBe(403);
      const pm = { Authorization: `Bearer ${signToken({ id: other.id, email: other.email, role: 'project_manager' })}` };
      expect((await request(app).post('/api/messages/conversations').set(pm).send({ title: 'x', clientId: owner.id })).status).toBe(403);
      expect((await request(app).post('/api/messages/conversations').set(bearer(owner)).send({ title: 'x', clientId: owner.id })).status).toBe(403);
      expect((await request(app).post('/api/messages/conversations').set(bearer(manager)).send({ title: 'x', clientId: 'no-es-un-id' })).status).toBe(400);

      const Conversation = (await import('../../models/Conversation')).default;
      const roles = (Conversation.schema.path('participants') as any).schema.path('role').enumValues as string[];
      expect(roles).not.toContain('project_manager');
    });

    it('authorize() ya no existe (las rutas usan requireRole con el rol de la BD)', async () => {
      const auth = await import('../../middleware/auth');
      expect((auth as Record<string, unknown>).authorize).toBeUndefined();
    });
  });

  describe('gestor de documentos: borrar', () => {
    async function insertDoc(userId: string) {
      const res = await mongoose.connection.collection('documents').insertOne({
        user_id: userId,
        filename: 'x.txt',
        original_filename: 'x.txt',
        file_path: path.join(os.tmpdir(), `no-existe-${Date.now()}.txt`),
        file_size: 1,
        mime_type: 'text/plain',
        folder: 'General',
        is_deleted: false,
        is_favorite: false,
        tags: [],
        created_at: new Date(),
        updated_at: new Date(),
      });
      return String(res.insertedId);
    }
    const docs = () => mongoose.connection.collection('documents');

    it('el dueño mueve su documento a la papelera sin PIN (la confirmación la pide la interfaz)', async () => {
      const id = await insertDoc(owner.id);
      const res = await request(app).delete(`/api/documents/${id}`).set(bearer(owner));
      expect(res.status).toBe(200);
      expect((await docs().findOne({ _id: oid(id) }))?.is_deleted).toBe(true);
      // Un "pin" de una versión anterior se ignora.
      const again = await insertDoc(owner.id);
      expect((await request(app).delete(`/api/documents/${again}`).query({ pin: '0000' }).set(bearer(owner))).status).toBe(200);
    });

    it('borrado permanente del dueño; otra cuenta recibe 404 y sin sesión 401', async () => {
      const id = await insertDoc(owner.id);
      expect((await request(app).delete(`/api/documents/${id}`))).toHaveProperty('status', 401);
      expect((await request(app).delete(`/api/documents/${id}`).set(bearer(other))).status).toBe(404);
      expect(await docs().countDocuments({ _id: oid(id) })).toBe(1);
      const res = await request(app).delete(`/api/documents/${id}`).query({ permanent: 'true' }).set(bearer(owner));
      expect(res.status).toBe(200);
      expect(await docs().countDocuments({ _id: oid(id) })).toBe(0);
    });

    it('ninguna respuesta ni la documentación de la API mencionan un PIN', async () => {
      const id = await insertDoc(owner.id);
      const res = await request(app).delete(`/api/documents/${id}`).set(bearer(other));
      expect(JSON.stringify(res.body)).not.toMatch(/pin/i);
      const routes = fs.readFileSync(path.resolve(__dirname, '../../routes/document.routes.ts'), 'utf-8');
      expect(routes).not.toMatch(/\bPIN\b|name: pin/);
      const controller = fs.readFileSync(path.resolve(__dirname, '../../controllers/document.controller.ts'), 'utf-8');
      expect(controller).not.toMatch(/DELETE_PIN|\bPIN\b/);
    });
  });

  describe('chatbot: bots heredados sin dueño registrado', () => {
    const OWNER_HEADER = 'X-Bot-Owner-Token';

    it('un token cualquiera no lo reclama; una cuenta normal tampoco', async () => {
      const claim = await request(app).patch(`/api/chatbot/bots/${LEGACY_BOT_ID}`).set(OWNER_HEADER, 'c'.repeat(43)).send({ name: 'Mío' });
      expect(claim.status).toBe(403);
      expect(claim.body.error).toBe('legacy_bot_staff_only');
      expect((await request(app).patch(`/api/chatbot/bots/${LEGACY_BOT_ID}`).set(bearer(owner)).send({ name: 'Mío' })).status).toBe(403);
      const forged = { Authorization: `Bearer ${signToken({ id: other.id, email: other.email, role: 'admin' })}` };
      expect((await request(app).patch(`/api/chatbot/bots/${LEGACY_BOT_ID}`).set(forged).send({ name: 'Mío' })).status).toBe(403);
    });

    it('el equipo (rol de la BD) sí lo administra', async () => {
      const res = await request(app).patch(`/api/chatbot/bots/${LEGACY_BOT_ID}`).set(bearer(manager)).send({ name: 'Bot revisado' });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Bot revisado');
      expect((await request(app).get(`/api/chatbot/bots/${LEGACY_BOT_ID}/conversations`).set(bearer(admin))).status).toBe(200);
      // Sigue sin dueño: un token tampoco lo toma después.
      expect((await request(app).delete(`/api/chatbot/bots/${LEGACY_BOT_ID}`).set(OWNER_HEADER, 'd'.repeat(43))).status).toBe(403);
    });
  });

  describe('panel: peticiones mal formadas', () => {
    function trackRejections() {
      const seen: unknown[] = [];
      const listener = (reason: unknown) => seen.push(reason);
      process.on('unhandledRejection', listener);
      return {
        seen,
        stop: () => process.off('unhandledRejection', listener),
      };
    }
    const tick = () => new Promise((r) => setTimeout(r, 50));

    it.each([
      ['PATCH', '/api/admin/orders/NO-EXISTE/status', {}, 400],
      ['PATCH', '/api/admin/orders/NO-EXISTE/status', { status: 'shipped' }, 404],
      ['PATCH', '/api/admin/orders/NO-EXISTE/status', { status: 'inventado' }, 400],
      ['POST', '/api/admin/orders/NO-EXISTE/invoice', {}, 404],
      ['GET', '/api/admin/conversations/NO-EXISTE', undefined, 404],
      ['PATCH', '/api/admin/contacts/no-es-un-id/status', {}, 400],
      ['PATCH', '/api/admin/contacts/no-es-un-id/status', { status: 'read' }, 404],
      ['PATCH', `/api/admin/contacts/${new mongoose.Types.ObjectId().toString()}/status`, { status: 'read' }, 404],
    ])('%s %s %j → %i sin promesas rechazadas sin manejar', async (method, url, body, expected) => {
      const tracker = trackRejections();
      try {
        let req = request(app)[(method as string).toLowerCase() as 'get' | 'post' | 'patch'](url as string).set(bearer(admin));
        if (body !== undefined) req = req.send(body as object);
        const res = await req;
        expect(res.status).toBe(expected);
        await tick();
        expect(tracker.seen).toEqual([]);
      } finally {
        tracker.stop();
      }
    });

    it('los filtros de los listados solo aceptan texto (sin operadores de MongoDB ni expresiones regulares)', async () => {
      // `role[$ne]=admin` llega como objeto: se ignora y no excluye al admin.
      const byRole = await request(app).get('/api/admin/users').query('role[$ne]=admin').set(bearer(admin));
      expect(byRole.status).toBe(200);
      expect(byRole.body.data.map((u: { id: string }) => String(u.id))).toContain(admin.id);
      // `search[$regex]` también se ignora (antes respondía 500).
      const bySearchObj = await request(app).get('/api/admin/users').query('search[$regex]=.*').set(bearer(admin));
      expect(bySearchObj.status).toBe(200);
      // El texto de búsqueda es literal: ".*" no encuentra a todos.
      const literal = await request(app).get('/api/admin/users').query({ search: '.*' }).set(bearer(admin));
      expect(literal.status).toBe(200);
      expect(literal.body.data).toHaveLength(0);
      const byEmail = await request(app).get('/api/admin/users').query({ search: owner.email.toUpperCase() }).set(bearer(admin));
      expect(byEmail.body.data.map((u: { id: string }) => String(u.id))).toEqual([owner.id]);
      // Un proyecto con id inválido es un 400, no un 500.
      expect((await request(app).get('/api/admin/deliverables').query({ projectId: 'no-es-id' }).set(bearer(admin))).status).toBe(400);
      expect((await request(app).get('/api/admin/orders').query('status[$ne]=x').set(bearer(admin))).status).toBe(200);
    });

    it('el pedido sin ítems no genera factura y responde 400 una sola vez', async () => {
      const orderId = await insertOrder({ items: [] });
      const tracker = trackRejections();
      try {
        const res = await request(app).post(`/api/admin/orders/${orderId}/invoice`).set(bearer(admin));
        expect(res.status).toBe(400);
        await tick();
        expect(tracker.seen).toEqual([]);
        expect(await mongoose.connection.collection('invoices').countDocuments({ 'history.description': `Factura creada desde pedido ${orderId}` })).toBe(0);
      } finally {
        tracker.stop();
      }
    });
  });
});
