import {
    Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell,
} from '@mui/material';
import { formatBs } from '../../../constants/finanzasMock';

// Resumen del periodo + libro con saldo acumulado (se usa para Caja y para Banco).
//
// props:
//   libro      -> { saldoInicial, ingresos, egresos, saldoFinal, filas } (libroDelPeriodo)
//   titulo     -> texto sobre la tabla
//   periodo    -> 'Noviembre 2026'
//   columnaExtra (opcional) -> { titulo, render: (fila) => node }
//   vacio      -> texto cuando no hay movimientos
//   esApertura -> el periodo arranca con el saldo de apertura del sistema

const DATOS_RESUMEN = [
    { clave: 'saldoInicial', label: 'Saldo al inicio', labelApertura: 'Saldo de apertura', color: '#1F5F8B', bg: '#E4EEF5' },
    { clave: 'ingresos', label: 'Ingresos', color: '#2E9D78', bg: '#E4F4EE', signo: '+' },
    { clave: 'egresos', label: 'Egresos', color: '#D9534F', bg: '#FBEAE9', signo: '−' },
    { clave: 'saldoFinal', label: 'Saldo al cierre', color: '#132B3E', bg: '#F1F5FA' },
];

export function ResumenPeriodo({ libro, esApertura = false }) {
    return (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 1.5, mb: 2 }}>
            {DATOS_RESUMEN.map((d) => (
                <Box key={d.clave} sx={{ bgcolor: d.bg, borderRadius: 2, px: 2, py: 1.5, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary">{esApertura && d.labelApertura ? d.labelApertura : d.label}</Typography>
                    <Typography sx={{ fontWeight: 700, color: d.color, fontSize: '1.05rem' }} noWrap>
                        {d.signo && libro[d.clave] > 0 ? `${d.signo} ` : ''}{formatBs(libro[d.clave])}
                    </Typography>
                </Box>
            ))}
        </Box>
    );
}

export default function LibroCuenta({ libro, titulo, periodo, columnaExtra, vacio, esApertura = false }) {
    const columnas = 5 + (columnaExtra ? 1 : 0);
    return (
        <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{titulo} · {periodo}</Typography>
                <Typography variant="body2" color="text.secondary">
                    {libro.filas.length} movimiento{libro.filas.length !== 1 ? 's' : ''}
                </Typography>
            </Box>
            <ResumenPeriodo libro={libro} esApertura={esApertura} />
            <Box sx={{ overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 760 }}>
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#F1F5FA' }}>
                            <TableCell><strong>Fecha / referencia</strong></TableCell>
                            <TableCell><strong>Concepto</strong></TableCell>
                            <TableCell align="right"><strong>Ingreso</strong></TableCell>
                            <TableCell align="right"><strong>Egreso</strong></TableCell>
                            <TableCell align="right"><strong>Saldo</strong></TableCell>
                            {columnaExtra && <TableCell><strong>{columnaExtra.titulo}</strong></TableCell>}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {libro.filas.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columnas} align="center" sx={{ color: 'text.secondary', py: 3 }}>{vacio}</TableCell>
                            </TableRow>
                        ) : libro.filas.map((m) => (
                            <TableRow key={m.id} hover>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{m.fecha}</Typography>
                                    <Typography variant="caption" color="text.secondary">{m.referencia || m.sistemaRef || '—'}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{m.concepto}</Typography>
                                    <Typography variant="caption" color="text.secondary">{m.descripcion}</Typography>
                                </TableCell>
                                <TableCell align="right" sx={{ color: '#2E9D78', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                    {m.tipo === 'Ingreso' ? formatBs(m.monto) : ''}
                                </TableCell>
                                <TableCell align="right" sx={{ color: '#D9534F', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                    {m.tipo === 'Egreso' ? formatBs(m.monto) : ''}
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{formatBs(m.saldo)}</TableCell>
                                {columnaExtra && <TableCell>{columnaExtra.render(m)}</TableCell>}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Box>
        </Paper>
    );
}
