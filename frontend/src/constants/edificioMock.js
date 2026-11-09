// ============================================================
//  FUENTE UNICA DE DATOS DEL EDIFICIO (mock)
//
//  Aqui viven las PERSONAS y las UNIDADES del edificio. Todos los demas
//  mocks (copropietarios, unidades, expensas, pagos, anticipos, mora,
//  comunicados) leen de este archivo en lugar de repetir nombres o deptos.
//
//  Reglas:
//    - Si un dato de una persona o unidad cambia, se cambia SOLO aqui.
//    - Los otros mocks guardan solo el numero de depto ('101') y obtienen
//      el responsable con responsableDe('101').
//    - Cuando se conecte el backend, estos arreglos se reemplazan por la API.
//
//  Edificio: 3 pisos x 3 deptos (101 a 303) + parqueos + bauleras.
//  Categoria del depto (A/B/C) = tipo de expensa (ver configuracionMock.EXPENSA_BASE).
// ============================================================

// Tipo de departamento segun su categoria de expensa
export const TIPO_DEPTO_POR_CATEGORIA = {
    A: 'Monoambiente',
    B: '1 dormitorio',
    C: '2 dormitorios',
};

export const TIPOS_DEPARTAMENTO = ['Monoambiente', '1 dormitorio', '2 dormitorios'];
export const TIPOS_UNIDAD = ['Departamento', 'Parqueo', 'Baulera'];
export const NIVELES = ['Nivel 1', 'Nivel 2', 'Sótano 1', 'Sótano 2'];

// ------------------------------------------------------------
//  PERSONAS (copropietarios e inquilinos)
//  tipo: 'Propietario' | 'Inquilino'
//  Los campos unidad / tipoDepartamento / piso se completan abajo
//  a partir de UNIDADES (no se escriben a mano).
// ------------------------------------------------------------
export const PERSONAS = [
    { id: 1, nombres: 'Ana', apellidos: 'Lopez', tipo: 'Propietario', documento: '7453821', telefono: '71234501', correo: 'ana.lopez@gmail.com' },
    { id: 2, nombres: 'Luis', apellidos: 'Garcia', tipo: 'Inquilino', documento: '8123456', telefono: '72345602', correo: 'luis.garcia@gmail.com' },
    { id: 3, nombres: 'Pedro', apellidos: 'Mamani', tipo: 'Propietario', documento: '6234517', telefono: '73456703', correo: 'pedro.mamani@gmail.com' },
    { id: 4, nombres: 'Sofia', apellidos: 'Flores', tipo: 'Propietario', documento: '9345628', telefono: '74567804', correo: 'sofia.flores@gmail.com' },
    { id: 5, nombres: 'Luis', apellidos: 'Perez', tipo: 'Propietario', documento: '5456739', telefono: '75678905', correo: 'luis.perez@gmail.com' },
    { id: 6, nombres: 'Carlos', apellidos: 'Mendoza', tipo: 'Propietario', documento: '7567840', telefono: '76789006', correo: 'carlos.mendoza@gmail.com' },
    { id: 7, nombres: 'Rocio', apellidos: 'Alba', tipo: 'Inquilino', documento: '8678951', telefono: '77890107', correo: 'rocio.alba@gmail.com' },
    { id: 8, nombres: 'Maria', apellidos: 'Rojas', tipo: 'Propietario', documento: '6789062', telefono: '78901208', correo: 'maria.rojas@gmail.com' },
    { id: 9, nombres: 'Rafael', apellidos: 'Cruz', tipo: 'Propietario', documento: '9890173', telefono: '79012309', correo: 'rafael.cruz@gmail.com' },
];

// ------------------------------------------------------------
//  UNIDADES
//  Departamento: identificador ('Depto. 101'), categoria (A/B/C), piso, tipoDepartamento.
//  El numero ('101') se obtiene del identificador con numeroDe(unidad).
//  personaId = persona asociada (o null si esta libre).
// ------------------------------------------------------------
const depto = (id, numero, categoria, personaId) => ({
    id,
    tipo: 'Departamento',
    identificador: `Depto. ${numero}`,
    categoria,
    piso: Number(numero.charAt(0)),
    tipoDepartamento: TIPO_DEPTO_POR_CATEGORIA[categoria],
    personaId,
});

export const UNIDADES = [
    depto(1, '101', 'A', 1),
    depto(2, '102', 'B', 2),
    depto(3, '103', 'A', 3),
    depto(4, '201', 'A', 4),
    depto(5, '202', 'B', 5),
    depto(6, '203', 'B', 6),
    depto(7, '301', 'C', 7),
    depto(8, '302', 'C', 8),
    depto(9, '303', 'C', 9),
    { id: 10, tipo: 'Parqueo', identificador: 'Parqueo P-08', nivel: 'Nivel 1', techado: true, personaId: 8 },
    { id: 11, tipo: 'Parqueo', identificador: 'Parqueo P-12', nivel: 'Nivel 1', techado: false, personaId: null },
    { id: 12, tipo: 'Baulera', identificador: 'Baulera B-06', nivel: 'Nivel 1', personaId: 9 },
];

// ------------------------------------------------------------
//  HISTORIAL DE OCUPANTES (personas que ya no viven en el depto)
//  Los ocupantes ACTUALES no se escriben aqui: salen de UNIDADES.personaId.
// ------------------------------------------------------------
export const OCUPANTES_ANTERIORES = [
    { unidadId: 8, nombre: 'Jorge Vargas', tipo: 'Inquilino', fechaInicio: '2023-03-01', fechaFin: '2024-12-31' },
    { unidadId: 8, nombre: 'Ana Rivera', tipo: 'Inquilino', fechaInicio: '2021-01-10', fechaFin: '2023-02-20' },
    { unidadId: 2, nombre: 'Miguel Torrez', tipo: 'Inquilino', fechaInicio: '2022-05-01', fechaFin: '2024-05-31' },
];

// Fecha desde la que vive el ocupante actual de cada unidad
export const INICIO_OCUPACION = {
    1: '2024-02-01', 2: '2024-06-01', 3: '2023-09-15', 4: '2024-01-10', 5: '2022-11-01',
    6: '2023-04-20', 7: '2025-03-01', 8: '2025-01-15', 9: '2024-08-01',
};

// ============================================================
//  HELPERS (siempre leen los arreglos actuales, asi reflejan
//  los registros y ediciones hechos desde las pantallas)
// ============================================================

export const nombreCompleto = (p) => (p ? `${p.nombres} ${p.apellidos}`.trim() : '');

export const personaPorId = (id) => PERSONAS.find((p) => p.id === id) ?? null;

export const departamentos = () => UNIDADES.filter((u) => u.tipo === 'Departamento');

// Numero de un depto a partir de su identificador: 'Depto. 101' -> '101'
export const numeroDe = (u) => String(u?.identificador ?? '').replace(/^Depto\.\s*/, '').trim();

// Unidad tipo Departamento a partir del numero ('101') o del identificador ('Depto. 101')
export const deptoPorNumero = (numero) => {
    const n = String(numero ?? '').replace(/^Depto\.\s*/, '').trim();
    return departamentos().find((u) => numeroDe(u) === n) ?? null;
};

// Numeros de todos los deptos: ['101', '102', ...]
export const numerosDepto = () => departamentos().map(numeroDe);

// Persona asociada a un depto (o null)
export const personaDeDepto = (numero) => {
    const u = deptoPorNumero(numero);
    return u ? personaPorId(u.personaId) : null;
};

// Nombre del responsable de pago de un depto.
//   responsableDe('102')                    -> 'Luis Garcia'
//   responsableDe('102', { conTipo: true }) -> 'Luis Garcia · Inquilino'
export const responsableDe = (numero, { conTipo = false } = {}) => {
    const p = personaDeDepto(numero);
    if (!p) return 'Sin responsable';
    return conTipo ? `${nombreCompleto(p)} · ${p.tipo}` : nombreCompleto(p);
};

// Hace que obj.responsable se lea siempre del edificio segun obj.depto.
// Si una pantalla asigna un valor a mano, se respeta ese valor.
// Al copiar el objeto ({ ...obj }) se copia el nombre vigente en ese momento.
export const vincularResponsable = (obj, campoDepto = 'depto') => {
    let manual;
    Object.defineProperty(obj, 'responsable', {
        get() { return manual ?? responsableDe(obj[campoDepto]); },
        set(v) { manual = v; },
        enumerable: true,
        configurable: true,
    });
    return obj;
};

// ------------------------------------------------------------
//  SINCRONIZACION persona <-> departamento
//  La relacion se guarda en UNIDADES.personaId. Los campos unidad,
//  tipoDepartamento y piso de cada persona se recalculan desde ahi.
// ------------------------------------------------------------

// Recalcula unidad / tipoDepartamento / piso de todas las personas.
// Llamar despues de registrar o editar una unidad.
export const sincronizarPersonas = () => {
    PERSONAS.forEach((p) => {
        const u = departamentos().find((d) => d.personaId === p.id);
        p.unidad = u ? u.identificador : '';
        p.tipoDepartamento = u ? u.tipoDepartamento : '';
        p.piso = u ? u.piso : '';
    });
};

// Asocia una persona a un departamento ('Depto. 101'). Si la persona tenia
// otro depto, lo libera; si el depto tenia otra persona, la reemplaza.
// Llamar despues de registrar o editar una persona.
export const asignarDepto = (personaId, identificador) => {
    departamentos().forEach((u) => {
        if (u.personaId === personaId && u.identificador !== identificador) u.personaId = null;
    });
    const destino = departamentos().find((u) => u.identificador === identificador);
    if (destino) destino.personaId = personaId;
    sincronizarPersonas();
};

// Estado inicial: completar las personas con los datos de su departamento
sincronizarPersonas();
