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
// Admin ve todas las opciones; Directorio y Consulta ven Inicio, Copropietarios y Unidades
export const MENU_POR_ROL = {
  [ROLES.ADMINISTRADOR]: ['Inicio', 'Usuarios y roles', 'Permisos por rol', 'Copropietarios', 'Unidades'],
  [ROLES.DIRECTORIO]: ['Inicio', 'Copropietarios', 'Unidades'],
  [ROLES.CONSULTA]: ['Inicio', 'Copropietarios', 'Unidades'],
};