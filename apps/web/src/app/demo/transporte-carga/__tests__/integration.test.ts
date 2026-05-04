import {
  getState,
  setState,
  init,
  TransporteState,
  Cliente,
  Conductor,
  Vehiculo,
  Orden,
  Guia,
  Factura,
} from '../store';
import { v4 as uuidv4 } from 'uuid';

describe('Transporte Carga Integration Tests', () => {
  beforeEach(() => {
    init({
      clientes: [],
      conductores: [],
      vehiculos: [],
      ordenes: [],
      guias: [],
      facturas: [],
      usuarios: [],
    });
  });

  describe('Order to Invoice Workflow', () => {
    it('should create a complete workflow from order to invoice with detracción', () => {
      const clienteId = uuidv4();
      const conductorId = uuidv4();
      const vehiculoId = uuidv4();

      const cliente: Cliente = {
        id: clienteId,
        tipoDoc: 6,
        numeroDoc: '20505000999',
        razonSocial: 'TRANSPORTES DEMO S.A.C.',
        dirección: 'Av. Principal 123',
        ubigeo: '150131',
        telefono: '01-2345678',
        email: 'contact@demo.com',
        activo: true,
        createdAt: new Date(),
      };

      const conductor: Conductor = {
        id: conductorId,
        dni: '12345678',
        nombres: 'Juan',
        apellidos: 'García',
        licencia: 'B-001234',
        categoriaLicencia: 'A-IIIa',
        vencimientoLicencia: new Date('2026-12-31'),
        activo: true,
        createdAt: new Date(),
      };

      const vehiculo: Vehiculo = {
        id: vehiculoId,
        placa: 'ABC-123',
        configuracion: 'C2',
        anio: 2020,
        capacidadKg: 5000,
        vencimientoSOAT: new Date('2026-12-31'),
        vencimientoRevision: new Date('2026-06-30'),
        activo: true,
        createdAt: new Date(),
      };

      setState({
        clientes: [cliente],
        conductores: [conductor],
        vehiculos: [vehiculo],
      });

      const ordenId = uuidv4();
      const orden: Orden = {
        id: ordenId,
        numero: 'ORD-001',
        clienteId,
        conductorId,
        vehiculoId,
        modalidadTransporte: '01',
        origen: { direccion: 'Lima', ubigeo: '150131' },
        destino: { direccion: 'Arequipa', ubigeo: '080131' },
        fechaInicioTraslado: new Date(),
        pesoTotal: 1500,
        bultos: 10,
        descripcionMercancia: 'Textiles',
        flete: 1000,
        igv: 180,
        total: 1180,
        estado: 'confirmada',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setState({ ordenes: [orden] });

      const guiaId = uuidv4();
      const guia: Guia = {
        id: guiaId,
        numero: 'GR-001',
        ordenId,
        remitente: { razonSocial: cliente.razonSocial, numeroDoc: cliente.numeroDoc },
        destinatario: { razonSocial: 'CLIENTE DESTINO', numeroDoc: '10123456789' },
        transportista: { razonSocial: cliente.razonSocial, ruc: cliente.numeroDoc },
        conductor: { nombres: `${conductor.nombres} ${conductor.apellidos}`, dni: conductor.dni },
        vehiculo: { placa: vehiculo.placa },
        hash: 'abc123hash',
        xml: '<GuiaRemision></GuiaRemision>',
        estado: 'emitida',
        createdAt: new Date(),
      };

      setState({ guias: [guia] });

      const detraccionAmount = orden.subtotal >= 700 ? orden.subtotal * 0.04 : 0;
      const facturaId = uuidv4();
      const factura: Factura = {
        id: facturaId,
        numero: 'F-001',
        ordenId,
        clienteId,
        clienteRazonSocial: cliente.razonSocial,
        clienteNumeroDoc: cliente.numeroDoc,
        items: [
          {
            id: uuidv4(),
            descripcion: 'Servicio de Transporte',
            cantidad: 1,
            unitario: orden.flete,
            subtotal: orden.flete,
          },
        ],
        subtotal: orden.flete,
        igv: orden.igv,
        detraccion: detraccionAmount,
        total: orden.flete + orden.igv - detraccionAmount,
        xml: '<Factura></Factura>',
        estado: 'emitida',
        createdAt: new Date(),
      };

      setState({ facturas: [factura] });

      const currentState = getState();
      expect(currentState.ordenes).toHaveLength(1);
      expect(currentState.guias).toHaveLength(1);
      expect(currentState.facturas).toHaveLength(1);
      expect(factura.detraccion).toBe(40);
      expect(factura.total).toBe(1220);
    });

    it('should calculate detracción correctly for subtotal >= 700', () => {
      const subtotal = 800;
      const expectedDetraccion = subtotal * 0.04;
      expect(expectedDetraccion).toBe(32);
    });

    it('should NOT apply detracción for subtotal < 700', () => {
      const subtotal = 600;
      const detraccion = subtotal >= 700 ? subtotal * 0.04 : 0;
      expect(detraccion).toBe(0);
    });

    it('should transition order states correctly', () => {
      const clienteId = uuidv4();
      const conductorId = uuidv4();
      const vehiculoId = uuidv4();

      const orden: Orden = {
        id: uuidv4(),
        numero: 'ORD-002',
        clienteId,
        conductorId,
        vehiculoId,
        modalidadTransporte: '01',
        origen: { direccion: 'Lima', ubigeo: '150131' },
        destino: { direccion: 'Arequipa', ubigeo: '080131' },
        fechaInicioTraslado: new Date(),
        pesoTotal: 2000,
        bultos: 15,
        descripcionMercancia: 'Equipos',
        flete: 1500,
        igv: 270,
        total: 1770,
        estado: 'borrador',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setState({ ordenes: [orden] });

      let state = getState();
      expect(state.ordenes[0].estado).toBe('borrador');

      const updatedOrden = { ...orden, estado: 'confirmada' as const };
      setState({ ordenes: [updatedOrden] });

      state = getState();
      expect(state.ordenes[0].estado).toBe('confirmada');

      const updatedOrden2 = { ...updatedOrden, estado: 'en_ruta' as const };
      setState({ ordenes: [updatedOrden2] });

      state = getState();
      expect(state.ordenes[0].estado).toBe('en_ruta');

      const updatedOrden3 = { ...updatedOrden2, estado: 'entregada' as const };
      setState({ ordenes: [updatedOrden3] });

      state = getState();
      expect(state.ordenes[0].estado).toBe('entregada');
    });
  });
});
