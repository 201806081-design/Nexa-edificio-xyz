// Copropietarios: se leen de la fuente unica del edificio (edificioMock).
// No escribir personas aqui: agregarlas o editarlas en edificioMock.js.
import { PERSONAS, departamentos, nombreCompleto as nombreCompletoBase, TIPOS_DEPARTAMENTO as TIPOS } from './edificioMock';
export { ESTADOS_CIVILES, inmueblesDePersona } from './edificioMock';

// Lista de copropietarios (es el mismo arreglo que PERSONAS: registrar o editar
// aqui se refleja en Unidades, Expensas, Pagos y Comunicados).
export const COPROPIETARIOS_MOCK = PERSONAS;

// Departamentos para el selector del formulario: ['Depto. 101', 'Depto. 102', ...]
// (lista inicial; el formulario usa deptosParaSelector() para ver tambien los registrados despues)
export const UNIDADES_MOCK = departamentos().map((u) => u.identificador);

// Deptos actuales con su tipo y piso (incluye los registrados desde Unidades)
export const deptosParaSelector = () => departamentos().map((u) => ({
  identificador: u.identificador, tipoDepartamento: u.tipoDepartamento, piso: u.piso,
}));

// Info de cada departamento para autocompletar tipo y piso al elegir en el formulario
export const UNIDADES_INFO = Object.fromEntries(
  departamentos().map((u) => [u.identificador, { tipoDepartamento: u.tipoDepartamento, piso: u.piso }]),
);

// Opciones para el selector de tipo de departamento
export const TIPOS_DEPARTAMENTO = TIPOS;

// Helper: nombre completo a partir del registro
export const nombreCompleto = nombreCompletoBase;
