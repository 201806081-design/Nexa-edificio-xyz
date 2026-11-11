import { Box, Typography, Button, Chip, Alert, Divider } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { COPROPIETARIOS_MOCK, inmueblesDePersona } from '../../constants/copropietariosMock';

function Dato({ etiqueta, valor }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="body2" color="text.secondary">{etiqueta}</Typography>
      <Typography variant="body1">{valor || '-'}</Typography>
    </Box>
  );
}

function chipSx(tipo) {
  return tipo === 'Propietario'
    ? { bgcolor: '#D6F0E4', color: '#2E9D78' }
    : { bgcolor: '#C5E0F2', color: '#1F5F8B' };
}

export default function DetallePersona() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  // Mensaje de exito solo si viene de registrar/editar
  const mensaje = location.state?.mensaje;
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

      {mensaje && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {mensaje}
        </Alert>
      )}

      <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, p: 4, boxShadow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h3" sx={{ fontSize: '1.3rem', fontWeight: 700 }}>
            {persona.nombres} {persona.apellidos}
          </Typography>
          <Chip label={persona.tipo} sx={chipSx(persona.tipo)} />
        </Box>

        <Typography variant="body2" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>Datos personales</Typography>
        <Dato etiqueta="Documento de identidad" valor={`CI ${persona.documento}`} />
        <Divider sx={{ my: 2 }} />

        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Datos de contacto</Typography>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
          <Box sx={{ width: { xs: '100%', md: '50%' } }}>
            <Dato etiqueta="Telefono" valor={persona.telefono} />
          </Box>
          <Box sx={{ width: { xs: '100%', md: '50%' } }}>
            <Dato etiqueta="Correo electronico" valor={persona.correo} />
          </Box>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Datos del hogar</Typography>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
          <Box sx={{ width: { xs: '100%', md: '33%' } }}>
            <Dato etiqueta="Estado civil" valor={persona.estadoCivil} />
          </Box>
          <Box sx={{ width: { xs: '100%', md: '33%' } }}>
            <Dato etiqueta="Numero de hijos" valor={String(persona.hijos ?? '-')} />
          </Box>
          <Box sx={{ width: { xs: '100%', md: '33%' } }}>
            <Dato etiqueta="Personas que viven en el depto" valor={String(persona.habitantes ?? '-')} />
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Unidad relacionada</Typography>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
          <Box sx={{ width: { xs: '100%', md: '33%' } }}>
            <Dato etiqueta="Departamento" valor={persona.unidad} />
          </Box>
          <Box sx={{ width: { xs: '100%', md: '33%' } }}>
            <Dato etiqueta="Tipo de departamento" valor={persona.tipoDepartamento} />
          </Box>
          <Box sx={{ width: { xs: '100%', md: '33%' } }}>
            <Dato etiqueta="Piso" valor={persona.piso} />
          </Box>
        </Box>

        {/* Otros inmuebles de la persona: parqueos y bauleras (se asignan en Unidades) */}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 0.5 }}>Parqueos y bauleras</Typography>
        {inmueblesDePersona(persona.id).length === 0 ? (
          <Typography variant="body1">Sin parqueo ni baulera asignados</Typography>
        ) : (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {inmueblesDePersona(persona.id).map((u) => (
              <Chip key={u.id} size="small"
                label={`${u.identificador} · ${u.nivel}${u.tipo === 'Parqueo' ? (u.techado ? ' · Techado' : ' · Sin techo') : ''}`}
                sx={u.tipo === 'Parqueo' ? { bgcolor: '#C5E0F2', color: '#1F5F8B' } : { bgcolor: '#FCE7CB', color: '#C06E00' }} />
            ))}
          </Box>
        )}

        <Box sx={{
          display: 'flex', gap: 2, mt: 3,
          flexDirection: { xs: 'column-reverse', md: 'row' },
          justifyContent: { md: 'flex-end' },
        }}>
          <Button variant="outlined" onClick={() => navigate('/copropietarios')}
            sx={{ width: { xs: '100%', md: 'auto' } }}>
            Volver a la lista
          </Button>
          <Button variant="contained" startIcon={<EditIcon />}
            onClick={() => navigate(`/copropietarios/${persona.id}/editar`)}
            sx={{ width: { xs: '100%', md: 'auto' } }}>
            Editar datos
          </Button>
        </Box>
      </Box>
    </DashboardLayout>
  );
}