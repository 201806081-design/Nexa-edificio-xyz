// Roles del sistema (CA-01)
export const ROLES = {
  ADMINISTRADOR: 'Administrador',
  DIRECTORIO: 'Directorio',
  CONSULTA: 'Consulta',
  // Copropietarios e inquilinos: un solo rol con dos tipos (ver TIPOS_RESIDENTE).
  // Los dos tienen los mismos permisos; el tipo sale de su registro en Copropietarios.
  RESIDENTE: 'Residente',
};

// Roles del personal que administra el edificio (todo menos Residente)
export const ROLES_GESTION = [ROLES.ADMINISTRADOR, ROLES.DIRECTORIO, ROLES.CONSULTA];

// Tipos de residente. En edificioMock la persona guarda tipo 'Propietario' | 'Inquilino'.
export const TIPOS_RESIDENTE = { Propietario: 'Copropietario', Inquilino: 'Inquilino' };

// ------------------------------------------------------------
//  PANTALLAS DEL SISTEMA
//  Catalogo unico: de aqui salen el menu lateral, las rutas protegidas,
//  los accesos de Inicio y la lista de "Permisos por rol".
//  Un permiso = la clave de una pantalla. Las sub-rutas (registrar, detalle,
//  editar...) usan el permiso de su pantalla (ver routes/AppRoutes.jsx).
// ------------------------------------------------------------
export const PANTALLAS = [
  { clave: 'inicio', nombre: 'Inicio', grupo: 'General', ruta: '/dashboard', descripcion: 'Pantalla de bienvenida' },

  { clave: 'usuarios', nombre: 'Usuarios y roles', grupo: 'Seguridad', ruta: '/usuarios', descripcion: 'Crear, activar y eliminar cuentas' },
  { clave: 'permisos', nombre: 'Permisos por rol', grupo: 'Seguridad', ruta: '/permisos', descripcion: 'Definir que puede ver cada rol' },

  { clave: 'copropietarios', nombre: 'Copropietarios', grupo: 'Edificio', ruta: '/copropietarios', descripcion: 'Propietarios e inquilinos' },
  { clave: 'unidades', nombre: 'Unidades', grupo: 'Edificio', ruta: '/unidades', descripcion: 'Departamentos, parqueos y bauleras' },

  { clave: 'finanzas.resumen', nombre: 'Resumen', grupo: 'Finanzas', ruta: '/finanzas', descripcion: 'Resumen de la gestion financiera' },
  { clave: 'finanzas.dashboard', nombre: 'Dashboard', grupo: 'Finanzas', ruta: '/finanzas/dashboard', descripcion: 'Graficos e indicadores' },
  { clave: 'finanzas.expensas', nombre: 'Expensas', grupo: 'Finanzas', ruta: '/finanzas/expensas', descripcion: 'Generar expensas y su configuracion' },
  { clave: 'finanzas.pagos', nombre: 'Pagos', grupo: 'Finanzas', ruta: '/finanzas/pagos', descripcion: 'Registrar pagos, anticipos y conciliacion' },
  { clave: 'finanzas.estadoCuenta', nombre: 'Estado de cuenta', grupo: 'Finanzas', ruta: '/finanzas/estado-cuenta', descripcion: 'Deudas y pagos por departamento (el residente ve solo el suyo)' },
  { clave: 'finanzas.ingresosGastos', nombre: 'Ingresos y gastos', grupo: 'Finanzas', ruta: '/finanzas/ingresos-gastos', descripcion: 'Movimientos y flujo de caja' },
  { clave: 'finanzas.cajaBancos', nombre: 'Caja y bancos', grupo: 'Finanzas', ruta: '/finanzas/caja-bancos', descripcion: 'Caja, cuenta bancaria y conciliacion' },
  { clave: 'finanzas.mora', nombre: 'Mora e intereses', grupo: 'Finanzas', ruta: '/finanzas/mora', descripcion: 'Deudas vencidas e intereses' },

  { clave: 'personal.empleados', nombre: 'Empleados', grupo: 'Personal', ruta: '/personal/empleados', descripcion: 'Registro del personal del edificio' },
  { clave: 'personal.planilla', nombre: 'Planilla', grupo: 'Personal', ruta: '/personal/planilla', descripcion: 'Pago de sueldos del mes' },
  { clave: 'personal.historialPagos', nombre: 'Historial de pagos', grupo: 'Personal', ruta: '/personal/historial-pagos', descripcion: 'Sueldos pagados' },

  { clave: 'comunicados.elaborar', nombre: 'Elaborar', grupo: 'Comunicados', ruta: '/comunicados/elaborar', descripcion: 'Redactar y enviar comunicados' },
  { clave: 'comunicados.enviados', nombre: 'Enviados', grupo: 'Comunicados', ruta: '/comunicados/enviados', descripcion: 'Comunicados ya enviados' },
  { clave: 'comunicados.borradores', nombre: 'Borradores', grupo: 'Comunicados', ruta: '/comunicados/borradores', descripcion: 'Comunicados guardados sin enviar' },
];

export const GRUPOS = [...new Set(PANTALLAS.map((p) => p.grupo))];

export const pantallaPorClave = (clave) => PANTALLAS.find((p) => p.clave === clave) ?? null;

const clavesDe = (...grupos) => PANTALLAS.filter((p) => grupos.includes(p.grupo)).map((p) => p.clave);

// Permisos que NO se pueden quitar (casilla bloqueada):
//  - Inicio: es la pantalla a la que se entra despues del login.
//  - Permisos por rol del Administrador: si se lo quita nadie podria devolverlo.
export const PERMISOS_FIJOS = {
  [ROLES.ADMINISTRADOR]: ['inicio', 'permisos'],
  [ROLES.DIRECTORIO]: ['inicio'],
  [ROLES.CONSULTA]: ['inicio'],
  [ROLES.RESIDENTE]: ['inicio'],
};

export const esPermisoFijo = (rol, clave) => (PERMISOS_FIJOS[rol] ?? []).includes(clave);

// Permisos con los que arranca el sistema (el Administrador los cambia en "Permisos por rol")
export const PERMISOS_INICIALES = {
  [ROLES.ADMINISTRADOR]: PANTALLAS.map((p) => p.clave),
  [ROLES.DIRECTORIO]: ['inicio', ...clavesDe('Edificio', 'Finanzas')],
  [ROLES.CONSULTA]: ['inicio', ...clavesDe('Edificio', 'Finanzas')],
  [ROLES.RESIDENTE]: ['inicio', 'finanzas.estadoCuenta'],
};

// Deja la lista de un rol limpia: solo claves validas, sin repetidos y con sus fijos
export const normalizarPermisos = (rol, claves) => {
  const set = new Set([...(PERMISOS_FIJOS[rol] ?? []), ...claves]);
  return PANTALLAS.map((p) => p.clave).filter((c) => set.has(c));
};

// Menu segun lo que el rol puede ver. Devuelve, en orden:
//   { tipo: 'pantalla', pantalla }            -> opcion de un nivel
//   { tipo: 'grupo', grupo, pantallas: [...] } -> opcion con submenu
// Finanzas, Personal y Comunicados son submenus; si de un grupo solo queda
// una pantalla, se muestra directa (ej. el Residente ve "Estado de cuenta").
const GRUPOS_CON_SUBMENU = ['Finanzas', 'Personal', 'Comunicados'];

export const armarMenu = (puede) => {
  const menu = [];
  PANTALLAS.filter((p) => puede(p.clave)).forEach((p) => {
    if (!GRUPOS_CON_SUBMENU.includes(p.grupo)) { menu.push({ tipo: 'pantalla', pantalla: p }); return; }
    const existente = menu.find((m) => m.tipo === 'grupo' && m.grupo === p.grupo);
    if (existente) existente.pantallas.push(p);
    else menu.push({ tipo: 'grupo', grupo: p.grupo, pantallas: [p] });
  });
  return menu.map((m) => (m.tipo === 'grupo' && m.pantallas.length === 1
    ? { tipo: 'pantalla', pantalla: m.pantallas[0] }
    : m));
};
