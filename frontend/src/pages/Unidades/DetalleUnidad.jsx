import { Box, Typography, Button, Chip, Alert, Divider } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { UNIDADES_MOCK } from '../../constants/unidadesMock';
import { COPROPIETARIOS_MOCK, nombreCompleto } from '../../constants/copropietariosMock';

function Dato({ etiqueta, valor }) {
    return (
        <Box sx={{ mb: 1.5 }}>
            <Typography variant="body2" color="text.secondary">{etiqueta}</Typography>
            <Typography variant="body1">{valor || '-'}</Typography>
        </Box>
    );
}

function chipSx(tipo) {
    if (tipo === 'Departamento') return { bgcolor: '#D6F0E4', color: '#2E9D78' };
    if (tipo === 'Parqueo') return { bgcolor: '#C5E0F2', color: '#1F5F8B' };
    return { bgcolor: '#FCE7CB', color: '#C06E00' }; // Baulera
}

function personaAsociada(personaId) {
    const p = COPROPIETARIOS_MOCK.find((c) => c.id === personaId);
    return p ? `${nombreCompleto(p)} — ${p.tipo}` : 'Sin asociación';
}

export default function DetalleUnidad() {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const mensaje = location.state?.mensaje;
    const unidad = UNIDADES_MOCK.find((u) => u.id === Number(id));

    if (!unidad) {
        return (
            <DashboardLayout>
                <Typography>Unidad no encontrada.</Typography>
                <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate('/unidades')}>
                    Volver a la lista
                </Button>
            </DashboardLayout>
        );
    }

    const esDepto = unidad.tipo === 'Departamento';

    return (
        <DashboardLayout>
            <Typography variant="h1" sx={{ fontSize: '2rem', mb: 0.5 }}>Detalle de unidad</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Informacion registrada de la unidad
            </Typography>

            {mensaje && <Alert severity="success" sx={{ mb: 3 }}>{mensaje}</Alert>}

            <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, p: 4, boxShadow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h3" sx={{ fontSize: '1.3rem', fontWeight: 700 }}>
                        {unidad.identificador}
                    </Typography>
                    <Chip label={unidad.tipo} sx={chipSx(unidad.tipo)} />
                </Box>

                <Typography variant="body2" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>Datos de la unidad</Typography>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
                    {esDepto ? (
                        <>
                            <Box sx={{ width: { xs: '100%', md: '50%' } }}><Dato etiqueta="Piso" valor={`Piso ${unidad.piso}`} /></Box>
                            <Box sx={{ width: { xs: '100%', md: '50%' } }}><Dato etiqueta="Tipo de departamento" valor={unidad.tipoDepartamento} /></Box>
                        </>
                    ) : (
                        <>
                            <Box sx={{ width: { xs: '100%', md: '50%' } }}><Dato etiqueta="Nivel" valor={unidad.nivel} /></Box>
                            {unidad.tipo === 'Parqueo' && (
                                <Box sx={{ width: { xs: '100%', md: '50%' } }}><Dato etiqueta="Techado" valor={unidad.techado ? 'Si' : 'No'} /></Box>
                            )}
                        </>
                    )}
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Asociacion</Typography>
                <Dato etiqueta="Persona asociada" valor={personaAsociada(unidad.personaId)} />

                <Box sx={{
                    display: 'flex', gap: 2, mt: 3,
                    flexDirection: { xs: 'column-reverse', md: 'row' },
                    justifyContent: { md: 'flex-end' },
                }}>
                    <Button variant="outlined" onClick={() => navigate('/unidades')}
                        sx={{ width: { xs: '100%', md: 'auto' } }}>
                        Volver a la lista
                    </Button>
                    {esDepto && (
                        <Button variant="outlined" startIcon={<HistoryIcon />}
                            onClick={() => navigate(`/unidades/historial?departamento=${unidad.id}`)}
                            sx={{ width: { xs: '100%', md: 'auto' } }}>
                            Ver historial
                        </Button>
                    )}
                    <Button variant="contained" startIcon={<EditIcon />}
                        onClick={() => navigate(`/unidades/${unidad.id}/editar`)}
                        sx={{ width: { xs: '100%', md: 'auto' } }}>
                        Editar datos
                    </Button>
                </Box>
            </Box>
        </DashboardLayout>
    );
}