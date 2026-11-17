// Catalogo de unidades del edificio: se lee de la fuente unica (edificioMock).
// tipo: 'Departamento' | 'Parqueo' | 'Baulera'
// personaId referencia a un copropietario (o null si esta sin asociar).
import {
    UNIDADES, PERSONAS, OCUPANTES_ANTERIORES, INICIO_OCUPACION,
    TIPOS_UNIDAD as TIPOS_U, NIVELES as NIV, CATEGORIAS_DEPTO as CATEGORIAS,
    nombreCompleto, numeroDe, tipoDeptoDe, unidadDePersona, sincronizarPersonas,
} from './edificioMock';
import { EXPENSAS_MOCK, sincronizarDepartamentosActivos } from './expensasMock';

// Mismo arreglo que UNIDADES: registrar o editar aqui se refleja en todo el sistema.
export const UNIDADES_MOCK = UNIDADES;

// Opciones para los selectores del formulario
export const TIPOS_UNIDAD = TIPOS_U;
export const CATEGORIAS_DEPTO = CATEGORIAS;
export const NIVELES = NIV;

// Historial de ocupantes de una unidad. fechaFin === null => ocupante actual.
// Se arma en cada consulta con el ocupante actual (UNIDADES.personaId) + los anteriores,
// asi refleja los cambios hechos desde Copropietarios y Unidades.
const ocupantesDe = (unidadId) => {
    const u = UNIDADES.find((x) => x.id === unidadId);
    const p = u?.personaId ? PERSONAS.find((x) => x.id === u.personaId) : null;
    const actual = p ? [{
        personaId: p.id, nombre: nombreCompleto(p), tipo: p.tipo,
        fechaInicio: INICIO_OCUPACION[unidadId] ?? '2024-01-01', fechaFin: null,
    }] : [];
    const anteriores = OCUPANTES_ANTERIORES.filter((o) => o.unidadId === unidadId).map((o) => ({ ...o, personaId: null }));
    return [...actual, ...anteriores].map((o, i) => ({ id: `${unidadId}-${i}`, unidadId, ...o }));
};

// --- Helpers ---
const porFechaDesc = (a, b) => b.fechaInicio.localeCompare(a.fechaInicio);

// Ocupante actual de una unidad (o null si no tiene)
export const ocupanteActual = (unidadId) => ocupantesDe(unidadId).find((o) => o.fechaFin === null) ?? null;

// Ocupantes anteriores, del mas reciente al mas antiguo
export const ocupantesAnteriores = (unidadId) =>
    ocupantesDe(unidadId).filter((o) => o.fechaFin !== null).sort(porFechaDesc);

// Historial completo (actual + anteriores), del mas reciente al mas antiguo
export const historialDe = (unidadId) => ocupantesDe(unidadId).sort(porFechaDesc);

// Solo departamentos (para el selector del historial)
export const departamentos = () => UNIDADES_MOCK.filter((u) => u.tipo === 'Departamento');

// Etiqueta legible de una unidad segun su tipo
export function etiquetaUnidad(u) {
    if (u.tipo === 'Departamento') return `${u.identificador} -- ${tipoDeptoDe(u)} -- piso ${u.piso}`;
    if (u.tipo === 'Parqueo') return `${u.identificador} -- ${u.nivel} -- ${u.techado ? 'Techado' : 'Sin techo'}`;
    return `${u.identificador} -- ${u.nivel}`; // Baulera
}

// Personas que se pueden asociar a una unidad de este tipo: las que todavia no tienen
// una unidad de ese tipo + la persona que ya la ocupa (al editar).
// Cada persona tiene como maximo 1 departamento, 1 parqueo y 1 baulera.
export const personasDisponibles = (tipo, unidadId = null) => PERSONAS.filter((p) => {
    const suya = unidadDePersona(p.id, tipo);
    return !suya || suya.id === unidadId;
});

// Elimina una unidad. Devuelve un mensaje de error o null si se elimino.
//  - Si tiene persona asociada, primero hay que quitarla (editar la unidad o la persona).
//  - Un departamento con expensas registradas no se elimina para no perder su historial financiero.
export const eliminarUnidad = (unidadId) => {
    const i = UNIDADES.findIndex((u) => u.id === unidadId);
    if (i === -1) return 'Unidad no encontrada';
    const u = UNIDADES[i];
    if (u.personaId) return `${u.identificador} tiene una persona asociada: quitala primero.`;
    if (u.tipo === 'Departamento' && EXPENSAS_MOCK.some((e) => String(e.depto) === numeroDe(u))) {
        return `${u.identificador} tiene expensas registradas: no se puede eliminar para no perder su historial financiero.`;
    }
    UNIDADES.splice(i, 1);
    sincronizarPersonas();
    sincronizarDepartamentosActivos(); // deja de aparecer en Finanzas y Comunicados
    return null;
};
