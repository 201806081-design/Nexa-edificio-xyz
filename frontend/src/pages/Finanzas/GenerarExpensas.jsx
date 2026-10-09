import { useState } from 'react';
import {
    Box, Typography, Select, MenuItem, Paper, Button, Chip, Stepper, Step, StepLabel,
    Table, TableHead, TableBody, TableRow, TableCell, Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { PERIODOS, TARIFAS, DEPARTAMENTOS_ACTIVOS } from '../../constants/expensasMock';
import { formatBs } from '../../constants/finanzasMock';

const PASOS = ['Periodo', 'Vista previa', 'Confirmar'];

export default function GenerarExpensas() {
    const navigate = useNavigate();
    const [periodo, setPeriodo] = useState(PERIODOS[0]);

    const deptos = DEPARTAMENTOS_ACTIVOS;
    const totalGeneral = deptos.reduce((acc, d) => acc + d.expensa, 0);

    const generar = () => {
        // MOCK: aqui se llamaria al backend. Por ahora vuelve a la lista con aviso.
        navigate('/finanzas/expensas', { state: { mensaje: 'Expensas generadas correctamente' } });
    };

    return (
        <DashboardLayout>
            <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Generar expensas mensuales</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Asigna automaticamente la tarifa fija segun el tipo de departamento
            </Typography>

            {/* Pasos */}
            <Stepper activeStep={1} alternativeLabel sx={{ mb: 3 }}>
                {PASOS.map((p) => <Step key={p}><StepLabel>{p}</StepLabel></Step>)}
            </Stepper>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 2 }}>
                {/* Columna principal */}
                <Box>
                    <Paper sx={{ p: 3, borderRadius: 2, mb: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Periodo mensual</Typography>
                        <Select fullWidth value={periodo} onChange={(e) => setPeriodo(e.target.value)} sx={{ mb: 2 }}>
                            {PERIODOS.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                        </Select>
                        <Alert severity="info" icon={false} sx={{ bgcolor: '#E4EEF5', color: 'text.primary' }}>
                            <strong>Monto automatico.</strong> No se escribe un monto por departamento.
                            El sistema usa la tarifa fija de su tipo: A, B o C.
                        </Alert>
                    </Paper>

                    <Paper sx={{ p: 3, borderRadius: 2, mb: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>Tarifas fijas vigentes</Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5 }}>
                            {Object.entries(TARIFAS).map(([tipo, monto]) => (
                                <Box key={tipo} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
                                    <Chip label={tipo} sx={{ bgcolor: '#E4EEF5', color: 'primary.main', fontWeight: 700 }} />
                                    <Box>
                                        <Typography sx={{ fontWeight: 700 }}>{formatBs(monto)}</Typography>
                                        <Typography variant="body2" color="text.secondary">Por departamento</Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </Paper>

                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>Vista previa de asignacion</Typography>
                            <Typography variant="body2" color="text.secondary">{deptos.length} departamentos activos</Typography>
                        </Box>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell><strong>Departamento</strong></TableCell>
                                    <TableCell><strong>Tipo</strong></TableCell>
                                    <TableCell><strong>Estado</strong></TableCell>
                                    <TableCell><strong>Expensas</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {deptos.map((d) => (
                                    <TableRow key={d.departamento}>
                                        <TableCell>{d.departamento}</TableCell>
                                        <TableCell>{d.tipo}</TableCell>
                                        <TableCell><Chip label={d.estado} size="small" sx={{ bgcolor: '#FDF0D5', color: '#B6802A' }} /></TableCell>
                                        <TableCell>{formatBs(d.expensa)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Paper>
                </Box>

                {/* Columna resumen */}
                <Box>
                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>Resumen</Typography>
                        <Typography variant="body2" color="text.secondary">Departamentos</Typography>
                        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1.5 }}>{deptos.length}</Typography>
                        <Typography variant="body2" color="text.secondary">Total de general</Typography>
                        <Typography variant="h3" color="primary.main" sx={{ fontWeight: 700, mb: 1.5 }}>{formatBs(totalGeneral)}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            No incluye agua, luz ni gas individuales. Esos cobros corresponden a cada empresa.
                        </Typography>
                        <Button fullWidth variant="contained" onClick={generar} sx={{ mb: 1 }}>Generar expensas</Button>
                        <Button fullWidth variant="outlined" onClick={() => navigate('/finanzas/expensas')} sx={{ mb: 1 }}>Cancelar</Button>
                        <Button fullWidth variant="text" onClick={() => navigate('/finanzas/expensas')}>Volver a expensas</Button>
                    </Paper>
                </Box>
            </Box>
        </DashboardLayout>
    );
}