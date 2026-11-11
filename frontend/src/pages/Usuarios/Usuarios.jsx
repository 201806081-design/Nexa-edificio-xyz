import { useState } from 'react';
import {
  Typography, Table, TableHead, TableBody, TableRow, TableCell,
  Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, Paper,
} from '@mui/material';
import DashboardLayout from '../../layouts/DashboardLayout';
import { ROLES } from '../../constants/permisos';
import {
  USUARIOS_MOCK, empleadoDeUsuario, personalSugeridoParaRol, actualizarUsuario,
} from '../../constants/usuariosMock';
import { EMPLEADOS_MOCK } from '../../constants/personalMock';

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState(USUARIOS_MOCK);
  const [editando, setEditando] = useState(null); // usuario que se esta editando
  const [rolNuevo, setRolNuevo] = useState('');
  const [empleadoNuevo, setEmpleadoNuevo] = useState('');

  const abrirModal = (usuario) => {
    setEditando(usuario);
    setRolNuevo(usuario.rol);
    setEmpleadoNuevo(usuario.empleadoId || '');
  };

  // Al cambiar el rol, el personal vinculado cambia solo (se puede ajustar a mano)
  const cambiarRol = (rol) => {
    setRolNuevo(rol);
    setEmpleadoNuevo(personalSugeridoParaRol(rol) || '');
  };

  const cerrarModal = () => setEditando(null);

  const guardarRol = () => {
    actualizarUsuario(editando.id, { rol: rolNuevo, empleadoId: empleadoNuevo });
    setUsuarios(USUARIOS_MOCK.map((u) => ({ ...u }))); // tambien se ve en Personal > Empleados
    cerrarModal();
  };

  return (
    <DashboardLayout>
      <Typography variant="h1" sx={{ fontSize: '2rem', mb: 0.5 }}>
        Usuarios y roles
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Asigna un rol a cada usuario del sistema.
      </Typography>

      <Paper sx={{ p: 2, borderRadius: 3, overflowX: 'auto' }}>
        <Table sx={{ minWidth: 640 }}>
          <TableHead>
            <TableRow>
              <TableCell><strong>Usuario</strong></TableCell>
              <TableCell><strong>Nombre</strong></TableCell>
              <TableCell><strong>Personal del edificio</strong></TableCell>
              <TableCell><strong>Rol asignado</strong></TableCell>
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
                <TableCell>
                  <Chip label={u.rol} sx={{ bgcolor: '#C5E0F2', color: '#132B3E' }} />
                </TableCell>
                <TableCell align="right">
                  <Button variant="contained" onClick={() => abrirModal(u)}>
                    Cambiar rol
                  </Button>
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>

      {/* Modal cambiar rol */}
      <Dialog open={!!editando} onClose={cerrarModal} fullWidth maxWidth="xs">
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
          <Select fullWidth displayEmpty value={empleadoNuevo} onChange={(e) => setEmpleadoNuevo(e.target.value)}>
            <MenuItem value=""><em>No es personal</em></MenuItem>
            {EMPLEADOS_MOCK.filter((e) => e.estado === 'Activo').map((e) => (
              <MenuItem key={e.id} value={e.id}>{e.nombre} · {e.cargo}</MenuItem>
            ))}
          </Select>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Se completa solo segun el rol: el Administrador es el empleado con cargo Administrador.
            Directorio y Consulta no son personal del edificio.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button variant="outlined" onClick={cerrarModal}>Cancelar</Button>
          <Button variant="contained" onClick={guardarRol}>Guardar cambios</Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
