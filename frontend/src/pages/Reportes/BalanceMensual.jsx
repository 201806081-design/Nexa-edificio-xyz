import { Fragment, useState, useMemo } from 'react';
import {
    Box, Typography, Paper, Alert, LinearProgress, Table, TableHead, TableBody, TableRow, TableCell,
} from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import BalanceIcon from '@mui/icons-material/Balance';
import SavingsIcon from '@mui/icons-material/Savings';
import DashboardLayout from '../../layouts/DashboardLayout';
import { datosBalanceMensual, reporteBalanceMensual } from '../../constants/reportesMock';
import { periodosConMovimientos } from '../../constants/periodos';
import { formatBs } from '../../constants/finanzasMock';
import {
    EncabezadoReporte, KpiReporte, GrillaKpis, BarraFiltros, SelectorPeriodo, TablaDeslizable,
} from './componentesReporte';

// 8.2 Balance mensual: el cierre de un mes. Lo emitido y cobrado en expensas y el
// dinero que entro y salio, frente al mes anterior. Abre en el ultimo mes con
// expensas generadas (el mes en curso todavia no tiene expensas).

// Conceptos donde subir es malo (se pintan en rojo cuando aumentan)
const SUBIR_ES_MALO = ['Pendiente de cobro', 'Gastos operativos', 'Personal'];

function Variacion({ fila }) {
    if (fila.variacion === null) return <Typography variant="body2" color="text.secondary">—</Typography>;
    if (Math.abs(fila.variacion) < 0.005) return <Typography variant="body2" color="text.secondary">Sin cambio</Typography>;
    const sube = fila.variacion > 0;
    const bueno = SUBIR_ES_MALO.includes(fila.concepto) ? !sube : sube;
    return (
        <Typography variant="body2" sx={{ fontWeight: 600, color: bueno ? '#2E9D78' : '#D9534F', whiteSpace: 'nowrap' }}>
            {sube ? '▲' : '▼'} {formatBs(Math.abs(fila.variacion))}
            {fila.porcentaje !== null && <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>({Math.abs(fila.porcentaje)} %)</Typography>}
        </Typography>
    );
}

export default function BalanceMensual() {
    const periodos = useMemo(() => periodosConMovimientos(), []);
    const [periodo, setPeriodo] = useState(() => (
        periodos.find((p) => datosBalanceMensual(p).actual.expensas.generadas) ?? periodos[0] ?? ''
    ));
    const d = useMemo(() => datosBalanceMensual(periodo), [periodo]);
    const { expensas, caja } = d.actual;
    const positivo = caja.resultado >= 0;
    const grupos = [...new Set(d.filas.map((f) => f.grupo))];

    return (
        <DashboardLayout>
            <EncabezadoReporte
                titulo="Balance mensual"
                descripcion="Cierre del mes: cuanto se emitio y cobro en expensas, y cuanto dinero entro y salio del edificio, comparado con el mes anterior"
                crearReporte={() => reporteBalanceMensual(d)}
            />

            <BarraFiltros>
                <SelectorPeriodo etiqueta="Mes" valor={periodo} opciones={periodos} onChange={setPeriodo} />
                <Typography variant="body2" color="text.secondary" sx={{ pb: 1.5 }}>
                    {d.anteriorNombre ? `Comparado con ${d.anteriorNombre}` : 'Primer mes del sistema: no hay mes anterior'}
                </Typography>
            </BarraFiltros>

            {!expensas.generadas && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    {periodo} todavia no se cerro: sus expensas se generan a inicios del mes siguiente.
                    Por ahora solo muestra el dinero que entro y salio en el mes.
                </Alert>
            )}

            <GrillaKpis>
                <KpiReporte etiqueta="Expensas emitidas" valor={formatBs(expensas.emitido)} nota={`${expensas.unidades} departamentos`}
                    icono={<ReceiptLongIcon />} />
                <KpiReporte etiqueta="Cobrado" valor={formatBs(expensas.cobrado)} nota={`${expensas.porcentajeCobrado} % de lo emitido`}
                    icono={<TaskAltIcon />} color="#2E9D78" fondo="#E4F4EE" />
                <KpiReporte etiqueta="Resultado del mes" valor={`${positivo ? '+ ' : '− '}${formatBs(Math.abs(caja.resultado))}`}
                    nota="Ingresos menos gastos" icono={<BalanceIcon />}
                    color={positivo ? '#2E9D78' : '#D9534F'} fondo={positivo ? '#E4F4EE' : '#FBEAE9'} />
                <KpiReporte etiqueta="Saldo al cierre" valor={formatBs(caja.saldoFinal)} nota="Caja + banco"
                    icono={<SavingsIcon />} color="#132B3E" fondo="#F1F5FA" />
            </GrillaKpis>

            {expensas.generadas && (
                <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                        <Typography sx={{ fontWeight: 700 }}>Cobranza de las expensas de {periodo}</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {formatBs(expensas.cobrado)} de {formatBs(expensas.emitido)}
                        </Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={Math.min(100, expensas.porcentajeCobrado)}
                        sx={{ height: 10, borderRadius: 5, bgcolor: '#FBEAE9', '& .MuiLinearProgress-bar': { bgcolor: '#2E9D78' } }} />
                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mt: 1.5 }}>
                        <Typography variant="body2" color="text.secondary">Expensa base <strong>{formatBs(expensas.base)}</strong></Typography>
                        <Typography variant="body2" color="text.secondary">Agua <strong>{formatBs(expensas.agua)}</strong></Typography>
                        <Typography variant="body2" color="text.secondary">Extras <strong>{formatBs(expensas.extras)}</strong></Typography>
                        <Typography variant="body2" color="text.secondary">Falta cobrar <strong style={{ color: '#D9534F' }}>{formatBs(expensas.pendiente)}</strong></Typography>
                    </Box>
                </Paper>
            )}

            <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
                <Typography sx={{ fontWeight: 700, mb: 1.5 }}>Comparacion con el mes anterior</Typography>
                <TablaDeslizable minWidth={640}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#F1F5FA' }}>
                                <TableCell><strong>Concepto</strong></TableCell>
                                <TableCell align="right"><strong>{d.anteriorNombre || 'Mes anterior'}</strong></TableCell>
                                <TableCell align="right"><strong>{periodo}</strong></TableCell>
                                <TableCell align="right"><strong>Variacion</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {grupos.map((g) => (
                                <Fragment key={g}>
                                    <TableRow>
                                        <TableCell colSpan={4} sx={{ fontWeight: 700, color: 'primary.main', bgcolor: '#FAFCFE' }}>{g}</TableCell>
                                    </TableRow>
                                    {d.filas.filter((f) => f.grupo === g).map((f) => {
                                        const destacada = f.concepto.startsWith('Saldo') || f.concepto.startsWith('Resultado');
                                        return (
                                            <TableRow key={f.concepto}>
                                                <TableCell sx={{ pl: 3, fontWeight: destacada ? 700 : 400 }}>{f.concepto}</TableCell>
                                                <TableCell align="right" sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}>
                                                    {f.anterior === null ? '—' : formatBs(f.anterior)}
                                                </TableCell>
                                                <TableCell align="right" sx={{ whiteSpace: 'nowrap', fontWeight: destacada ? 700 : 600 }}>{formatBs(f.actual)}</TableCell>
                                                <TableCell align="right"><Variacion fila={f} /></TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </Fragment>
                            ))}
                        </TableBody>
                    </Table>
                </TablaDeslizable>
            </Paper>
        </DashboardLayout>
    );
}
