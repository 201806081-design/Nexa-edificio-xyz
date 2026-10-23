import { useState, useMemo } from 'react';
import {
    Box, Typography, Paper, Button, Select, MenuItem, Chip, Snackbar, Alert, Divider, Table, TableHead, TableBody, TableRow, TableCell,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import OpacityIcon from '@mui/icons-material/Opacity';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
    PERIODOS, ALICUOTAS, DEPARTAMENTOS_ACTIVOS, EXPENSAS_MOCK,
} from '../../constants/expensasMock';
import { formatBs } from '../../constants/finanzasMock';

export default function GenerarExpensas() {
    const navigate = useNavigate();

    // Periodos sin generar aun
    const periodosDisponibles = useMemo(() =>
        PERIODOS.filter((p) => !EXPENSAS_MOCK.some((e) => e.periodo === p)),
        []);

    const [periodo, setPeriodo] = useState(periodosDisponibles[0] || 'Noviembre 2026');
    const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });

    // Agrupa deptos por tipo para el preview
    const bloques = useMemo(() => {
        const grupos = { A: [], B: [], C: [] };
        DEPARTAMENTOS_ACTIVOS.forEach((d) => { if (grupos[d.tipo]) grupos[d.tipo].push(d); });
        return [
            { tipo: 'A', alicuota: ALICUOTAS.A, deptos: grupos.A },
            { tipo: 'B', alicuota: ALICUOTAS.B, deptos: grupos.B },
            { tipo: 'C', alicuota: ALICUOTAS.C, deptos: grupos.C },
        ];
    }, []);

    const totalGeneracion = bloques.reduce((s, b) => s + b.alicuota * b.deptos.length, 0);

    const yaGenerado = EXPENSAS_MOCK.some((e) => e.periodo === periodo);

    const confirmarGeneracion = () => {
        if (yaGenerado) {
            setSnack({ open: true, msg: `Las expensas de ${periodo} ya fueron generadas.`, sev: 'warning' });
            return;
        }
        const fecha = new Date().toLocaleDateString('es-BO');
        let serie = EXPENSAS_MOCK.length;
        bloques.forEach((b) => {
            b.deptos.forEach((d) => {
                serie += 1;
                EXPENSAS_MOCK.push({
                    id: `EX-${String(serie).padStart(4, '0')}`,
                    depto: d.id, tipo: d.tipo, responsable: d.responsable,
                    periodo,
                    base: b.alicuota,
                    agua: 0, m3: null, lecturaAnt: null, lecturaAct: null, aguaNota: '',
                    total: b.alicuota,
                    estado: 'Agua pendiente', pagado: 0,
                    fechaGen: fecha, fechaAgua: null,
                });
            });
        });
        navigate('/finanzas/expensas', {
            state: {
                snack: { open: true, msg: `Expensas de ${periodo} generadas (${DEPARTAMENTOS_ACTIVOS.length} deptos). Falta registrar el agua.`, sev: 'success' },
            },
        });
    };

    return (
        <DashboardLayout>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/finanzas/expensas')}
                sx={{ color: '#1a2733', mb: 1 }}>
                Volver a expensas
            </Button>

            <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Generar expensa</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Paso 1 de 2 — Este paso asigna el <strong>monto base por tipo</strong>.
                El agua se registra despues, uno por uno, desde la lista de expensas.
            </Typography>

            {/* Nota del flujo */}
            <Paper sx={{ p: 2, borderRadius: 2, mb: 2, bgcolor: '#F1F5FA', display: 'flex', gap: 2, alignItems: 'center' }}>
                <ReceiptLongIcon sx={{ color: '#1F5F8B' }} />
                <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>¿Como funciona?</Typography>
                    <Typography variant="caption" color="text.secondary">
                        1) Confirmas el periodo y se genera una expensa por cada depto con el <strong>monto base de su tipo</strong>.
                        Todas quedan en estado <strong>"Agua pendiente"</strong>. &nbsp;·&nbsp;
                        2) Despues, en la lista de expensas, usas el boton <strong>"Agua"</strong> de cada fila para cargar el consumo
                        del medidor. Hasta cargarla, el pago queda bloqueado.
                    </Typography>
                </Box>
            </Paper>

            {/* Selector de periodo */}
            <Paper sx={{ p: 3, borderRadius: 2, mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>Periodo a generar</Typography>
                {periodosDisponibles.length === 0 ? (
                    <Alert severity="info" sx={{ mb: 1 }}>
                        Todos los periodos del catalogo ya fueron generados. Agrega mas periodos en el mock de finanzas si necesitas probar otros.
                    </Alert>
                ) : (
                    <Select fullWidth value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
                        {periodosDisponibles.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                    </Select>
                )}
                {yaGenerado && (
                    <Typography variant="caption" sx={{ color: '#D9534F', display: 'block', mt: 1 }}>
                        ⚠ Este periodo ya fue generado anteriormente.
                    </Typography>
                )}
            </Paper>

            {/* Preview por bloque (A → B → C) */}
            <Paper sx={{ p: 3, borderRadius: 2, mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 2 }}>Vista previa de la generacion (por tipo)</Typography>
                {bloques.map((b) => (
                    <Box key={b.tipo} sx={{ mb: 2.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                            <Chip label={`Tipo ${b.tipo}`} size="small"
                                sx={{ bgcolor: '#E4EEF5', color: '#1F5F8B', fontWeight: 700 }} />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                Alicuota {formatBs(b.alicuota)} · {b.deptos.length} depto{b.deptos.length !== 1 ? 's' : ''}
                            </Typography>
                            <Box sx={{ flex: 1 }} />
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                Subtotal {formatBs(b.alicuota * b.deptos.length)}
                            </Typography>
                        </Box>
                        <Box sx={{ overflowX: 'auto' }}>
                            <Table size="small" sx={{ minWidth: 420 }}>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                                        <TableCell><strong>Depto.</strong></TableCell>
                                        <TableCell><strong>Responsable</strong></TableCell>
                                        <TableCell align="right"><strong>Monto base</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {b.deptos.map((d) => (
                                        <TableRow key={d.id}>
                                            <TableCell>{d.id}</TableCell>
                                            <TableCell>{d.responsable}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600 }}>{formatBs(b.alicuota)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>
                    </Box>
                ))}

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        Total a generar ({DEPARTAMENTOS_ACTIVOS.length} deptos)
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#1F5F8B' }}>{formatBs(totalGeneracion)}</Typography>
                </Box>

                <Box sx={{ bgcolor: '#FDF0D5', borderRadius: 2, p: 1.5, mt: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
                    <OpacityIcon sx={{ color: '#B6802A' }} />
                    <Typography variant="caption" color="text.secondary">
                        El <strong>agua no se incluye</strong> en este paso. Se registra despues desde la lista, uno por uno con el medidor.
                    </Typography>
                </Box>
            </Paper>

            {/* Confirmar */}
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={() => navigate('/finanzas/expensas')}
                    sx={{ color: '#1a2733', borderColor: '#cdd8e3' }}>
                    Cancelar
                </Button>
                <Button variant="contained" startIcon={<TaskAltIcon />} onClick={confirmarGeneracion}
                    disabled={yaGenerado || periodosDisponibles.length === 0}>
                    Confirmar generacion
                </Button>
            </Box>

            <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack({ ...snack, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity={snack.sev} onClose={() => setSnack({ ...snack, open: false })} sx={{ width: '100%' }}>
                    {snack.msg}
                </Alert>
            </Snackbar>
        </DashboardLayout>
    );
}