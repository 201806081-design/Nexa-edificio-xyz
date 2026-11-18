// Catalogo de unidades del edificio: se lee de la fuente unica (edificioMock).
// tipo: 'Departamento' | 'Parqueo' | 'Baulera'
// Departamento: propietarioId + inquilinoId. Parqueo y Baulera: deptoId (ver edificioMock).
import {
    UNIDADES, PERSONAS, OCUPANTES_ANTERIORES, INICIO_OCUPACION,
    TIPOS_UNIDAD as TIPOS_U, NIVELES as NIV, CATEGORIAS_DEPTO as CATEGORIAS,
    nombreCompleto, numeroDe, tipoDeptoDe, unidadDePersona, sincronizarPersonas, ocupanteDe,
    departamentos as deptosEdificio, anexoDeDepto, anexosDe, vincularAnexo,
} from './edificioMock';
import { EXPENSAS_MOCK, sincronizarDepartamentosActivos } from './expensasMock';

// Mismo arreglo que UNIDADES: registrar o editar aqui se refleja en todo el sistema.
export const UNIDADES_MOCK = UNIDADES;

// Opciones para los selectores del formulario
export const TIPOS_UNIDAD = TIPOS_U;
export const CATEGORIAS_DEPTO = CATEGORIAS;
export const NIVELES = NIV;

// Historial de ocupantes de una unidad. fechaFin === null => ocupante actual.
// Se arma en cada consulta con quien vive hoy en el depto (ocupanteDe) + los anteriores,
// asi refleja los cambios hechos desde Copropietarios y Unidades.
const ocupantesDe = (unidadId) => {
    const p = ocupanteDe(UNIDADES.find((x) => x.id === unidadId));
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
export const departamentos = deptosEdificio;

// Etiqueta legible de una unidad segun su tipo
export function etiquetaUnidad(u) {
    if (u.tipo === 'Departamento') return `${u.identificador} -- ${tipoDeptoDe(u)} -- piso ${u.piso}`;
    if (u.tipo === 'Parqueo') return `${u.identificador} -- ${u.nivel} -- ${u.techado ? 'Techado' : 'Sin techo'}`;
    return `${u.identificador} -- ${u.nivel}`; // Baulera
}

// Propietarios o inquilinos que se pueden asociar a un depto: los que todavia no tienen
// depto + el que ya lo tiene (al editar). Cada persona tiene como maximo 1 departamento.
export const personasDisponibles = (deptoId = null, tipoPersona = null) => PERSONAS.filter((p) => {
    if (tipoPersona && p.tipo !== tipoPersona) return false;
    const suyo = unidadDePersona(p.id, 'Departamento');
    return !suyo || suyo.id === deptoId;
});

// Deptos a los que se puede dar un parqueo o baulera: los que no tienen uno de ese tipo
// + el depto al que ya pertenece (al editar). Cada depto tiene como maximo 1 de cada uno.
export const deptosParaAnexo = (tipo, unidadId = null) => deptosEdificio().filter((d) => {
    const actual = anexoDeDepto(d.id, tipo);
    return !actual || actual.id === unidadId;
});

// Propietario, inquilino y responsable de pago a partir del formulario de unidad
export const datosDepto = (form) => ({
    propietarioId: form.propietarioId || null,
    inquilinoId: form.inquilinoId || null,
    propietarioViveAhi: Boolean(form.propietarioId) && form.propietarioViveAhi,
    pagaPropietario: Boolean(form.inquilinoId && form.propietarioId) && form.pagaPropietario,
});

// Elimina una unidad. Devuelve un mensaje de error o null si se elimino.
//  - Departamento: no se elimina si alguien vive ahi, ni si tiene expensas registradas
//    (para no perder su historial financiero). Su parqueo y baulera quedan libres.
//  - Parqueo / Baulera: no se elimina si esta en uso (alguien vive en su depto).
export const eliminarUnidad = (unidadId) => {
    const i = UNIDADES.findIndex((u) => u.id === unidadId);
    if (i === -1) return 'Unidad no encontrada';
    const u = UNIDADES[i];
    if (u.tipo === 'Departamento') {
        const ocupante = ocupanteDe(u);
        if (ocupante) {
            return `En el ${u.identificador} vive ${nombreCompleto(ocupante)} (${ocupante.tipo.toLowerCase()}). `
                + 'Primero, en Copropietarios, editalo y quitale el departamento (o marca que no vive ahi).';
        }
        if (EXPENSAS_MOCK.some((e) => String(e.depto) === numeroDe(u))) {
            return `${u.identificador} tiene expensas registradas: no se puede eliminar para no perder su historial financiero.`;
        }
        anexosDe(u).forEach((a) => vincularAnexo(a, null)); // su parqueo y baulera quedan libres
    } else if (ocupanteDe(UNIDADES.find((d) => d.id === u.deptoId))) {
        const d = UNIDADES.find((x) => x.id === u.deptoId);
        return `${u.identificador} esta en uso por el ${d.identificador}. Primero dejalo libre: `
            + `edita la unidad y elige "Libre", o en Copropietarios desactiva "Usa el ${u.tipo.toLowerCase()}".`;
    }
    UNIDADES.splice(i, 1);
    sincronizarPersonas();
    sincronizarDepartamentosActivos(); // deja de aparecer en Finanzas y Comunicados
    return null;
};
