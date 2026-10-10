import {
    Box, Typography, Paper, Button, Chip, IconButton,
    Table, TableHead, TableBody, TableRow, TableCell,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import VisibilityIcon from '@mui/icons-material/Visibility';
import NorthIcon from '@mui/icons-material/North';
import PercentIcon from '@mui/icons-material/Percent';
import SouthIcon from '@mui/icons-material/South';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { RESUMEN_MORA, SALDOS_VENCIDOS, PAGOS_ANTICIPADOS } from '../../constants/moraMock';
import { formatBs } from '../../constants/finanzasMock';

const RESUMEN = [
    { clave: 'deudasVencidas', label: 'Deudas vencidas', icon: <NorthIcon />, color: '#D9534F', bg: '#FBEAE9' },
    { clave: 'interesAcumulado', label: 'Interes acumulado', icon: <PercentIcon />, color: '#B6802A', bg: '#FDF0D5' },
    { clave: 'saldoAFavor', label: 'Saldo a favor', icon: <SouthIcon />, color: '#2E9D78', bg: '#E4F4EE' },
];

export default function Mora() {
    const navigate = useNavigate();

    return (
        <DashboardLayout>
            <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Mora y pagos anticipos</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Gestiona deudas vencidas y saldos a favor
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'stretch', md: 'flex-end' }, mb: 2 }}>
                <Button variant="outlined" startIcon={<SettingsIcon />}
                    onClick={() => navigate('/finanzas/mora/configuracion')}
                    sx={{ color: '#1a2733', borderColor: '#cdd8e3', width: { xs: '100%', md: 'auto' } }}>
                    Configuracion interes
                </Button>
                <Button variant="contained" startIcon={<AddIcon />}
                    onClick={() => navigate('/finanzas/mora/anticipo')}
                    sx={{ width: { xs: '100%', md: 'auto' } }}>
                    Registrar movimiento
                </Button>
            </Box>

            {/* Tarjetas de resumen */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
                {RESUMEN.map((r) => (
                    <Paper key={r.clave} sx={{ p: 2.5, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: r.bg, color: r.color, display: 'grid', placeItems: 'center' }}>
                            {r.icon}
                        </Box>
                        <Box>
                            <Typography variant="body2" color="text.secondary">{r.label}</Typography>
                            <Typography variant="h3" sx={{ fontWeight: 700, color: r.color }}>{formatBs(RESUMEN_MORA[r.clave])}</Typography>
                        </Box>
                    </Paper>
                ))}
            </Box>

            {/* Saldos vencidos */}
            <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Saldos vencidos</Typography>
                <Box sx={{ overflowX: 'auto' }}>
                    <Table size="small" sx={{ minWidth: 680 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Departamento</strong></TableCell>
                                <TableCell><strong>Periodo</strong></TableCell>
                                <TableCell><strong>Capital</strong></TableCell>
                                <TableCell><strong>Interes</strong></TableCell>
                                <TableCell><strong>Total pendiente</strong></TableCell>
                                <TableCell><strong>Estado</strong></TableCell>
                                <TableCell align="center"><strong>Acciones</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {SALDOS_VENCIDOS.map((s) => (
                                <TableRow key={s.id}>
                                    <TableCell sx={{ fontWeight: 600 }}>{s.departamento}</TableCell>
                                    <TableCell>{s.periodo}</TableCell>
                                    <TableCell>{formatBs(s.capital)}</TableCell>
                                    <TableCell>{formatBs(s.interes)}</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#D9534F' }}>{formatBs(s.totalPendiente)}</TableCell>
                                    <TableCell><Chip label={s.estado} size="small" sx={{ bgcolor: '#FBEAE9', color: '#D9534F' }} /></TableCell>
                                    <TableCell align="center"><IconButton color="primary"><VisibilityIcon /></IconButton></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Box>
            </Paper>

            {/* Pagos anticipados */}
            <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Pagos anticipados</Typography>
                <Box sx={{ overflowX: 'auto' }}>
                    <Table size="small" sx={{ minWidth: 680 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Fecha</strong></TableCell>
                                <TableCell><strong>Departamento</strong></TableCell>
                                <TableCell><strong>Capital</strong></TableCell>
                                <TableCell><strong>Periodos cubiertos</strong></TableCell>
                                <TableCell><strong>Saldo a favor</strong></TableCell>
                                <TableCell><strong>Estado</strong></TableCell>
                                <TableCell align="center"><strong>Acciones</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {PAGOS_ANTICIPADOS.map((p) => (
                                <TableRow key={p.id}>
                                    <TableCell>{p.fecha}</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>{p.departamento}</TableCell>
                                    <TableCell>{formatBs(p.capital)}</TableCell>
                                    <TableCell>{p.periodosCubiertos}</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#2E9D78' }}>{formatBs(p.saldoAFavor)}</TableCell>
                                    <TableCell><Chip label={p.estado} size="small" sx={{ bgcolor: '#E4F4EE', color: '#2E9D78' }} /></TableCell>
                                    <TableCell align="center">
                                        <IconButton color="primary" onClick={() => navigate(`/finanzas/mora/anticipo/${p.id}`)}>
                                            <VisibilityIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Box>
            </Paper>
        </DashboardLayout>
    );
}