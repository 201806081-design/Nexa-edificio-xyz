import { useState } from 'react';
import {
  Typography, Table, TableHead, TableBody, TableRow, TableCell,
  Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, Paper,
} from '@mui/material';
import DashboardLayout from '../../layouts/DashboardLayout';
import { ROLES } from '../../constants/permisos';
import { USUARIOS_MOCK, empleadoDeUsuario } from '../../constants/usuariosMock';

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState(USUARIOS_MOCK);
  const [editando, setEditando] = useState(null); // usuario que se esta editando
  const [rolNuevo, setRolNuevo] = useState('');

  const abrirModal = (usuario) => {
    setEditando(usuario);
    setRolNuevo(usuario.rol);
  };

  const cerrarModal = () => setEditando(null);

  const guardarRol = () => {
    setUsuarios((lista) =>
      lista.map((u) => (u.id === editando.id ? { ...u, rol: rolNuevo } : u))
    );
    const original = USUARIOS_MOCK.find((u) => u.id === editando.id);
    if (original) original.rol = rolNuevo; // se mantiene al volver a la pantalla
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
          <Select fullWidth value={rolNuevo} onChange={(e) => setRolNuevo(e.target.value)}>
            {Object.values(ROLES).map((r) => (
              <MenuItem key={r} value={r}>{r}</MenuItem>
            ))}
          </Select>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button variant="outlined" onClick={cerrarModal}>Cancelar</Button>
          <Button variant="contained" onClick={guardarRol}>Guardar cambios</Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
