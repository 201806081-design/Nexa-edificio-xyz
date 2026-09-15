import { Box, Typography, Button, Chip, Alert, Divider, Grid } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { COPROPIETARIOS_MOCK } from '../../constants/copropietariosMock';

function Dato({ etiqueta, valor }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="body2" color="text.secondary">{etiqueta}</Typography>
      <Typography variant="body1">{valor || '-'}</Typography>
    </Box>
  );
}

export default function DetallePersona() {
  const navigate = useNavigate();
  const { id } = useParams();
  const persona = COPROPIETARIOS_MOCK.find((p) => p.id === Number(id));

  if (!persona) {
    return (
      <DashboardLayout>
        <Typography>Persona no encontrada.</Typography>
        <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate('/copropietarios')}>
          Volver a la lista
        </Button>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Typography variant="h1" sx={{ fontSize: '2rem', mb: 0.5 }}>Detalle de persona</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Informacion registrada del propietario o inquilino
      </Typography>

      <Alert severity="success" sx={{ mb: 3 }}>
        {persona.tipo} registrado correctamente
      </Alert>

      <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, p: 4, boxShadow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h3" sx={{ fontSize: '1.3rem', fontWeight: 700 }}>
            {persona.nombres} {persona.apellidos}
          </Typography>
          <Chip label={persona.tipo} sx={{ bgcolor: '#C5E0F2', color: '#132B3E' }} />
        </Box>

        <Typography variant="body2" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>Datos personales</Typography>
        <Dato etiqueta="Documento de identidad" valor={`CI ${persona.documento}`} />
        <Divider sx={{ my: 2 }} />

        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Datos de contacto</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}><Dato etiqueta="Telefono" valor={persona.telefono} /></Grid>
          <Grid item xs={12} md={6}><Dato etiqueta="Correo electronico" valor={persona.correo} /></Grid>
        </Grid>
        <Divider sx={{ my: 2 }} />

        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Unidad relacionada</Typography>
        <Dato etiqueta="Departamento" valor={persona.unidad} />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
          <Button variant="outlined" onClick={() => navigate('/copropietarios')}>Volver a la lista</Button>
          <Button variant="contained" startIcon={<EditIcon />} onClick={() => navigate(`/copropietarios/${persona.id}/editar`)}>
            Editar datos
          </Button>
        </Box>
      </Box>
    </DashboardLayout>
  );
}
