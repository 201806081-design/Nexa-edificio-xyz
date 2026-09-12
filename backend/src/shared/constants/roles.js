// Roles del sistema (requisito 9 del pliego). En BD se guardan como enum en mayúsculas;
// el frontend (HU-SE-02) los muestra con la etiqueta en Capital Case.
const ROLES = Object.freeze({
  ADMINISTRADOR: 'ADMINISTRADOR',
  DIRECTORIO: 'DIRECTORIO',
  CONSULTA: 'CONSULTA',
});

const ETIQUETA_ROL = Object.freeze({
  ADMINISTRADOR: 'Administrador',
  DIRECTORIO: 'Directorio',
  CONSULTA: 'Consulta',
});

function etiquetaDeRol(rol) {
  return ETIQUETA_ROL[rol] ?? null;
}

function rolDesdeEtiqueta(etiqueta) {
  const entrada = Object.entries(ETIQUETA_ROL).find(([, v]) => v.toLowerCase() === String(etiqueta).toLowerCase());
  return entrada ? entrada[0] : null;
}

module.exports = { ROLES, ETIQUETA_ROL, etiquetaDeRol, rolDesdeEtiqueta };
