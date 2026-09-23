// Catalogo de unidades del edificio (mock). Se reemplazara con el backend.
// tipo: 'Departamento' | 'Parqueo' | 'Baulera'
// personaId referencia a un copropietario (o null si esta sin asociar).
export const UNIDADES_MOCK = [
    { id: 1, tipo: 'Departamento', identificador: 'Depto. 302', piso: 3, tipoDepartamento: '2 dormitorios', personaId: 1 },
    { id: 2, tipo: 'Departamento', identificador: 'Depto. 321', piso: 3, tipoDepartamento: '1 dormitorio', personaId: 2 },
    { id: 3, tipo: 'Departamento', identificador: 'Depto. 101', piso: 1, tipoDepartamento: 'Monoambiente', personaId: null },
    { id: 4, tipo: 'Parqueo', identificador: 'P-08', nivel: 'Nivel 1', techado: true, personaId: 1 },
    { id: 5, tipo: 'Parqueo', identificador: 'P-12', nivel: 'Nivel 1', techado: false, personaId: null },
    { id: 6, tipo: 'Baulera', identificador: 'B-06', nivel: 'Nivel 1', personaId: 3 },
];

// Opciones para los selectores del formulario
export const TIPOS_UNIDAD = ['Departamento', 'Parqueo', 'Baulera'];
export const TIPOS_DEPARTAMENTO = ['Monoambiente', '1 dormitorio', '2 dormitorios'];
export const NIVELES = ['Nivel 1', 'Nivel 2', 'Sótano 1', 'Sótano 2'];

// Historial de ocupantes por unidad. fechaFin === null => ocupante actual.
// Se guarda el nombre para que el historial no dependa de otros mocks.
export const OCUPANTES_MOCK = [
    // Depto. 302 (id 1): actual + 2 anteriores
    { id: 1, unidadId: 1, personaId: 1, nombre: 'Maria Jose Quispe', tipo: 'Propietario', fechaInicio: '2025-01-15', fechaFin: null },
    { id: 2, unidadId: 1, personaId: null, nombre: 'Carlos Mendoza', tipo: 'Inquilino', fechaInicio: '2023-03-01', fechaFin: '2024-12-31' },
    { id: 3, unidadId: 1, personaId: null, nombre: 'Ana Rivera', tipo: 'Inquilino', fechaInicio: '2021-01-10', fechaFin: '2023-02-20' },
    // Depto. 321 (id 2): actual + 1 anterior
    { id: 4, unidadId: 2, personaId: 2, nombre: 'Wilian Uribe', tipo: 'Inquilino', fechaInicio: '2024-06-01', fechaFin: null },
    { id: 5, unidadId: 2, personaId: null, nombre: 'Roberto Salazar', tipo: 'Propietario', fechaInicio: '2019-06-01', fechaFin: '2020-12-31' },
    // Depto. 101 (id 3): sin ocupantes -> caso vacio
];

// --- Helpers ---
const porFechaDesc = (a, b) => b.fechaInicio.localeCompare(a.fechaInicio);

// Ocupante actual de una unidad (o null si no tiene)
export const ocupanteActual = (unidadId) =>
    OCUPANTES_MOCK.find((o) => o.unidadId === unidadId && o.fechaFin === null) ?? null;

// Ocupantes anteriores, del mas reciente al mas antiguo
export const ocupantesAnteriores = (unidadId) =>
    OCUPANTES_MOCK.filter((o) => o.unidadId === unidadId && o.fechaFin !== null).sort(porFechaDesc);

// Historial completo (actual + anteriores), del mas reciente al mas antiguo
export const historialDe = (unidadId) =>
    OCUPANTES_MOCK.filter((o) => o.unidadId === unidadId).sort(porFechaDesc);

// Solo departamentos (para el selector del historial)
export const departamentos = () => UNIDADES_MOCK.filter((u) => u.tipo === 'Departamento');

// Etiqueta legible de una unidad segun su tipo
export function etiquetaUnidad(u) {
    if (u.tipo === 'Departamento') return `${u.identificador} -- ${u.tipoDepartamento} -- piso ${u.piso}`;
    if (u.tipo === 'Parqueo') return `${u.identificador} -- ${u.nivel} -- ${u.techado ? 'Techado' : 'Sin techo'}`;
    return `${u.identificador} -- ${u.nivel}`; // Baulera
}
