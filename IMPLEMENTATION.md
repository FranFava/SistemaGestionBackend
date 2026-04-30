# Implementación ERP - Sistema de Gestión

## Resumen de la Implementación

### Modelos Nuevos Creados (9)

| # | Modelo | Descripción |
|---|--------|-------------|
| 1 | `models/Empresa.js` | Multi-empresa con configuraciones de facturación |
| 2 | `models/PlanCuenta.js` | Plan de cuentas jerárquico (5 niveles) |
| 3 | `models/Asiento.js` | Libro diario con partida doble |
| 4 | `models/TipoMovimiento.js` | Catálogo de tipos de operación |
| 5 | `models/CuentaCorriente.js` | Ctacte clientes/proveedores |
| 6 | `models/Comprobante.js` | Facturas A/B, notas, tickets |
| 7 | `models/Cotizacion.js` | Monedas múltiples |
| 8 | `models/AuditLog.js` | Auditoría completa |
| 9 | `models/TipoMovimiento.js` | Catálogo de tipos |

### Controllers Nuevos (4)

| # | Controller | Rutas |
|---|------------|-------|
| 1 | `controllers/empresaController.js` | CRUD Empresas |
| 2 | `controllers/planCuentaController.js` | CRUD Plan de Cuentas |
| 3 | `controllers/cuentaCorrienteController.js` | CRUD Ctacte + movimientos |
| 4 | `controllers/comprobanteController.js` | CRUD Comprobantes |

### Rutas Nuevas (4)

```
/api/empresas          - CRUD Empresas
/api/plan-cuentas      - Plan de cuentas
/api/cuentas-corrientes - Ctacte
/api/comprobantes      - Facturación
```

### Seeds de Prueba (6)

```
backend/seed/
├── 01-empresas.js      # 2 empresas
├── 02-planCuentas.js   # 40+ cuentas
├── 03-clientes.js     # 15 clientes
├── 04-proveedores.js  # 10 proveedores
├── 05-productos.js    # 20 productos
└── index.js          # Seed completo
```

### Tests

```
backend/tests/
├── setup.js
└── integration/
    └── api.test.js    # Tests de API
```

---

## Comandos

### Backend
```bash
cd backend
npm run dev          # Desarrollo
npm run seed         # Ejecutar seed completo
npm run test         # Ejecutar tests
npm run test:watch  # Tests en watch mode
```

### Root
```bash
npm run dev         # Backend + Frontend
```

---

## Estructura del Plan de Cuentas

```
1 - ACTIVO
  1.1 - DISPONIBLE
    1.1.1 - Caja
    1.1.2 - Banco Galicia
    1.1.3 - Banco Nación
  1.2 - CRÉDITOS
    1.2.1 - Clientes
    1.2.2 - Proveedores
    1.2.3 - Tarjetas
  1.3 - BIENES DE USO
    1.3.1 - Equipos
    1.3.2 - Muebles y Útiles
    1.3.3 - Vehículos

2 - PASIVO
  2.1 - DEUDAS
    2.1.1 - Proveedores
    2.1.2 - Acreedores
  2.2 - RESULTADOS

3 - PATRIMONIO
  3.1 - CAPITAL
  3.2 - RESULTADOS

4 - INGRESOS
  4.1 - VENTAS
  4.2 - OTROS INGRESOS

5 - EROGACIONES (GASTOS)
  5.1 - COSTO DE MERCADOS
  5.2 - GASTOS OPERATIVOS
  5.3 - IMPUESTOS
```

---

## Facturación A/B

### Diferencias Factura A vs B

| Campo | Factura A | Factura B |
|------|-----------|-----------|
| Letra | A | B |
| Cliente | CUIT obligatorio | Opcional |
| IVA | Discriminado | Incluido en precio |
| CAE | Requerido | No requerido |
| Responsable | I. Inscripto | Consum Final |

---

## Notas

- Los tests requieren instalar dependencias: `npm install --save-dev jest supertest`
- El seed usa la base de datos configurada en `config/database.js`
- Las rutas nuevas requieren autenticación (token JWT)
- Solo administradores pueden crear/editar/eliminar empresas y cuentas

---

## Próximos Pasos

1. [ ] Instalar dependencias de test (`npm install`)
2. [ ] Ejecutar seed (`npm run seed`)
3. [ ] Ejecutar tests (`npm run test`)
4. [ ] Crear páginas frontend para las nuevas funciones
5. [ ] Integrar módulo de facturación electrónica (AFIP)