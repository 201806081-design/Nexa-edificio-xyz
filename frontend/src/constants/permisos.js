// Roles del sistema (CA-01)
export const ROLES = {
  ADMINISTRADOR: 'Administrador',
  DIRECTORIO: 'Directorio',
  CONSULTA: 'Consulta',
};

// Modulos del sistema (salen del documento de requerimientos)
export const MODULOS = [
  'Copropietarios',
  'Gestion de expensas',
  'Ingresos y egresos',
  'Caja y bancos',
  'Reportes',
  'Administracion de personal',
  'Comunicados',
  'Gestion documental',
  'Auditoria',
];

// Que puede hacer cada rol en cada modulo (segun los mockups "Permisos por rol")
// 'total' = acceso completo | 'consulta' = solo lectura | 'ninguno' = sin acceso
export const PERMISOS_POR_ROL = {
  [ROLES.ADMINISTRADOR]: {
    Copropietarios: 'total',
    'Gestion de expensas': 'total',
    'Ingresos y egresos': 'total',
    'Caja y bancos': 'total',
    Reportes: 'total',
    'Administracion de personal': 'total',
    Comunicados: 'total',
    'Gestion documental': 'total',
    Auditoria: 'total',
  },
  [ROLES.DIRECTORIO]: {
    Copropietarios: 'total',
    'Gestion de expensas': 'total',
    'Ingresos y egresos': 'total',
    'Caja y bancos': 'total',
    Reportes: 'total',
    'Administracion de personal': 'ninguno',
    Comunicados: 'total',
    'Gestion documental': 'total',
    Auditoria: 'ninguno',
  },
  [ROLES.CONSULTA]: {
    Copropietarios: 'consulta',
    'Gestion de expensas': 'consulta',
    'Ingresos y egresos': 'ninguno',
    'Caja y bancos': 'ninguno',
    Reportes: 'consulta',
    'Administracion de personal': 'ninguno',
    Comunicados: 'consulta',
    'Gestion documental': 'consulta',
    Auditoria: 'ninguno',
  },
};

// Opciones del menu lateral que ve cada rol
// Admin ve todas las opciones; Directorio y Consulta ven Inicio, Copropietarios, Unidades y Finanzas.
// 'Personal' (HU-AP-01) solo es visible para Administrador porque es el unico que tiene
// permiso 'total' sobre 'Administracion de personal' en PERMISOS_POR_ROL (los demas: 'ninguno').
// 'Comunicados' (HU-CO-01) solo es visible para Administrador en esta entrega:
// el alcance de la historia cubre las pantallas Elaborar + Enviados que son de administracion;
// mas adelante se puede ampliar a Directorio (tambien tiene 'total') y a Consulta (tiene 'consulta').
export const MENU_POR_ROL = {
  [ROLES.ADMINISTRADOR]: ['Inicio', 'Usuarios y roles', 'Permisos por rol', 'Copropietarios', 'Unidades', 'Finanzas', 'Personal', 'Comunicados'],
  [ROLES.DIRECTORIO]: ['Inicio', 'Copropietarios', 'Unidades', 'Finanzas'],
  [ROLES.CONSULTA]: ['Inicio', 'Copropietarios', 'Unidades', 'Finanzas'],
};