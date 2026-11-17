// Copropietarios: se leen de la fuente unica del edificio (edificioMock).
// No escribir personas aqui: agregarlas o editarlas en edificioMock.js.
import { PERSONAS, nombreCompleto as nombreCompletoBase } from './edificioMock';
export {
  ESTADOS_CIVILES, inmueblesDePersona, unidadDePersona, unidadesDisponibles, asignarUnidades, eliminarPersona,
} from './edificioMock';

// Lista de copropietarios (es el mismo arreglo que PERSONAS: registrar o editar
// aqui se refleja en Unidades, Expensas, Pagos y Comunicados).
export const COPROPIETARIOS_MOCK = PERSONAS;

// Helper: nombre completo a partir del registro
export const nombreCompleto = nombreCompletoBase;
