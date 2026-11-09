// Catalogo de unidades del edificio: se lee de la fuente unica (edificioMock).
// tipo: 'Departamento' | 'Parqueo' | 'Baulera'
// personaId referencia a un copropietario (o null si esta sin asociar).
import {
    UNIDADES, PERSONAS, OCUPANTES_ANTERIORES, INICIO_OCUPACION,
    TIPOS_UNIDAD as TIPOS_U, TIPOS_DEPARTAMENTO as TIPOS_D, NIVELES as NIV,
    nombreCompleto,
} from './edificioMock';

// Mismo arreglo que UNIDADES: registrar o editar aqui se refleja en todo el sistema.
export const UNIDADES_MOCK = UNIDADES;

// Opciones para los selectores del formulario
export const TIPOS_UNIDAD = TIPOS_U;
export const TIPOS_DEPARTAMENTO = TIPOS_D;
export const NIVELES = NIV;

// Historial de ocupantes por unidad. fechaFin === null => ocupante actual.
// Se arma con el ocupante actual de cada unidad (UNIDADES.personaId) + los anteriores.
export const OCUPANTES_MOCK = [
    ...UNIDADES
        .filter((u) => u.personaId)
        .map((u) => {
            const p = PERSONAS.find((x) => x.id === u.personaId);
            return {
                unidadId: u.id, personaId: u.personaId, nombre: nombreCompleto(p), tipo: p?.tipo ?? '',
                fechaInicio: INICIO_OCUPACION[u.id] ?? '2024-01-01', fechaFin: null,
            };
        }),
    ...OCUPANTES_ANTERIORES.map((o) => ({ ...o, personaId: null })),
].map((o, i) => ({ id: i + 1, ...o }));

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
