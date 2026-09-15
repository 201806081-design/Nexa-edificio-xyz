import {
  Box, Typography, Table, TableHead, TableBody, TableRow, TableCell,
  Button, Chip, Paper, IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { COPROPIETARIOS_MOCK } from '../../constants/copropietariosMock';

export default function Copropietarios() {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h1" sx={{ fontSize: '2rem', mb: 0.5 }}>
            Propietarios e inquilinos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Consulta las personas registradas en el edificio
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/copropietarios/registrar')}>
          Registrar persona
        </Button>
      </Box>

      <Paper sx={{ p: 2, borderRadius: 3 }}>
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
                <TableCell>
                  <Chip
                    label={p.tipo}
                    size="small"
                    sx={{
                      bgcolor: p.tipo === 'Propietario' ? '#C5E0F2' : '#E5E7EB',
                      color: '#132B3E',
                    }}
                  />
                </TableCell>
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
    </DashboardLayout>
  );
}
