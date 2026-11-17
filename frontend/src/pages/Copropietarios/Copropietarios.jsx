import { useState } from 'react';
import {
  Box, Typography, Table, TableHead, TableBody, TableRow, TableCell,
  Button, Chip, Paper, IconButton, Divider, Tooltip, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BadgeIcon from '@mui/icons-material/Badge';
import PhoneIcon from '@mui/icons-material/Phone';
import ApartmentIcon from '@mui/icons-material/Apartment';
import HomeIcon from '@mui/icons-material/Home';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { COPROPIETARIOS_MOCK, eliminarPersona, inmueblesDePersona } from '../../constants/copropietariosMock';
import { usuarioDePersona, eliminarCuentaDePersona } from '../../constants/usuariosMock';

// Color del chip segun el tipo (como el mockup: Propietario verde, Inquilino azul)
function chipSx(tipo) {
  return tipo === 'Propietario'
    ? { bgcolor: '#D6F0E4', color: '#2E9D78' }
    : { bgcolor: '#C5E0F2', color: '#1F5F8B' };
}

// Botones de accion de una persona (tabla y tarjetas)
function Acciones({ persona, onEliminar }) {
  const navigate = useNavigate();
  return (
    <>
      <Tooltip title="Ver detalle">
        <IconButton color="primary" onClick={() => navigate(`/copropietarios/${persona.id}`)}>
          <VisibilityIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Editar">
        <IconButton color="primary" onClick={() => navigate(`/copropietarios/${persona.id}/editar`)}>
          <EditIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Eliminar">
        <IconButton color="error" onClick={() => onEliminar(persona)}>
          <DeleteIcon />
        </IconButton>
      </Tooltip>
    </>
  );
}

// Lo que pierde la persona al eliminarla: "Depto. 101, Parqueo P-01"
const unidadesTexto = (p) => [p.unidad, ...inmueblesDePersona(p.id).map((u) => u.identificador)].filter(Boolean).join(', ');

export default function Copropietarios() {
  const navigate = useNavigate();
  const [personas, setPersonas] = useState(() => [...COPROPIETARIOS_MOCK]);
  const [eliminando, setEliminando] = useState(null);
  const [mensaje, setMensaje] = useState('');

  const confirmarEliminar = () => {
    // MOCK: se elimina de la lista. Con backend, aqui iria el DELETE.
    eliminarPersona(eliminando.id);
    eliminarCuentaDePersona(eliminando.id);
    setPersonas([...COPROPIETARIOS_MOCK]);
    setMensaje(`${eliminando.nombres} ${eliminando.apellidos} fue eliminado`);
    setEliminando(null);
  };

  return (
    <DashboardLayout>
      <Typography variant="h1" sx={{ fontSize: '2rem', mb: 0.5 }}>
        Propietarios e inquilinos
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Consulta las personas registradas en el edificio
      </Typography>

      {mensaje && <Alert severity="success" onClose={() => setMensaje('')} sx={{ mb: 2 }}>{mensaje}</Alert>}

      <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' }, mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/copropietarios/registrar')}
          sx={{ width: { xs: '100%', md: 'auto' } }}
        >
          Registrar persona
        </Button>
      </Box>

      {/* VISTA ESCRITORIO: tabla */}
      <Paper sx={{ p: 2, borderRadius: 3, display: { xs: 'none', md: 'block' } }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Nombre</strong></TableCell>
              <TableCell><strong>Tipo</strong></TableCell>
              <TableCell><strong>Documento</strong></TableCell>
              <TableCell><strong>Departamento</strong></TableCell>
              <TableCell><strong>Tipo de dpto</strong></TableCell>
              <TableCell><strong>Contacto</strong></TableCell>
              <TableCell align="center"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {personas.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.nombres} {p.apellidos}</TableCell>
                <TableCell><Chip label={p.tipo} size="small" sx={chipSx(p.tipo)} /></TableCell>
                <TableCell>CI {p.documento}</TableCell>
                <TableCell>{p.unidad}</TableCell>
                <TableCell>{p.tipoDepartamento}</TableCell>
                <TableCell>{p.telefono}</TableCell>
                <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                  <Acciones persona={p} onEliminar={setEliminando} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Mostrando {personas.length} registros
        </Typography>
      </Paper>

      {/* VISTA MOVIL: tarjetas */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {personas.map((p) => (
          <Paper key={p.id} sx={{ p: 2, borderRadius: 3, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography sx={{ fontWeight: 700 }}>{p.nombres} {p.apellidos}</Typography>
              <Chip label={p.tipo} size="small" sx={chipSx(p.tipo)} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, color: 'text.secondary' }}>
              <BadgeIcon fontSize="small" color="primary" />
              <Typography variant="body2">CI {p.documento}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, color: 'text.secondary' }}>
              <ApartmentIcon fontSize="small" color="primary" />
              <Typography variant="body2">{p.unidad}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, color: 'text.secondary' }}>
              <HomeIcon fontSize="small" color="primary" />
              <Typography variant="body2">{p.tipoDepartamento}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: 'text.secondary' }}>
              <PhoneIcon fontSize="small" color="primary" />
              <Typography variant="body2">{p.telefono}</Typography>
            </Box>
            <Divider sx={{ mb: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3 }}>
              <Acciones persona={p} onEliminar={setEliminando} />
            </Box>
          </Paper>
        ))}
        <Typography variant="body2" color="text.secondary">
          Mostrando {personas.length} registros
        </Typography>
      </Box>

      {/* Confirmar eliminar */}
      <Dialog open={!!eliminando} onClose={() => setEliminando(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Eliminar persona</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 1.5 }}>
            Se eliminara a <strong>{eliminando?.nombres} {eliminando?.apellidos}</strong> ({eliminando?.tipo}).
          </Typography>
          {eliminando && unidadesTexto(eliminando) && (
            <Typography variant="body2" sx={{ mb: 1 }}>
              Quedaran libres: <strong>{unidadesTexto(eliminando)}</strong>.
            </Typography>
          )}
          {eliminando && usuarioDePersona(eliminando.id) && (
            <Typography variant="body2">Tambien se eliminara su cuenta del sistema.</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" onClick={() => setEliminando(null)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={confirmarEliminar}>Eliminar</Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}