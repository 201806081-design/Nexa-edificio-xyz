// Datos de prueba de copropietarios. Se reemplazaran con los del backend.
export const COPROPIETARIOS_MOCK = [
  {
    id: 1,
    nombres: 'Maria',
    apellidos: 'Jose',
    tipo: 'Propietario',
    documento: '9453876',
    telefono: '67453210',
    correo: 'mariajose@gmail.com',
    unidad: 'Depto. 123',
    tipoDepartamento: '2 dormitorios',
    piso: 1,
  },
  {
    id: 2,
    nombres: 'Wilian',
    apellidos: 'Uribe',
    tipo: 'Inquilino',
    documento: '74538792',
    telefono: '77546070',
    correo: 'wilian@gmail.com',
    unidad: 'Depto. 321',
    tipoDepartamento: '1 dormitorio',
    piso: 3,
  },
  {
    id: 3,
    nombres: 'Javier',
    apellidos: 'Rojas',
    tipo: 'Propietario',
    documento: '93452967',
    telefono: '77654390',
    correo: 'javier@gmail.com',
    unidad: 'Depto. 334',
    tipoDepartamento: 'Monoambiente',
    piso: 3,
  },
];

// Unidades disponibles para el selector (mock)
export const UNIDADES_MOCK = ['Depto. 123', 'Depto. 302', 'Depto. 321', 'Depto. 334'];

// Info de cada unidad para autocompletar tipo y piso al elegir en el formulario
export const UNIDADES_INFO = {
  'Depto. 123': { tipoDepartamento: '2 dormitorios', piso: 1 },
  'Depto. 302': { tipoDepartamento: '2 dormitorios', piso: 3 },
  'Depto. 321': { tipoDepartamento: '1 dormitorio', piso: 3 },
  'Depto. 334': { tipoDepartamento: 'Monoambiente', piso: 3 },
};

// Opciones para el selector de tipo de departamento
export const TIPOS_DEPARTAMENTO = ['Monoambiente', '1 dormitorio', '2 dormitorios'];

// Helper: nombre completo a partir del registro
export const nombreCompleto = (p) => `${p.nombres} ${p.apellidos}`.trim();