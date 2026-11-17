import { useState } from 'react';
import {
  Box, Typography, Table, TableHead, TableBody, TableRow, TableCell,
  Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, Paper, TextField, Alert, InputAdornment, ToggleButton, ToggleButtonGroup,
  IconButton, Tooltip, Switch, Snackbar,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import KeyIcon from '@mui/icons-material/Key';
import DeleteIcon from '@mui/icons-material/Delete';
import DashboardLayout from '../../layouts/DashboardLayout';
import CredencialesDialog from '../../components/CredencialesDialog';
import { useAuth } from '../../hooks/useAuth';
import { useEnvioCredenciales } from '../../hooks/useEnvioCredenciales';
import { ROLES, ROLES_GESTION, TIPOS_RESIDENTE } from '../../constants/permisos';
import {
  USUARIOS_MOCK, empleadoDeUsuario, usuarioDeEmpleado, tipoResidente, deptoDeUsuario, personasSinCuenta,
  crearUsuario, crearCuentaResidente, cambiarRol, cambiarEstado, eliminarUsuario, restablecerPassword,
  generarUsername, PASSWORD_INICIAL,
} from '../../constants/usuariosMock';
import { EMPLEADOS_MOCK } from '../../constants/personalMock';
import { PERSONAS, deptoDePersona, nombreCompleto } from '../../constants/edificioMock';

// Reglas de cuentas:
//  - Administrador: SIEMPRE es personal del edificio con cargo Administrador.
//  - Directorio y Consulta: personas externas (directorio, contador, auditor).
//  - Residente: copropietario o inquilino registrado en Copropietarios.
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const CELULAR_BO = /^[67]\d{7}$/;
const SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü' ]+$/;
const TODOS = 'Todos los roles';

const rolChipSx = (rol) => {
  if (rol === ROLES.ADMINISTRADOR) return { bgcolor: '#C5E0F2', color: '#132B3E' };
  if (rol === ROLES.DIRECTORIO) return { bgcolor: '#E4F4EE', color: '#2E9D78' };
  if (rol === ROLES.RESIDENTE) return { bgcolor: '#FDF0D5', color: '#B6802A' };
  return { bgcolor: '#F3F6FA', color: '#64748B' };
};

const NUEVO_VACIO = {
  rol: ROLES.CONSULTA, empleadoId: '', tipoResidente: TIPOS_RESIDENTE.Propietario, personaId: '',
  nombres: '', apellidos: '', email: '', celular: '',
};

const deptoTexto = (personaId) => deptoDePersona(personaId)?.identificador ?? 'Sin depto';

// Con quien esta vinculada la cuenta: personal, residente o externo
function Vinculo({ usuario }) {
  const emp = empleadoDeUsuario(usuario);
  if (emp) {
    return (
      <>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>Personal</Typography>
        <Typography variant="caption" color="text.secondary">{emp.id} · {emp.cargo}</Typography>
      </>
    );
  }
  if (usuario.rol === ROLES.RESIDENTE) {
    const depto = deptoDeUsuario(usuario);
    return <Typography variant="body2">{depto ? `Depto. ${depto}` : 'Sin depto asignado'}</Typography>;
  }
  return <Typography variant="body2" color="text.secondary">Externo</Typography>;
}

export default function Usuarios() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState(() => USUARIOS_MOCK.map((u) => ({ ...u })));
  const refrescar = () => setUsuarios(USUARIOS_MOCK.map((u) => ({ ...u }))); // tambien se ve en Personal > Empleados
  const [filtroRol, setFiltroRol] = useState(TODOS);
  const [aviso, setAviso] = useState(''); // error de una accion (ej. ultimo Administrador)
  const { credenciales, mostrar: mostrarCredenciales, cerrar: cerrarCredenciales } = useEnvioCredenciales();

  const esYo = (u) => u.username === user?.usuario;
  const visibles = filtroRol === TODOS ? usuarios : usuarios.filter((u) => u.rol === filtroRol);

  // Ejecuta una accion del mock y refresca; si devuelve error lo muestra
  const ejecutar = (accion) => {
    const error = accion();
    if (error) setAviso(error);
    refrescar();
  };

  // Empleados activos con cargo Administrador que todavia no tienen cuenta
  const administradoresSinCuenta = () => EMPLEADOS_MOCK.filter((e) => e.estado === 'Activo'
    && e.cargo === 'Administrador' && !usuarioDeEmpleado(e.id));

  // ---------- Cambiar rol ----------
  const [editando, setEditando] = useState(null);
  const [rolNuevo, setRolNuevo] = useState('');
  const [errorRol, setErrorRol] = useState('');
  const abrirCambioRol = (u) => { setEditando(u); setRolNuevo(u.rol); setErrorRol(''); };
  const guardarRol = () => {
    const error = cambiarRol(editando.id, rolNuevo);
    if (error) { setErrorRol(error); return; }
    refrescar();
    setEditando(null);
  };

  // ---------- Eliminar ----------
  const [eliminando, setEliminando] = useState(null);
  const confirmarEliminar = () => {
    ejecutar(() => eliminarUsuario(eliminando.id));
    setEliminando(null);
  };

  // ---------- Agregar usuario ----------
  const [nuevoAbierto, setNuevoAbierto] = useState(false);
  const [nuevo, setNuevo] = useState(NUEVO_VACIO);
  const [errores, setErrores] = useState({});
  const cambiarNuevo = (campo, valor) => {
    setNuevo((n) => {
      const sig = { ...n, [campo]: valor };
      if (campo === 'rol') { sig.empleadoId = ''; sig.personaId = ''; }
      if (campo === 'tipoResidente') sig.personaId = '';
      return sig;
    });
    setErrores((e) => ({ ...e, [campo]: '' }));
  };

  const guardarNuevo = () => {
    const e = {};
    let cuenta;
    if (nuevo.rol === ROLES.ADMINISTRADOR) {
      const emp = EMPLEADOS_MOCK.find((x) => x.id === nuevo.empleadoId);
      if (!emp) e.empleadoId = 'Elige un empleado';
      else cuenta = () => crearUsuario({ nombres: emp.nombres, apellidos: emp.apellidos, email: emp.correo, celular: emp.celular, rol: ROLES.ADMINISTRADOR, empleadoId: emp.id });
    } else if (nuevo.rol === ROLES.RESIDENTE) {
      const persona = PERSONAS.find((p) => p.id === nuevo.personaId);
      if (!persona) e.personaId = 'Elige una persona';
      else cuenta = () => crearCuentaResidente(persona);
    } else {
      const t = (v) => String(v || '').trim();
      if (!t(nuevo.nombres) || !SOLO_LETRAS.test(t(nuevo.nombres))) e.nombres = 'Solo letras, obligatorio';
      if (!t(nuevo.apellidos) || !SOLO_LETRAS.test(t(nuevo.apellidos))) e.apellidos = 'Solo letras, obligatorio';
      if (!CORREO.test(t(nuevo.email))) e.email = 'Correo no valido';
      else if (USUARIOS_MOCK.some((u) => u.email.toLowerCase() === t(nuevo.email).toLowerCase())) e.email = 'Ese correo ya tiene una cuenta';
      if (nuevo.celular && !CELULAR_BO.test(nuevo.celular)) e.celular = '8 digitos, empieza con 6 o 7';
      cuenta = () => crearUsuario({ nombres: t(nuevo.nombres), apellidos: t(nuevo.apellidos), email: t(nuevo.email).toLowerCase(), celular: nuevo.celular, rol: nuevo.rol });
    }
    setErrores(e);
    if (Object.keys(e).length) return;
    mostrarCredenciales(cuenta(), { titulo: 'Usuario creado' });
    refrescar();
    setNuevoAbierto(false);
  };

  const errProps = (c) => ({ error: !!errores[c], helperText: errores[c] || ' ' });

  // Datos de la persona elegida en el formulario, para mostrar su usuario ANTES de crear la cuenta
  const personaDelFormulario = () => {
    if (nuevo.rol === ROLES.ADMINISTRADOR) {
      const emp = EMPLEADOS_MOCK.find((x) => x.id === nuevo.empleadoId);
      return emp ? { nombres: emp.nombres, apellidos: emp.apellidos } : null;
    }
    if (nuevo.rol === ROLES.RESIDENTE) {
      const p = PERSONAS.find((x) => x.id === nuevo.personaId);
      return p ? { nombres: p.nombres, apellidos: p.apellidos, personaId: p.id } : null;
    }
    return nuevo.nombres.trim() ? { nombres: nuevo.nombres.trim(), apellidos: nuevo.apellidos.trim() } : null;
  };
  const datosNuevos = nuevoAbierto ? personaDelFormulario() : null;

  return (
    <DashboardLayout>
      <Typography variant="h1" sx={{ fontSize: '2rem', mb: 0.5 }}>
        Usuarios y roles
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Cuentas para entrar al sistema. El Administrador es parte del personal, Directorio y Consulta son externos
        y los Residentes son los copropietarios e inquilinos.
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', flexDirection: { xs: 'column', md: 'row' }, mb: 2 }}>
        <Select size="small" value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)} sx={{ minWidth: 200 }}>
          {[TODOS, ...Object.values(ROLES)].map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
        </Select>
        <Button variant="contained" startIcon={<PersonAddIcon />}
          onClick={() => { setNuevo(NUEVO_VACIO); setErrores({}); setNuevoAbierto(true); }}>
          Agregar usuario
        </Button>
      </Box>

      <Paper sx={{ p: 2, borderRadius: 3, overflowX: 'auto' }}>
        <Table sx={{ minWidth: 820 }}>
          <TableHead>
            <TableRow>
              <TableCell><strong>Correo</strong></TableCell>
              <TableCell><strong>Nombre</strong></TableCell>
              <TableCell><strong>Vinculo</strong></TableCell>
              <TableCell><strong>Rol asignado</strong></TableCell>
              <TableCell><strong>Estado</strong></TableCell>
              <TableCell align="right"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibles.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                  No hay usuarios con el rol {filtroRol}.
                </TableCell>
              </TableRow>
            )}
            {visibles.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.email || <Typography variant="body2" color="text.secondary">Sin correo</Typography>}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{u.nombre}</TableCell>
                <TableCell><Vinculo usuario={u} /></TableCell>
                <TableCell>
                  <Chip label={u.rol} size="small" sx={rolChipSx(u.rol)} />
                  {u.rol === ROLES.RESIDENTE && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      {tipoResidente(u)}
                    </Typography>
                  )}
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  <Tooltip title={esYo(u) ? 'No puedes desactivar tu propia cuenta' : ''}>
                    <span>
                      <Switch size="small" checked={u.activo} disabled={esYo(u)}
                        onChange={(e) => ejecutar(() => cambiarEstado(u.id, e.target.checked))} />
                    </span>
                  </Tooltip>
                  <Typography component="span" variant="body2" sx={{ color: u.activo ? 'success.main' : 'error.main', fontWeight: 600 }}>
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                  <Tooltip title={u.rol === ROLES.RESIDENTE ? 'El rol de residente no se cambia' : 'Cambiar rol'}>
                    <span>
                      <IconButton color="primary" onClick={() => abrirCambioRol(u)} disabled={u.rol === ROLES.RESIDENTE}>
                        <ManageAccountsIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Restablecer contraseña y enviarla a su correo">
                    <span>
                      <IconButton color="primary" disabled={!u.activo}
                        onClick={() => mostrarCredenciales(restablecerPassword(u.id), { titulo: 'Contraseña restablecida', motivo: 'restablecer' })}>
                        <KeyIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title={u.activo ? 'Desactiva la cuenta para poder eliminarla' : 'Eliminar usuario'}>
                    <span>
                      <IconButton color="error" disabled={u.activo || esYo(u)} onClick={() => setEliminando(u)}>
                        <DeleteIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Modal cambiar rol (solo roles de gestion; el Residente no cambia de rol) */}
      <Dialog open={!!editando} onClose={() => setEditando(null)} fullWidth maxWidth="xs">
        <DialogTitle>
          Cambiar rol
          <Typography variant="body2" color="text.secondary">
            {editando?.nombre}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1, mt: 1 }}>Rol asignado</Typography>
          <Select fullWidth value={rolNuevo} onChange={(e) => { setRolNuevo(e.target.value); setErrorRol(''); }}>
            {ROLES_GESTION.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </Select>
          {errorRol && <Alert severity="error" sx={{ mt: 2 }}>{errorRol}</Alert>}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button variant="outlined" onClick={() => setEditando(null)}>Cancelar</Button>
          <Button variant="contained" onClick={guardarRol}>Guardar cambios</Button>
        </DialogActions>
      </Dialog>

      {/* Modal agregar usuario */}
      <Dialog open={nuevoAbierto} onClose={() => setNuevoAbierto(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 700 }}>
          <PersonAddIcon color="primary" /> Agregar usuario
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Rol</Typography>
          <Select fullWidth size="small" value={nuevo.rol} onChange={(e) => cambiarNuevo('rol', e.target.value)} sx={{ mb: 2 }}>
            {Object.values(ROLES).map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </Select>

          {nuevo.rol === ROLES.ADMINISTRADOR && (
            <>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Empleado</Typography>
              <Select fullWidth size="small" displayEmpty value={nuevo.empleadoId} error={!!errores.empleadoId}
                onChange={(e) => cambiarNuevo('empleadoId', e.target.value)}>
                <MenuItem value=""><em>Elige un empleado</em></MenuItem>
                {administradoresSinCuenta().map((e) => (
                  <MenuItem key={e.id} value={e.id}>{e.nombre} · {e.cargo} · {e.correo}</MenuItem>
                ))}
              </Select>
              {errores.empleadoId && <Typography variant="caption" color="error">{errores.empleadoId}</Typography>}
              {administradoresSinCuenta().length === 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  No hay administradores sin cuenta. Al registrar un empleado con cargo Administrador en Personal,
                  su cuenta se crea sola.
                </Alert>
              )}
            </>
          )}

          {nuevo.rol === ROLES.RESIDENTE && (
            <>
              <ToggleButtonGroup exclusive fullWidth size="small" value={nuevo.tipoResidente} sx={{ mb: 2 }}
                onChange={(_, v) => { if (v) cambiarNuevo('tipoResidente', v); }}>
                {Object.values(TIPOS_RESIDENTE).map((t) => <ToggleButton key={t} value={t}>{t}</ToggleButton>)}
              </ToggleButtonGroup>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>{nuevo.tipoResidente}</Typography>
              <Select fullWidth size="small" displayEmpty value={nuevo.personaId} error={!!errores.personaId}
                onChange={(e) => cambiarNuevo('personaId', e.target.value)}>
                <MenuItem value=""><em>Elige una persona</em></MenuItem>
                {personasSinCuenta(nuevo.tipoResidente).map((p) => (
                  <MenuItem key={p.id} value={p.id}>{nombreCompleto(p)} · {deptoTexto(p.id)} · {p.correo || 'sin correo'}</MenuItem>
                ))}
              </Select>
              {errores.personaId && <Typography variant="caption" color="error">{errores.personaId}</Typography>}
              {personasSinCuenta(nuevo.tipoResidente).length === 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Todos los {nuevo.tipoResidente.toLowerCase()}s ya tienen cuenta. Para uno nuevo, registralo
                  primero en Copropietarios.
                </Alert>
              )}
            </>
          )}

          {(nuevo.rol === ROLES.DIRECTORIO || nuevo.rol === ROLES.CONSULTA) && (
            <>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField fullWidth size="small" label="Nombres" value={nuevo.nombres}
                  slotProps={{ htmlInput: { maxLength: 60 } }}
                  onChange={(e) => cambiarNuevo('nombres', e.target.value)} {...errProps('nombres')} />
                <TextField fullWidth size="small" label="Apellidos" value={nuevo.apellidos}
                  slotProps={{ htmlInput: { maxLength: 60 } }}
                  onChange={(e) => cambiarNuevo('apellidos', e.target.value)} {...errProps('apellidos')} />
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField fullWidth size="small" label="Correo" value={nuevo.email}
                  slotProps={{ htmlInput: { maxLength: 150 } }}
                  onChange={(e) => cambiarNuevo('email', e.target.value.trim())} {...errProps('email')} />
                <TextField fullWidth size="small" label="Celular (opcional)" value={nuevo.celular}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start">+591</InputAdornment> }, htmlInput: { inputMode: 'numeric' } }}
                  onChange={(e) => cambiarNuevo('celular', e.target.value.replace(/\D/g, '').slice(0, 8))} {...errProps('celular')} />
              </Box>
            </>
          )}

          {/* Unica vez que se ven el usuario y la contraseña: para dictarselos a la persona */}
          {datosNuevos ? (
            <Alert severity="info" icon={false} sx={{ bgcolor: '#E4EEF5', color: 'text.primary', mt: 2 }}>
              <Typography variant="body2">Usuario: <strong>{generarUsername(datosNuevos)}</strong></Typography>
              <Typography variant="body2">Contraseña inicial: <strong>{PASSWORD_INICIAL}</strong></Typography>
              <Typography variant="caption" color="text.secondary">
                Dictaselos ahora: al crear la cuenta se envian a su correo y ya no se vuelven a mostrar.
              </Typography>
            </Alert>
          ) : (
            <Alert severity="info" icon={false} sx={{ bgcolor: '#E4EEF5', color: 'text.primary', mt: 2 }}>
              <Typography variant="body2">
                {nuevo.rol === ROLES.RESIDENTE
                  ? 'Su usuario sera su numero de departamento y su nombre en minusculas (ej. 101ana)'
                  : 'Su usuario sera su nombre en minusculas'} y su contraseña inicial {PASSWORD_INICIAL}.
                Se le enviaran a su correo.
              </Typography>
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" onClick={() => setNuevoAbierto(false)}>Cancelar</Button>
          <Button variant="contained" onClick={guardarNuevo}>Crear usuario</Button>
        </DialogActions>
      </Dialog>

      {/* Confirmar eliminar */}
      <Dialog open={!!eliminando} onClose={() => setEliminando(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Eliminar usuario</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            Se eliminara la cuenta de <strong>{eliminando?.nombre}</strong>.
            La persona sigue registrada en el sistema, solo pierde el acceso.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" onClick={() => setEliminando(null)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={confirmarEliminar}>Eliminar</Button>
        </DialogActions>
      </Dialog>

      <CredencialesDialog credenciales={credenciales} onClose={cerrarCredenciales} />

      <Snackbar open={!!aviso} autoHideDuration={4000} onClose={() => setAviso('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="error" onClose={() => setAviso('')} sx={{ width: '100%' }}>{aviso}</Alert>
      </Snackbar>
    </DashboardLayout>
  );
}
