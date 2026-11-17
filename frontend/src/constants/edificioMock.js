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

// Tipos de departamento: son las 3 categorias de expensa (A/B/C), que son FIJAS
// (ver configuracionMock.EXPENSA_BASE). El administrador solo cambia el nombre de
// cada tipo desde Unidades > Tipos de departamento.
export const CATEGORIAS_DEPTO = ['A', 'B', 'C'];

export const TIPO_DEPTO_POR_CATEGORIA = {
    A: '1 dormitorio',
    B: '2 dormitorios',
    C: 'Monoambiente',
};

// Nombre del tipo de un depto: tipoDeptoDe(depto101) -> '1 dormitorio'
export const tipoDeptoDe = (u) => TIPO_DEPTO_POR_CATEGORIA[u?.categoria] ?? '';

// Texto para selectores: 'Tipo A · 1 dormitorio'
export const etiquetaTipoDepto = (categoria) => `Tipo ${categoria} · ${TIPO_DEPTO_POR_CATEGORIA[categoria] ?? ''}`;

// Cambia el nombre de los tipos: renombrarTiposDepartamento({ A: '...', B: '...', C: '...' }).
// Valida todo antes de guardar. Devuelve un mensaje de error o null si se guardo.
export const renombrarTiposDepartamento = (nombres) => {
    const nuevos = Object.fromEntries(CATEGORIAS_DEPTO.map((c) => [c, String(nombres?.[c] ?? '').trim()]));
    const vacio = CATEGORIAS_DEPTO.find((c) => !nuevos[c]);
    if (vacio) return `Escribe el nombre del tipo ${vacio}`;
    const enMinuscula = CATEGORIAS_DEPTO.map((c) => nuevos[c].toLowerCase());
    if (new Set(enMinuscula).size !== CATEGORIAS_DEPTO.length) return 'Cada tipo debe tener un nombre distinto';
    Object.assign(TIPO_DEPTO_POR_CATEGORIA, nuevos);
    sincronizarPersonas(); // Copropietarios muestra los nombres nuevos
    return null;
};

// Datos del hogar de cada persona (estado civil, hijos, cuantos viven en el depto)
export const ESTADOS_CIVILES = ['Soltero/a', 'Casado/a', 'Union libre', 'Divorciado/a', 'Viudo/a'];
export const TIPOS_UNIDAD = ['Departamento', 'Parqueo', 'Baulera'];
export const NIVELES = ['Nivel 1', 'Nivel 2', 'Sótano 1', 'Sótano 2'];

// ------------------------------------------------------------
//  PERSONAS (copropietarios e inquilinos)
//  tipo: 'Propietario' | 'Inquilino'
//  estadoCivil, hijos, habitantes = datos del hogar (cuantas personas viven en el depto)
//  Los campos unidad / tipoDepartamento / piso se completan abajo
//  a partir de UNIDADES (no se escriben a mano).
//  Cada persona puede tener como maximo 1 departamento, 1 parqueo y 1 baulera.
// ------------------------------------------------------------
export const PERSONAS = [
    { id: 1, nombres: 'Ana', apellidos: 'Lopez', tipo: 'Propietario', documento: '7453821', telefono: '71234501', correo: 'ana.lopez@gmail.com',
      estadoCivil: 'Casado/a', hijos: 2, habitantes: 4 },
    { id: 2, nombres: 'Luis', apellidos: 'Garcia', tipo: 'Inquilino', documento: '8123456', telefono: '72345602', correo: 'luis.garcia@gmail.com',
      estadoCivil: 'Soltero/a', hijos: 0, habitantes: 1 },
    { id: 3, nombres: 'Pedro', apellidos: 'Mamani', tipo: 'Propietario', documento: '6234517', telefono: '73456703', correo: 'pedro.mamani@gmail.com',
      estadoCivil: 'Casado/a', hijos: 1, habitantes: 3 },
    { id: 4, nombres: 'Sofia', apellidos: 'Flores', tipo: 'Propietario', documento: '9345628', telefono: '74567804', correo: 'sofia.flores@gmail.com',
      estadoCivil: 'Divorciado/a', hijos: 1, habitantes: 2 },
    { id: 5, nombres: 'Luis', apellidos: 'Perez', tipo: 'Propietario', documento: '5456739', telefono: '75678905', correo: 'luis.perez@gmail.com',
      estadoCivil: 'Casado/a', hijos: 2, habitantes: 4 },
    { id: 6, nombres: 'Carlos', apellidos: 'Mendoza', tipo: 'Propietario', documento: '7567840', telefono: '76789006', correo: 'carlos.mendoza@gmail.com',
      estadoCivil: 'Union libre', hijos: 0, habitantes: 2 },
    { id: 7, nombres: 'Rocio', apellidos: 'Alba', tipo: 'Inquilino', documento: '8678951', telefono: '77890107', correo: 'rocio.alba@gmail.com',
      estadoCivil: 'Soltero/a', hijos: 0, habitantes: 2 },
    { id: 8, nombres: 'Maria', apellidos: 'Rojas', tipo: 'Propietario', documento: '6789062', telefono: '78901208', correo: 'maria.rojas@gmail.com',
      estadoCivil: 'Viudo/a', hijos: 2, habitantes: 3 },
    { id: 9, nombres: 'Rafael', apellidos: 'Cruz', tipo: 'Propietario', documento: '9890173', telefono: '79012309', correo: 'rafael.cruz@gmail.com',
      estadoCivil: 'Casado/a', hijos: 3, habitantes: 5 },
    // Dueño del Depto. 102: no vive ahi, se lo alquila a Luis Garcia
    { id: 10, nombres: 'Hugo', apellidos: 'Salazar', tipo: 'Propietario', documento: '4901284', telefono: '70123410', correo: 'hugo.salazar@gmail.com',
      estadoCivil: 'Casado/a', hijos: 2, habitantes: 0 },
];

// ------------------------------------------------------------
//  UNIDADES
//  Departamento: identificador ('Depto. 101'), categoria (A/B/C = tipo de depto), piso y
//    propietarioId       dueño del depto (o null)
//    inquilinoId         quien lo alquila (o null). Solo si el propietario NO vive ahi.
//    propietarioViveAhi  true si el dueño usa el depto (entonces no se puede alquilar)
//    pagaPropietario     si hay inquilino, true = las expensas las paga el dueño
//  (igual que la tabla Ocupacion del backend: varias personas por unidad + esResponsablePago)
//  Parqueo y Baulera: personaId = persona asociada (o null si esta libre).
//  El numero ('101') se obtiene del identificador con numeroDe(unidad).
// ------------------------------------------------------------
const depto = (id, numero, categoria, { propietarioId = null, inquilinoId = null, viveAhi = true } = {}) => ({
    id,
    tipo: 'Departamento',
    identificador: `Depto. ${numero}`,
    categoria,
    piso: Number(numero.charAt(0)),
    propietarioId,
    inquilinoId,
    propietarioViveAhi: Boolean(propietarioId) && viveAhi,
    pagaPropietario: false,
});

export const UNIDADES = [
    depto(1, '101', 'A', { propietarioId: 1 }),
    depto(2, '102', 'B', { propietarioId: 10, inquilinoId: 2, viveAhi: false }), // alquilado
    depto(3, '103', 'A', { propietarioId: 3 }),
    depto(4, '201', 'A', { propietarioId: 4 }),
    depto(5, '202', 'B', { propietarioId: 5 }),
    depto(6, '203', 'B', { propietarioId: 6 }),
    depto(7, '301', 'C', { inquilinoId: 7 }), // sin dueño registrado
    depto(8, '302', 'C', { propietarioId: 8 }),
    depto(9, '303', 'C', { propietarioId: 9 }),
    { id: 10, tipo: 'Parqueo', identificador: 'Parqueo P-08', nivel: 'Nivel 1', techado: true, personaId: 8 },
    { id: 11, tipo: 'Parqueo', identificador: 'Parqueo P-12', nivel: 'Nivel 1', techado: false, personaId: null },
    { id: 12, tipo: 'Baulera', identificador: 'Baulera B-06', nivel: 'Nivel 1', personaId: 9 },
    // Ejemplo completo: Ana Lopez tiene el Depto. 101 + Parqueo P-01 + Baulera B-02
    { id: 13, tipo: 'Parqueo', identificador: 'Parqueo P-01', nivel: 'Sótano 1', techado: true, personaId: 1 },
    { id: 14, tipo: 'Baulera', identificador: 'Baulera B-02', nivel: 'Sótano 1', personaId: 1 },
    { id: 15, tipo: 'Parqueo', identificador: 'Parqueo P-05', nivel: 'Sótano 1', techado: true, personaId: 5 },
];

// ------------------------------------------------------------
//  HISTORIAL DE OCUPANTES (personas que ya no viven en el depto)
//  El ocupante ACTUAL no se escribe aqui: sale de UNIDADES (ver ocupanteDe).
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

// Categoria de expensa (A/B/C) de un depto = su tipo de departamento
export const categoriaDe = (u) => u?.categoria ?? 'A';

// Parqueos y bauleras de una persona (ademas de su departamento):
// ej. Rafael Cruz -> Depto. 303 + Baulera B-06
export const inmueblesDePersona = (personaId) =>
    UNIDADES.filter((u) => u.personaId === personaId && u.tipo !== 'Departamento');

// Numeros de todos los deptos: ['101', '102', ...]
export const numerosDepto = () => departamentos().map(numeroDe);

// ---------- Departamento: propietario, inquilino y estado ----------

// Quien vive en el depto: el inquilino, o el propietario si vive ahi (o null)
export const ocupanteDe = (u) => personaPorId(u?.inquilinoId)
    ?? (u?.propietarioViveAhi ? personaPorId(u.propietarioId) : null);

// Responsable de pago: el inquilino (salvo que pague el dueño) o el propietario
export const responsablePagoDe = (u) => {
    const inquilino = personaPorId(u?.inquilinoId);
    const propietario = personaPorId(u?.propietarioId);
    if (inquilino && !(u.pagaPropietario && propietario)) return inquilino;
    return propietario;
};

// Estado del depto
export const ESTADOS_DEPTO = {
    LIBRE: 'Libre',
    PROPIETARIO: 'Ocupado por el propietario',
    DISPONIBLE: 'Disponible para alquilar',
    ALQUILADO: 'Alquilado',
};
export const estadoDepto = (u) => {
    if (u?.inquilinoId) return ESTADOS_DEPTO.ALQUILADO;
    if (u?.propietarioId) return u.propietarioViveAhi ? ESTADOS_DEPTO.PROPIETARIO : ESTADOS_DEPTO.DISPONIBLE;
    return ESTADOS_DEPTO.LIBRE;
};

// Depto de una persona: el que es suyo (propietario) o el que alquila (inquilino)
export const deptoDePersona = (personaId) => (personaId == null ? null
    : departamentos().find((d) => d.propietarioId === personaId || d.inquilinoId === personaId) ?? null);

// Responsable de pago de un depto a partir del numero ('101')
export const personaDeDepto = (numero) => responsablePagoDe(deptoPorNumero(numero));

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
//  La relacion se guarda en UNIDADES (propietarioId / inquilinoId). Los campos
//  unidad, tipoDepartamento y piso de cada persona se recalculan desde ahi.
// ------------------------------------------------------------

// Recalcula unidad / tipoDepartamento / piso de todas las personas.
// Llamar despues de registrar o editar una unidad.
export const sincronizarPersonas = () => {
    PERSONAS.forEach((p) => {
        const u = deptoDePersona(p.id);
        p.unidad = u ? u.identificador : '';
        p.tipoDepartamento = u ? tipoDeptoDe(u) : '';
        p.piso = u ? u.piso : '';
    });
};

const hoy = () => new Date().toISOString().slice(0, 10);

// Unidad de un tipo ('Departamento' | 'Parqueo' | 'Baulera') que tiene la persona (o null)
export const unidadDePersona = (personaId, tipo) => {
    if (tipo === 'Departamento') return deptoDePersona(personaId);
    return UNIDADES.find((u) => u.tipo === tipo && personaId != null && u.personaId === personaId) ?? null;
};

// ¿Se puede asignar este depto a una persona? (sin contar el que ya tiene)
//  - Propietario: el depto no tiene dueño.
//  - Inquilino: el depto no tiene inquilino y el dueño no vive ahi (o no tiene dueño).
const deptoDisponiblePara = (d, tipoPersona, personaId) => {
    if (tipoPersona === 'Propietario') return d.propietarioId == null || d.propietarioId === personaId;
    if (d.inquilinoId === personaId && personaId != null) return true;
    return d.inquilinoId == null && !d.propietarioViveAhi;
};

// Unidades de un tipo que se pueden asignar a una persona: las libres + la que ya tiene.
// En departamentos depende de si la persona es Propietario o Inquilino.
export const unidadesDisponibles = (tipo, personaId = null, tipoPersona = 'Propietario') => {
    if (tipo === 'Departamento') return departamentos().filter((d) => deptoDisponiblePara(d, tipoPersona, personaId));
    return UNIDADES.filter((u) => u.tipo === tipo && (u.personaId == null || u.personaId === personaId));
};

// Aplica cambios a un depto ({ propietarioId, inquilinoId, propietarioViveAhi, pagaPropietario })
// y, si cambia quien vive ahi, deja registrado al ocupante anterior en el historial.
export const actualizarDepto = (d, cambios) => {
    const antes = ocupanteDe(d);
    Object.assign(d, cambios);
    if (!d.propietarioId) d.propietarioViveAhi = false;
    if (!d.inquilinoId) d.pagaPropietario = false;
    const despues = ocupanteDe(d);
    if (antes?.id === despues?.id) return;
    if (antes) {
        OCUPANTES_ANTERIORES.push({
            unidadId: d.id, nombre: nombreCompleto(antes), tipo: antes.tipo,
            fechaInicio: INICIO_OCUPACION[d.id] ?? hoy(), fechaFin: hoy(),
        });
    }
    if (despues) INICIO_OCUPACION[d.id] = hoy();
    else delete INICIO_OCUPACION[d.id];
};

// Cambia la persona de un parqueo o una baulera (personaId o null para liberarla)
export const cambiarOcupante = (unidad, personaId) => {
    if (unidad && unidad.tipo !== 'Departamento') unidad.personaId = personaId ?? null;
};

// Asigna a una persona su departamento, parqueo y baulera (ids de UNIDADES o null).
// viveAhi: solo para propietarios (si no vive, el depto queda disponible para alquilar).
// La unidad que tenia antes de cada tipo queda libre. Llamar despues de registrar o editar una persona.
export const asignarUnidades = (personaId, { deptoId = null, parqueoId = null, bauleraId = null, viveAhi = true }) => {
    const esPropietario = personaPorId(personaId)?.tipo === 'Propietario';
    const campo = esPropietario ? 'propietarioId' : 'inquilinoId';

    const anterior = deptoDePersona(personaId);
    if (anterior && anterior.id !== deptoId) actualizarDepto(anterior, { [campo]: null });
    const destino = departamentos().find((d) => d.id === deptoId);
    if (destino) {
        actualizarDepto(destino, esPropietario
            ? { propietarioId: personaId, propietarioViveAhi: viveAhi && !destino.inquilinoId }
            : { inquilinoId: personaId });
    }

    [['Parqueo', parqueoId], ['Baulera', bauleraId]].forEach(([tipo, id]) => {
        const actual = unidadDePersona(personaId, tipo);
        if (actual && actual.id !== id) cambiarOcupante(actual, null);
        const nueva = UNIDADES.find((u) => u.id === id && u.tipo === tipo);
        if (nueva) cambiarOcupante(nueva, personaId);
    });
    sincronizarPersonas();
};

// Elimina a una persona del edificio: sus unidades quedan libres.
// (Su cuenta del sistema se elimina aparte: usuariosMock.eliminarCuentaDePersona)
export const eliminarPersona = (personaId) => {
    const d = deptoDePersona(personaId);
    if (d) actualizarDepto(d, d.propietarioId === personaId ? { propietarioId: null } : { inquilinoId: null });
    UNIDADES.filter((u) => u.personaId === personaId).forEach((u) => cambiarOcupante(u, null));
    const i = PERSONAS.findIndex((p) => p.id === personaId);
    if (i !== -1) PERSONAS.splice(i, 1);
    sincronizarPersonas();
};

// Estado inicial: completar las personas con los datos de su departamento
sincronizarPersonas();
