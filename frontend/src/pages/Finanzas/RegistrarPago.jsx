import { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Button, Select, MenuItem, TextField, Alert, Chip,
    Table, TableHead, TableBody, TableRow, TableCell,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { DEPARTAMENTOS_DEUDA, MEDIOS_PAGO } from '../../constants/pagosMock';
import { formatBs } from '../../constants/finanzasMock';

// Distribuye un monto entre las deudas, de la mas antigua a la mas nueva
function distribuir(deudas, monto) {
    let restante = Number(monto) || 0;
    return deudas.map((d) => {
        const aplicar = Math.min(d.pendiente, Math.max(0, restante));
        restante -= aplicar;
        return { periodo: d.periodo, aplicar };
    });
}

const PASOS = ['1. Selecciona el departamento', '2. Distribuye el monto', '3. Confirma el pago'];

export default function RegistrarPago() {
    const navigate = useNavigate();
    const [deptoId, setDeptoId] = useState('');
    const [fecha, setFecha] = useState('2026-10-19');
    const [monto, setMonto] = useState('');
    const [medio, setMedio] = useState('Transferencia');
    const [referencia, setReferencia] = useState('');
    const [aplicaciones, setAplicaciones] = useState([]); // [{periodo, aplicar}]

    const depto = DEPARTAMENTOS_DEUDA.find((d) => d.id === deptoId);
    const saldoPendiente = depto ? depto.saldoPendiente : 0;

    // Al cambiar depto o monto, redistribuye automaticamente (editable despues)
    useEffect(() => {
        if (depto) setAplicaciones(distribuir(depto.deudas, monto));
        else setAplicaciones([]);
    }, [deptoId, monto]); // eslint-disable-line react-hooks/exhaustive-deps

    const cambiarAplicar = (periodo, valor) =>
        setAplicaciones((arr) => arr.map((a) => (a.periodo === periodo ? { ...a, aplicar: valor } : a)));

    const montoNum = Number(monto) || 0;
    const totalAplicado = aplicaciones.reduce((acc, a) => acc + (Number(a.aplicar) || 0), 0);
    const nuevoSaldo = saldoPendiente - totalAplicado;
    const excedeSaldo = montoNum > saldoPendiente;
    const distribuidoOk = depto && montoNum > 0 && totalAplicado === montoNum && !excedeSaldo;

    const confirmar = () => {
        if (!distribuidoOk) return;
        // MOCK: aqui iria el POST. La confirmacion/registro se conecta en el commit 3.
        navigate('/finanzas/pagos', { state: { mensaje: 'Pago registrado correctamente' } });
    };

    return (
        <DashboardLayout>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                <Box>
                    <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Registrar pago</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Asocia el pago con un departamento y distribuyelo entre sus deudas pendientes
                    </Typography>
                </Box>
                <Chip label="HU-FI-02" sx={{ bgcolor: '#E4EEF5', color: 'primary.main', fontWeight: 600 }} />
            </Box>

            {/* Pasos */}
            <Alert severity="info" icon={false} sx={{ bgcolor: '#E4EEF5', color: 'text.primary', mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 0.5 }}>
                    {PASOS.map((p) => <Typography key={p} variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>{p}</Typography>)}
                </Box>
                <Typography variant="body2">El saldo y el historial se actualizaran cuando confirmes el registro.</Typography>
            </Alert>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                {/* Datos del pago */}
                <Paper sx={{ p: 3, borderRadius: 2, minWidth: 0 }}>
                    <Typography variant="h3" sx={{ fontSize: '1.1rem', fontWeight: 600, mb: 2 }}>Datos del pago</Typography>

                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Departamento</Typography>
                    <Select fullWidth displayEmpty value={deptoId} onChange={(e) => setDeptoId(e.target.value)} sx={{ mb: 2 }}>
                        <MenuItem value=""><em>Seleccione un departamento</em></MenuItem>
                        {DEPARTAMENTOS_DEUDA.map((d) => <MenuItem key={d.id} value={d.id}>{d.etiqueta}</MenuItem>)}
                    </Select>

                    {depto && (
                        <Box sx={{ border: '1px solid #CFDCEA', borderRadius: 2, p: 2, mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">Responsable</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{depto.responsable}</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#D9534F', mt: 0.5 }}>
                                Saldo pendiente actual: {formatBs(saldoPendiente)}
                            </Typography>
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                        <Box sx={{ flex: 1, minWidth: 150 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Fecha de pago</Typography>
                            <TextField fullWidth type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
                                slotProps={{ inputLabel: { shrink: true } }} />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 150 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Monto pagado</Typography>
                            <TextField fullWidth type="number" placeholder="Bs 0,00" value={monto}
                                onChange={(e) => setMonto(e.target.value)} />
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: 1, minWidth: 150 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Medio de pago</Typography>
                            <Select fullWidth value={medio} onChange={(e) => setMedio(e.target.value)}>
                                {MEDIOS_PAGO.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                            </Select>
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 150 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Referencia bancaria</Typography>
                            <TextField fullWidth placeholder="TRF-0000" value={referencia} onChange={(e) => setReferencia(e.target.value)} />
                        </Box>
                    </Box>

                    {excedeSaldo && (
                        <Alert severity="warning" icon={false} sx={{ bgcolor: '#FDF0D5', color: '#8A5A00', mt: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>El pago no puede superar el saldo pendiente.</Typography>
                            <Typography variant="body2">Los excedentes se registran como pago anticipado.</Typography>
                        </Alert>
                    )}
                </Paper>

                {/* Aplicacion del pago */}
                <Paper sx={{ p: 3, borderRadius: 2, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h3" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>Aplicacion del pago</Typography>
                        <Typography variant="body2" color="text.secondary">Prioridad: deuda mas antigua</Typography>
                    </Box>

                    {!depto ? (
                        <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                            Seleccione un departamento para distribuir el pago.
                        </Typography>
                    ) : (
                        <>
                            <Box sx={{ overflowX: 'auto' }}>
                                <Table size="small" sx={{ minWidth: 420 }}>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: '#F1F5FA' }}>
                                            <TableCell><strong>Periodo</strong></TableCell>
                                            <TableCell><strong>Total deuda</strong></TableCell>
                                            <TableCell><strong>Pagado</strong></TableCell>
                                            <TableCell><strong>Pendiente</strong></TableCell>
                                            <TableCell><strong>Aplicar</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {depto.deudas.map((d) => {
                                            const ap = aplicaciones.find((a) => a.periodo === d.periodo);
                                            return (
                                                <TableRow key={d.periodo}>
                                                    <TableCell sx={{ fontWeight: 600 }}>{d.periodo}</TableCell>
                                                    <TableCell>{formatBs(d.totalDeuda)}</TableCell>
                                                    <TableCell sx={{ color: '#2E9D78' }}>{formatBs(d.pagado)}</TableCell>
                                                    <TableCell sx={{ color: '#D9534F', fontWeight: 600 }}>{formatBs(d.pendiente)}</TableCell>
                                                    <TableCell>
                                                        <TextField size="small" type="number" value={ap ? ap.aplicar : 0}
                                                            onChange={(e) => cambiarAplicar(d.periodo, e.target.value)} sx={{ width: 110 }} />
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </Box>

                            {/* Resumen de actualizacion */}
                            <Box sx={{ bgcolor: '#E4EEF5', borderRadius: 2, p: 2, mt: 2 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>Resumen de actualizacion</Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                    <Typography variant="body2" color="text.secondary">Saldo antes del pago</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatBs(saldoPendiente)}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                    <Typography variant="body2" color="text.secondary">Monto aplicado</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#2E9D78' }}>− {formatBs(totalAplicado)}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderTop: '1px solid #CFDCEA', mt: 0.5, pt: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>Nuevo saldo pendiente</Typography>
                                    <Typography variant="h3" sx={{ fontWeight: 700, color: nuevoSaldo > 0 ? '#D9534F' : '#2E9D78' }}>{formatBs(nuevoSaldo)}</Typography>
                                </Box>
                            </Box>

                            {distribuidoOk && (
                                <Alert severity="success" icon={false} sx={{ bgcolor: '#E4F4EE', color: '#2E7D5B', mt: 2 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>✓ El monto esta completamente distribuido.</Typography>
                                    <Typography variant="body2">Se generara un registro en el historial de pagos.</Typography>
                                </Alert>
                            )}
                        </>
                    )}
                </Paper>
            </Box>

            {/* Botones */}
            <Box sx={{ display: 'flex', gap: 2, mt: 2, flexDirection: { xs: 'column-reverse', md: 'row' }, justifyContent: { md: 'flex-end' } }}>
                <Button variant="outlined" onClick={() => navigate('/finanzas/pagos')} sx={{ width: { xs: '100%', md: 'auto' } }}>
                    Cancelar
                </Button>
                <Button variant="contained" onClick={confirmar} disabled={!distribuidoOk} sx={{ width: { xs: '100%', md: 'auto' } }}>
                    Confirmar pago
                </Button>
            </Box>
        </DashboardLayout>
    );
}