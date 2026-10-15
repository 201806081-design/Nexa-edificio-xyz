import { useState } from 'react';
import {
    Box, Typography, Select, MenuItem, Paper, Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PercentIcon from '@mui/icons-material/Percent';
import ScheduleIcon from '@mui/icons-material/Schedule';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
    DEPARTAMENTOS_CUENTA, PERIODOS_CUENTA, ESTADO_CUENTA_MOCK,
} from '../../constants/estadoCuentaMock';
import { formatBs } from '../../constants/finanzasMock';

export default function EstadoCuenta() {
    const [seleccion, setSeleccion] = useState('');
    const [periodo, setPeriodo] = useState(PERIODOS_CUENTA[0]);
    const [consultado, setConsultado] = useState(null);

    const consultar = () => {
        if (seleccion) setConsultado(ESTADO_CUENTA_MOCK[seleccion]);
    };

    const RESUMEN = consultado ? [
        { label: 'Expensas generados', valor: consultado.resumen.totalGenerado, icon: <DescriptionOutlinedIcon />, color: 'primary.main', bg: '#E4EEF5' },
        { label: 'Pagos realizados', valor: consultado.resumen.totalPagado, icon: <CheckCircleIcon />, color: '#2E9D78', bg: '#E4F4EE' },
        { label: 'Interes acumulado', valor: consultado.resumen.interesAcumulado, icon: <PercentIcon />, color: '#D9534F', bg: '#FBEAE9' },
        { label: 'Saldo pendiente', valor: consultado.resumen.saldoPendiente, icon: <ScheduleIcon />, color: '#B6802A', bg: '#FDF0D5' },
    ] : [];

    return (
        <DashboardLayout>
            <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Estado de cuenta por departamento</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Consulta las expensas, pagos y saldos de una unidad
            </Typography>

            {/* Selector: departamento + periodo + consultar */}
            <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'flex-end' } }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Departamento</Typography>
                        <Select fullWidth displayEmpty value={seleccion} onChange={(e) => setSeleccion(e.target.value)}>
                            <MenuItem value=""><em>Seleccionar departamento</em></MenuItem>
                            {DEPARTAMENTOS_CUENTA.map((d) => <MenuItem key={d.id} value={d.id}>{d.etiqueta}</MenuItem>)}
                        </Select>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Periodo</Typography>
                        <Select fullWidth value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
                            {PERIODOS_CUENTA.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                        </Select>
                    </Box>
                    <Button variant="contained" startIcon={<SearchIcon />} onClick={consultar}
                        sx={{ width: { xs: '100%', md: 'auto' }, height: { md: 56 } }}>
                        Consultar estado
                    </Button>
                </Box>
            </Paper>

            {/* Estado vacio */}
            {!consultado && (
                <Paper sx={{ p: 8, borderRadius: 2, textAlign: 'center', color: 'text.secondary' }}>
                    <ApartmentIcon sx={{ fontSize: 72, color: '#9aa8b6', mb: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Seleccione un departamento</Typography>
                    <Typography variant="body2">Elige una unidad para consultar su informacion financiera</Typography>
                </Paper>
            )}

            {/* Detalle del estado de cuenta */}
            {consultado && (
                <Box>
                    {/* Encabezado del departamento */}
                    <Paper sx={{ p: 2.5, borderRadius: 2, mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ flexShrink: 0, width: 48, height: 48, borderRadius: '50%', bgcolor: '#FDF0D5', color: '#B6802A', display: 'grid', placeItems: 'center' }}>
                            <PeopleAltIcon />
                        </Box>
                        <Box>
                            <Typography sx={{ fontWeight: 700 }}>{consultado.departamento}</Typography>
                            <Typography variant="body2" color="text.secondary">Responsable: {consultado.responsable}</Typography>
                            <Typography variant="body2" color="text.secondary">Periodo consultado: {consultado.periodoConsultado}</Typography>
                        </Box>
                    </Paper>

                    {/* Tarjetas de resumen (4) */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
                        {RESUMEN.map((r) => (
                            <Paper key={r.label} sx={{ p: 2.5, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ flexShrink: 0, width: 48, height: 48, borderRadius: '50%', bgcolor: r.bg, color: r.color, display: 'grid', placeItems: 'center' }}>
                                    {r.icon}
                                </Box>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="body2" color="text.secondary">{r.label}</Typography>
                                    <Typography variant="h3" sx={{ fontWeight: 700, color: r.color }}>{formatBs(r.valor)}</Typography>
                                </Box>
                            </Paper>
                        ))}
                    </Box>
                </Box>
            )}
        </DashboardLayout>
    );
}