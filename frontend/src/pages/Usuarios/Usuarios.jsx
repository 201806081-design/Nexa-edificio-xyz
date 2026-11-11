import { useState } from 'react';
import {
  Box, Typography, Table, TableHead, TableBody, TableRow, TableCell,
  Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, Paper, TextField, Alert, InputAdornment, ToggleButton, ToggleButtonGroup,
  IconButton, Tooltip,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import KeyIcon from '@mui/icons-material/Key';
import DashboardLayout from '../../layouts/DashboardLayout';
import { ROLES } from '../../constants/permisos';
import {
  USUARIOS_MOCK, empleadoDeUsuario, usuarioDeEmpleado, personalSugeridoParaRol, actualizarUsuario,
  crearUsuario, restablecerPassword,
} from '../../constants/usuariosMock';
import { EMPLEADOS_MOCK } from '../../constants/personalMock';

// Reglas de cuentas:
//  - Administrador: SIEMPRE es personal del edificio con cargo Administrador.
//  - Directorio y Consulta: pueden ser personas externas (directorio, contador, auditor)
//    o alguien del personal.
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const CELULAR_BO = /^[67]\d{7}$/;
const SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü' ]+$/;

const rolChipSx = (rol) => {
  if (rol === ROLES.ADMINISTRADOR) return { bgcolor: '#C5E0F2', color: '#132B3E' };
  if (rol === ROLES.DIRECTORIO) return { bgcolor: '#E4F4EE', color: '#2E9D78' };
  return { bgcolor: '#F3F6FA', color: '#64748B' };
};

const NUEVO_VACIO = { rol: ROLES.CONSULTA, origen: 'externo', empleadoId: '', nombres: '', apellidos: '', email: '', celular: '' };

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState(() => USUARIOS_MOCK.map((u) => ({ ...u })));
  const refrescar = () => setUsuarios(USUARIOS_MOCK.map((u) => ({ ...u }))); // tambien se ve en Personal > Empleados

  // Empleados activos que pueden recibir una cuenta (sin cuenta todavia)
  const empleadosSinCuenta = (rol) => EMPLEADOS_MOCK.filter((e) => e.estado === 'Activo'
    && !usuarioDeEmpleado(e.id)
    && (rol !== ROLES.ADMINISTRADOR || e.cargo === 'Administrador'));

  // ---------- Cambiar rol ----------
  const [editando, setEditando] = useState(null);
  const [rolNuevo, setRolNuevo] = useState('');
  const [empleadoNuevo, setEmpleadoNuevo] = useState('');
  const [errorRol, setErrorRol] = useState('');

  const abrirModal = (usuario) => {
    setEditando(usuario);
    setRolNuevo(usuario.rol);
    setEmpleadoNuevo(usuario.empleadoId || '');
    setErrorRol('');
  };
  // Al cambiar el rol, el personal vinculado cambia solo (se puede ajustar a mano)
  const cambiarRol = (rol) => {
    setRolNuevo(rol);
    setEmpleadoNuevo(personalSugeridoParaRol(rol) || '');
    setErrorRol('');
  };
  const guardarRol = () => {
    const emp = EMPLEADOS_MOCK.find((e) => e.id === empleadoNuevo);
    if (rolNuevo === ROLES.ADMINISTRADOR && (!emp || emp.cargo !== 'Administrador')) {
      setErrorRol('El Administrador debe ser un empleado con cargo Administrador. Registralo primero en Personal.');
      return;
    }
    actualizarUsuario(editando.id, { rol: rolNuevo, empleadoId: empleadoNuevo });
    refrescar();
    setEditando(null);
  };

  // ---------- Credenciales (alta o restablecer) ----------
  const [credenciales, setCredenciales] = useState(null); // { usuario, password, titulo }
  const restablecer = (u) => {
    const password = restablecerPassword(u.id);
    refrescar();
    setCredenciales({ usuario: u, password, titulo: 'Contraseña restablecida' });
  };

  // ---------- Agregar usuario ----------
  const [nuevoAbierto, setNuevoAbierto] = useState(false);
  const [nuevo, setNuevo] = useState(NUEVO_VACIO);
  const [errores, setErrores] = useState({});
  const cambiarNuevo = (campo, valor) => {
    setNuevo((n) => {
      const sig = { ...n, [campo]: valor };
      // El Administrador siempre es personal
      if (campo === 'rol' && valor === ROLES.ADMINISTRADOR) { sig.origen = 'personal'; sig.empleadoId = ''; }
      if (campo === 'origen') sig.empleadoId = '';
      return sig;
    });
    setErrores((e) => ({ ...e, [campo]: '' }));
  };
  const guardarNuevo = () => {
    const e = {};
    let datos;
    if (nuevo.origen === 'personal') {
      const emp = EMPLEADOS_MOCK.find((x) => x.id === nuevo.empleadoId);
      if (!emp) e.empleadoId = 'Elige un empleado';
      else datos = { nombres: emp.nombres, apellidos: emp.apellidos, nombre: emp.nombre, email: emp.correo, celular: emp.celular, empleadoId: emp.id };
    } else {
      const t = (v) => String(v || '').trim();
      if (!t(nuevo.nombres) || !SOLO_LETRAS.test(t(nuevo.nombres))) e.nombres = 'Solo letras, obligatorio';
      if (!t(nuevo.apellidos) || !SOLO_LETRAS.test(t(nuevo.apellidos))) e.apellidos = 'Solo letras, obligatorio';
      if (!CORREO.test(t(nuevo.email))) e.email = 'Correo no valido';
      else if (USUARIOS_MOCK.some((u) => u.email.toLowerCase() === t(nuevo.email).toLowerCase())) e.email = 'Ese correo ya tiene una cuenta';
      if (nuevo.celular && !CELULAR_BO.test(nuevo.celular)) e.celular = '8 digitos, empieza con 6 o 7';
      datos = { nombres: t(nuevo.nombres), apellidos: t(nuevo.apellidos), nombre: `${t(nuevo.nombres)} ${t(nuevo.apellidos)}`, email: t(nuevo.email).toLowerCase(), celular: nuevo.celular };
    }
    setErrores(e);
    if (Object.keys(e).length) return;
    const cuenta = crearUsuario({ ...datos, rol: nuevo.rol });
    refrescar();
    setNuevoAbierto(false);
    setCredenciales({ ...cuenta, titulo: 'Usuario creado' });
  };

  const errProps = (c) => ({ error: !!errores[c], helperText: errores[c] || ' ' });

  return (
    <DashboardLayout>
      <Typography variant="h1" sx={{ fontSize: '2rem', mb: 0.5 }}>
        Usuarios y roles
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Cuentas para entrar al sistema. El Administrador siempre es parte del personal; Directorio y Consulta pueden ser externos.
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' }, mb: 2 }}>
        <Button variant="contained" startIcon={<PersonAddIcon />} sx={{ width: { xs: '100%', md: 'auto' } }}
          onClick={() => { setNuevo(NUEVO_VACIO); setErrores({}); setNuevoAbierto(true); }}>
          Agregar usuario
        </Button>
      </Box>

      <Paper sx={{ p: 2, borderRadius: 3, overflowX: 'auto' }}>
        <Table sx={{ minWidth: 760 }}>
          <TableHead>
            <TableRow>
              <TableCell><strong>Usuario</strong></TableCell>
              <TableCell><strong>Nombre</strong></TableCell>
              <TableCell><strong>Personal del edificio</strong></TableCell>
              <TableCell><strong>Rol asignado</strong></TableCell>
              <TableCell><strong>Estado</strong></TableCell>
              <TableCell align="right"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {usuarios.map((u) => {
              const emp = empleadoDeUsuario(u);
              return (
                <TableRow key={u.id}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{u.username}</Typography>
                    <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                  </TableCell>
                  <TableCell>{u.nombre}</TableCell>
                  <TableCell>
                    {emp ? (
                      <>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{emp.nombre}</Typography>
                        <Typography variant="caption" color="text.secondary">{emp.id} · {emp.cargo}</Typography>
                      </>
                    ) : (
                      <Typography variant="body2" color="text.secondary">No es personal</Typography>
                    )}
                  </TableCell>
                  <TableCell><Chip label={u.rol} size="small" sx={rolChipSx(u.rol)} /></TableCell>
                  <TableCell>
                    <Chip size="small" label={u.activo ? (u.debeCambiarPassword ? 'Activo · clave temporal' : 'Activo') : 'Desactivado'}
                      sx={u.activo ? { bgcolor: '#E4F4EE', color: '#2E9D78' } : { bgcolor: '#FBEAE9', color: '#D9534F' }} />
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <Tooltip title="Cambiar rol">
                      <IconButton color="primary" onClick={() => abrirModal(u)}><ManageAccountsIcon /></IconButton>
                    </Tooltip>
                    <Tooltip title="Restablecer contraseña">
                      <span>
                        <IconButton color="primary" onClick={() => restablecer(u)} disabled={!u.activo}><KeyIcon /></IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>

      {/* Modal cambiar rol */}
      <Dialog open={!!editando} onClose={() => setEditando(null)} fullWidth maxWidth="xs">
        <DialogTitle>
          Cambiar rol
          <Typography variant="body2" color="text.secondary">
            {editando?.username} · {editando?.nombre}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1, mt: 1 }}>Rol asignado</Typography>
          <Select fullWidth value={rolNuevo} onChange={(e) => cambiarRol(e.target.value)}>
            {Object.values(ROLES).map((r) => (
              <MenuItem key={r} value={r}>{r}</MenuItem>
            ))}
          </Select>

          <Typography variant="body2" sx={{ mb: 1, mt: 2 }}>Personal del edificio</Typography>
          <Select fullWidth displayEmpty value={empleadoNuevo} onChange={(e) => { setEmpleadoNuevo(e.target.value); setErrorRol(''); }}>
            <MenuItem value=""><em>No es personal</em></MenuItem>
            {EMPLEADOS_MOCK.filter((e) => e.estado === 'Activo').map((e) => (
              <MenuItem key={e.id} value={e.id}>{e.nombre} · {e.cargo}</MenuItem>
            ))}
          </Select>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Se completa solo segun el rol: el Administrador es el empleado con cargo Administrador.
            Directorio y Consulta no son personal del edificio.
          </Typography>
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

          {nuevo.rol !== ROLES.ADMINISTRADOR && (
            <ToggleButtonGroup exclusive fullWidth size="small" value={nuevo.origen} sx={{ mb: 2 }}
              onChange={(_, v) => { if (v) cambiarNuevo('origen', v); }}>
              <ToggleButton value="externo">Persona externa</ToggleButton>
              <ToggleButton value="personal">Personal del edificio</ToggleButton>
            </ToggleButtonGroup>
          )}

          {nuevo.origen === 'personal' ? (
            <>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Empleado</Typography>
              <Select fullWidth size="small" displayEmpty value={nuevo.empleadoId} error={!!errores.empleadoId}
                onChange={(e) => cambiarNuevo('empleadoId', e.target.value)}>
                <MenuItem value=""><em>Elige un empleado</em></MenuItem>
                {empleadosSinCuenta(nuevo.rol).map((e) => (
                  <MenuItem key={e.id} value={e.id}>{e.nombre} · {e.cargo} · {e.correo}</MenuItem>
                ))}
              </Select>
              {errores.empleadoId && <Typography variant="caption" color="error">{errores.empleadoId}</Typography>}
              {nuevo.rol === ROLES.ADMINISTRADOR && empleadosSinCuenta(nuevo.rol).length === 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  No hay administradores sin cuenta. Al registrar un empleado con cargo Administrador en Personal,
                  su cuenta se crea sola.
                </Alert>
              )}
            </>
          ) : (
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
          <Alert severity="info" icon={false} sx={{ bgcolor: '#E4EEF5', color: 'text.primary', mt: 1 }}>
            <Typography variant="body2">
              Se generara el usuario y una contraseña temporal, que se enviara a su correo y celular.
              Al entrar por primera vez debera cambiarla.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" onClick={() => setNuevoAbierto(false)}>Cancelar</Button>
          <Button variant="contained" onClick={guardarNuevo}>Crear usuario</Button>
        </DialogActions>
      </Dialog>

      {/* Credenciales generadas */}
      <Dialog open={!!credenciales} onClose={() => setCredenciales(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 700 }}>
          <KeyIcon color="primary" /> {credenciales?.titulo}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ bgcolor: '#F3F6FA', borderRadius: 2, p: 2, mb: 2 }}>
            <Typography variant="body2">Usuario: <strong>{credenciales?.usuario.username}</strong></Typography>
            <Typography variant="body2">Contraseña temporal: <strong>{credenciales?.password}</strong></Typography>
          </Box>
          <Alert severity="info" icon={false} sx={{ bgcolor: '#E4EEF5', color: 'text.primary' }}>
            <Typography variant="body2">
              Se envio a <strong>{credenciales?.usuario.email}</strong>
              {credenciales?.usuario.celular ? <> y por SMS a <strong>+591 {credenciales.usuario.celular}</strong></> : null}.
              Debera cambiarla al entrar.
            </Typography>
            <Typography variant="caption" color="text.secondary">(Envio simulado: lo hara el backend.)</Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="contained" onClick={() => setCredenciales(null)}>Entendido</Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
