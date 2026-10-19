import { useState } from 'react';
import {
    Box, Typography, Select, MenuItem, Paper, Button, Chip, TextField, InputAdornment,
    Table, TableHead, TableBody, TableRow, TableCell, Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { PERIODOS, DEPARTAMENTOS_ACTIVOS } from '../../constants/expensasMock';
import { EXPENSA_BASE, CONFIG_AGUA } from '../../constants/configuracionMock';
import { formatBs } from '../../constants/finanzasMock';

const PRECIO_M3 = Number(CONFIG_AGUA.precioM3);
const TARIFA_MIN = Number(CONFIG_AGUA.tarifaMinima);

// Cargo de agua automatico: consumo x precio, aplicando la tarifa minima
function aguaAutomatica(consumo) {
    const cargo = consumo * PRECIO_M3;
    return cargo < TARIFA_MIN ? TARIFA_MIN : cargo;
}

export default function GenerarExpensas() {
    const navigate = useNavigate();
    const [periodo, setPeriodo] = useState(PERIODOS[0]);
    // Lectura actual por departamento (arranca igual a la anterior)
    const [lecturas, setLecturas] = useState(
        Object.fromEntries(DEPARTAMENTOS_ACTIVOS.map((d) => [d.departamento, d.lecturaAnterior])),
    );
    // Agua editada manualmente por departamento (si no hay, se usa la automatica)
    const [aguaManual, setAguaManual] = useState({});

    const cambiarLectura = (dep, valor) => {
        setLecturas((l) => ({ ...l, [dep]: valor }));
        // al cambiar la lectura, el agua vuelve a calcularse automaticamente
        setAguaManual((a) => ({ ...a, [dep]: undefined }));
    };
    const cambiarAgua = (dep, valor) => setAguaManual((a) => ({ ...a, [dep]: valor }));

    // Filas calculadas. agua = valor editado si existe, si no el automatico.
    const filas = DEPARTAMENTOS_ACTIVOS.map((d) => {
        const actual = Number(lecturas[d.departamento]);
        const consumo = Math.max(0, actual - d.lecturaAnterior);
        const auto = aguaAutomatica(consumo);
        const override = aguaManual[d.departamento];
        const aguaVal = (override !== undefined && override !== '') ? Number(override) : auto;
        const aguaInput = override !== undefined ? override : auto; // lo que se muestra en el campo
        return { ...d, consumo, aguaVal, aguaInput, total: d.base + aguaVal };
    });
    const totalBase = filas.reduce((acc, f) => acc + f.base, 0);
    const totalAgua = filas.reduce((acc, f) => acc + f.aguaVal, 0);
    const totalGeneral = totalBase + totalAgua;

    const generar = () => {
        // MOCK: aqui se llamaria al backend. Por ahora vuelve a la lista con aviso.
        navigate('/finanzas/expensas', { state: { mensaje: 'Expensas generadas correctamente' } });
    };

    return (
        <DashboardLayout>
            <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Generar expensas mensuales</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Combina la expensa fija del tipo de departamento con el consumo de agua
            </Typography>

            {/* Periodo + calculo automatico */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2 }}>
                <Paper sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Periodo mensual</Typography>
                    <Select fullWidth value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
                        {PERIODOS.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                    </Select>
                </Paper>
                <Alert severity="info" icon={false} sx={{ bgcolor: '#E4EEF5', color: 'text.primary', alignItems: 'center' }}>
                    <strong>Calculo automatico</strong><br />
                    Expensa base + cargo de agua = total del periodo
                </Alert>
            </Box>

            {/* Tarifas fijas vigentes */}
            <Paper sx={{ p: 3, borderRadius: 2, mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>Tarifas fijas vigentes</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5, mb: 1.5 }}>
                    {Object.entries(EXPENSA_BASE).map(([tipo, monto]) => (
                        <Box key={tipo} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, border: '1px solid #CFDCEA', boxShadow: '0 1px 3px rgba(19, 43, 62, 0.08), 0 4px 12px rgba(19, 43, 62, 0.08)', borderRadius: 2, p: 1.5 }}>
                            <Chip label={tipo} sx={{ bgcolor: '#E4EEF5', color: 'primary.main', fontWeight: 700 }} />
                            <Box>
                                <Typography sx={{ fontWeight: 700 }}>{formatBs(monto)}</Typography>
                                <Typography variant="body2" color="text.secondary">Por departamento</Typography>
                            </Box>
                        </Box>
                    ))}
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #CFDCEA', boxShadow: '0 1px 4px rgba(19, 43, 62, 0.06)', borderRadius: 2, p: 1.5 }}>
                        <Typography variant="body2" color="text.secondary">Agua / m³</Typography>
                        <Typography sx={{ fontWeight: 700 }}>{formatBs(PRECIO_M3)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #CFDCEA', boxShadow: '0 1px 4px rgba(19, 43, 62, 0.06)', borderRadius: 2, p: 1.5 }}>
                        <Typography variant="body2" color="text.secondary">Tarifa minima agua</Typography>
                        <Typography sx={{ fontWeight: 700 }}>{formatBs(TARIFA_MIN)}</Typography>
                    </Box>
                </Box>
            </Paper>

            {/* Lecturas y vista previa */}
            <Paper sx={{ p: 3, borderRadius: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Lecturas y vista previa</Typography>
                    <Typography variant="body2" color="text.secondary">{filas.length} departamentos activos</Typography>
                </Box>
                <Box sx={{ overflowX: 'auto' }}>
                    <Table size="small" sx={{ minWidth: 760 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#F1F5FA' }}>
                                <TableCell><strong>Depto</strong></TableCell>
                                <TableCell><strong>Tipo</strong></TableCell>
                                <TableCell><strong>Base</strong></TableCell>
                                <TableCell><strong>Anterior</strong></TableCell>
                                <TableCell><strong>Actual</strong></TableCell>
                                <TableCell><strong>Consumo</strong></TableCell>
                                <TableCell><strong>Agua</strong></TableCell>
                                <TableCell><strong>Total</strong></TableCell>
                                <TableCell><strong>Estado</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filas.map((f) => (
                                <TableRow key={f.departamento}>
                                    <TableCell>{f.departamento}</TableCell>
                                    <TableCell>{f.tipo}</TableCell>
                                    <TableCell>{formatBs(f.base)}</TableCell>
                                    <TableCell>{f.lecturaAnterior.toLocaleString('es-BO')}</TableCell>
                                    <TableCell>
                                        <TextField size="small" type="number" value={lecturas[f.departamento]}
                                            onChange={(e) => cambiarLectura(f.departamento, e.target.value)}
                                            sx={{ width: 100 }} />
                                    </TableCell>
                                    <TableCell>{f.consumo} m³</TableCell>
                                    <TableCell>
                                        <TextField size="small" type="number" value={f.aguaInput}
                                            onChange={(e) => cambiarAgua(f.departamento, e.target.value)}
                                            sx={{ width: 110 }}
                                            slotProps={{ input: { startAdornment: <InputAdornment position="start">Bs</InputAdornment> } }} />
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>{formatBs(f.total)}</TableCell>
                                    <TableCell><Chip label={f.estado} size="small" sx={{ bgcolor: '#FDF0D5', color: '#B6802A' }} /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Box>
            </Paper>

            {/* Resumen del periodo */}
            <Paper sx={{ p: 3, borderRadius: 2, mb: 2, bgcolor: '#E4EEF5' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Resumen del periodo</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Expensas base: <strong>{formatBs(totalBase)}</strong></Typography>
                    <Typography variant="body2">Agua: <strong>{formatBs(totalAgua)}</strong></Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary">Total a generar:</Typography>
                        <Typography variant="h3" color="primary.main" sx={{ fontWeight: 700 }}>{formatBs(totalGeneral)}</Typography>
                    </Box>
                </Box>
            </Paper>

            {/* Botones */}
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column-reverse', md: 'row' }, justifyContent: { md: 'flex-end' } }}>
                <Button variant="outlined" onClick={() => navigate('/finanzas/expensas')} sx={{ width: { xs: '100%', md: 'auto' } }}>
                    Cancelar
                </Button>
                <Button variant="contained" onClick={generar} sx={{ width: { xs: '100%', md: 'auto' } }}>
                    Generar expensas
                </Button>
            </Box>
        </DashboardLayout>
    );
}