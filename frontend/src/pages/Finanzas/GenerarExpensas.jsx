import { useState, useEffect, useMemo } from 'react';
import {
    Box, Typography, Select, MenuItem, Paper, Button, Chip, TextField, InputAdornment,
    Table, TableHead, TableBody, TableRow, TableCell, Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { PERIODOS, DEPARTAMENTOS_ACTIVOS, EXPENSAS_MOCK } from '../../constants/expensasMock';
import { EXPENSA_BASE, CONFIG_AGUA } from '../../constants/configuracionMock';
import { formatBs } from '../../constants/finanzasMock';

// 'Octubre 2026' -> {mes: 10, anio: 2026}
const MES_IDX = {
    enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
    julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
};
const parsePeriodo = (p) => {
    const [mes, anio] = (p || '').toLowerCase().split(' ');
    return { mes: MES_IDX[mes] || 0, anio: Number(anio) || 0 };
};

// Busca la lecturaActual mas reciente del depto en expensas PREVIAS al periodo seleccionado.
// Asi la "anterior" de cada mes queda encadenada con la "actual" del mes previo.
function buscarLecturaPrevia(depto, periodoSel) {
    const pSel = parsePeriodo(periodoSel);
    const previas = EXPENSAS_MOCK
        .filter((e) => e.departamento === `Depto. ${depto}` && e.lecturaActual !== undefined)
        .filter((e) => {
            const pE = parsePeriodo(e.periodo);
            return (pE.anio < pSel.anio) || (pE.anio === pSel.anio && pE.mes < pSel.mes);
        })
        .sort((a, b) => {
            const pA = parsePeriodo(a.periodo);
            const pB = parsePeriodo(b.periodo);
            return (pB.anio - pA.anio) || (pB.mes - pA.mes);
        });
    return previas[0]?.lecturaActual;
}

// Cargo de agua automatico: consumo x precio, aplicando la tarifa minima
function aguaAutomatica(consumo) {
    const precio = Number(CONFIG_AGUA.precioM3) || 0;
    const minimo = Number(CONFIG_AGUA.tarifaMinima) || 0;
    const cargo = consumo * precio;
    return cargo < minimo ? minimo : cargo;
}

export default function GenerarExpensas() {
    const navigate = useNavigate();

    // Solo los periodos que todavia NO tienen expensas generadas
    const periodosDisponibles = useMemo(() => {
        const generados = new Set(EXPENSAS_MOCK.map((e) => e.periodo));
        return PERIODOS.filter((p) => !generados.has(p));
    }, []);

    const [periodo, setPeriodo] = useState(periodosDisponibles[0] || '');
    const [lecturas, setLecturas] = useState({});
    const [aguaManual, setAguaManual] = useState({});
    const [error, setError] = useState('');

    // Al cambiar de periodo, inicializa las lecturas actuales con la lectura previa encadenada
    useEffect(() => {
        if (!periodo) return;
        const iniciales = Object.fromEntries(DEPARTAMENTOS_ACTIVOS.map((d) => {
            const prev = buscarLecturaPrevia(d.departamento, periodo) ?? d.lecturaAnterior;
            return [d.departamento, prev];
        }));
        setLecturas(iniciales);
        setAguaManual({});
        setError('');
    }, [periodo]);

    // Si no hay periodos disponibles, mostramos un mensaje
    if (periodosDisponibles.length === 0) {
        return (
            <DashboardLayout>
                <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Generar expensas mensuales</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Combina la expensa fija del tipo de departamento con el consumo de agua
                </Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>No hay periodos disponibles</Typography>
                    <Typography variant="body2">
                        Ya se generaron expensas para todos los periodos del sistema. Agrega periodos
                        futuros en la configuracion para seguir generando.
                    </Typography>
                </Alert>
                <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
                    <Button variant="contained" onClick={() => navigate('/finanzas/expensas')} sx={{ width: { xs: '100%', md: 'auto' } }}>
                        Volver a expensas
                    </Button>
                </Box>
            </DashboardLayout>
        );
    }

    const cambiarLectura = (dep, valor) => {
        setLecturas((l) => ({ ...l, [dep]: valor }));
        setAguaManual((a) => ({ ...a, [dep]: undefined }));
        setError('');
    };
    const cambiarAgua = (dep, valor) => { setAguaManual((a) => ({ ...a, [dep]: valor })); setError(''); };

    // Filas calculadas con lectura previa encadenada
    const filas = DEPARTAMENTOS_ACTIVOS.map((d) => {
        const base = EXPENSA_BASE[d.tipo] ?? d.base;
        const lecturaAnterior = buscarLecturaPrevia(d.departamento, periodo) ?? d.lecturaAnterior;
        const actualNum = Number(lecturas[d.departamento] ?? lecturaAnterior);
        const consumo = Math.max(0, actualNum - lecturaAnterior);
        const auto = aguaAutomatica(consumo);
        const override = aguaManual[d.departamento];
        const aguaVal = (override !== undefined && override !== '') ? Number(override) : auto;
        const aguaInput = override !== undefined ? override : auto;
        return { ...d, base, lecturaAnterior, actualNum, consumo, aguaVal, aguaInput, total: base + aguaVal };
    });
    const totalBase = filas.reduce((acc, f) => acc + f.base, 0);
    const totalAgua = filas.reduce((acc, f) => acc + f.aguaVal, 0);
    const totalGeneral = totalBase + totalAgua;

    // Confirma la generacion: crea las expensas en EXPENSAS_MOCK (persiste en la sesion)
    const generar = () => {
        const siguienteId = Math.max(0, ...EXPENSAS_MOCK.map((e) => e.id || 0)) + 1;
        filas.forEach((f, i) => {
            EXPENSAS_MOCK.push({
                id: siguienteId + i,
                departamento: `Depto. ${f.departamento}`,
                tipo: f.tipo,
                periodo,
                base: f.base,
                agua: f.aguaVal,
                monto: f.total,
                estado: 'Pendiente',
                lecturaAnterior: f.lecturaAnterior,
                lecturaActual: f.actualNum, // se encadena para la siguiente generacion
            });
        });
        navigate('/finanzas/expensas', {
            state: { mensaje: `${filas.length} expensas generadas para ${periodo} por ${formatBs(totalGeneral)}` },
        });
    };

    const PRECIO_M3 = Number(CONFIG_AGUA.precioM3);
    const TARIFA_MIN = Number(CONFIG_AGUA.tarifaMinima);

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
                        {periodosDisponibles.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                    </Select>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        Solo se listan los periodos que todavia no tienen expensas generadas.
                    </Typography>
                </Paper>
                <Alert severity="info" icon={false} sx={{ bgcolor: '#E4EEF5', color: 'text.primary', alignItems: 'center' }}>
                    <strong>Calculo automatico</strong><br />
                    Expensa base + cargo de agua = total del periodo. La lectura anterior viene del periodo previo.
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
                                    <TableCell>{Number(f.lecturaAnterior).toLocaleString('es-BO')}</TableCell>
                                    <TableCell>
                                        <TextField size="small" type="number" value={lecturas[f.departamento] ?? ''}
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

            {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

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