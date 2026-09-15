import {
  Box, Typography, Table, TableHead, TableBody, TableRow, TableCell,
  Button, Chip, Paper, IconButton, Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import BadgeIcon from '@mui/icons-material/Badge';
import PhoneIcon from '@mui/icons-material/Phone';
import ApartmentIcon from '@mui/icons-material/Apartment';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { COPROPIETARIOS_MOCK } from '../../constants/copropietariosMock';

// Color del chip segun el tipo (como el mockup: Propietario verde, Inquilino azul)
function chipSx(tipo) {
  return tipo === 'Propietario'
    ? { bgcolor: '#D6F0E4', color: '#2E9D78' }
    : { bgcolor: '#C5E0F2', color: '#1F5F8B' };
}

export default function Copropietarios() {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <Typography variant="h1" sx={{ fontSize: '2rem', mb: 0.5 }}>
        Propietarios e inquilinos
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Consulta las personas registradas en el edificio
      </Typography>

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
              <TableCell><strong>Contacto</strong></TableCell>
              <TableCell><strong>Unidad</strong></TableCell>
              <TableCell align="center"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {COPROPIETARIOS_MOCK.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.nombres} {p.apellidos}</TableCell>
                <TableCell><Chip label={p.tipo} size="small" sx={chipSx(p.tipo)} /></TableCell>
                <TableCell>CI {p.documento}</TableCell>
                <TableCell>{p.telefono}</TableCell>
                <TableCell>{p.unidad}</TableCell>
                <TableCell align="center">
                  <IconButton color="primary" onClick={() => navigate(`/copropietarios/${p.id}`)}>
                    <VisibilityIcon />
                  </IconButton>
                  <IconButton color="primary" onClick={() => navigate(`/copropietarios/${p.id}/editar`)}>
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Mostrando {COPROPIETARIOS_MOCK.length} registros
        </Typography>
      </Paper>

      {/* VISTA MOVIL: tarjetas */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {COPROPIETARIOS_MOCK.map((p) => (
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
              <PhoneIcon fontSize="small" color="primary" />
              <Typography variant="body2">{p.telefono}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: 'text.secondary' }}>
              <ApartmentIcon fontSize="small" color="primary" />
              <Typography variant="body2">{p.unidad}</Typography>
            </Box>
            <Divider sx={{ mb: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3 }}>
              <IconButton color="primary" onClick={() => navigate(`/copropietarios/${p.id}`)}>
                <VisibilityIcon />
              </IconButton>
              <IconButton color="primary" onClick={() => navigate(`/copropietarios/${p.id}/editar`)}>
                <EditIcon />
              </IconButton>
            </Box>
          </Paper>
        ))}
        <Typography variant="body2" color="text.secondary">
          Mostrando {COPROPIETARIOS_MOCK.length} registros
        </Typography>
      </Box>
    </DashboardLayout>
  );
}
