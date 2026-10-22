import { useState } from 'react';
import {
    Box, Typography, Paper, Button, Select, MenuItem, TextField, Alert, Chip,
    Table, TableHead, TableBody, TableRow, TableCell,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { DEPARTAMENTOS_DEUDA, MEDIOS_PAGO, PAGOS_MOCK } from '../../constants/pagosMock';
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

// Genera el siguiente codigo de pago (PG-00XX)
function siguienteCodigo() {
    const nums = PAGOS_MOCK.map((p) => Number(String(p.id).replace(/\D/g, '')) || 0);
    const next = (nums.length ? Math.max(...nums) : 42) + 1;
    return `PG-${String(next).padStart(4, '0')}`;
}

// '2026-10-19' -> '19/10/2026'
const fechaBonita = (iso) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
};

const PASOS = ['1. Selecciona el departamento', '2. Distribuye el monto', '3. Confirma el pago'];

// Config dinamica del campo "Referencia" segun el medio de pago
const REF_CONFIG = {
    'Transferencia': {
        label: 'N.º de transferencia',
        placeholder: '1234567890',
        ayuda: 'Es el N.º de operacion que da el banco emisor en el comprobante de quien paga. (Ejemplo: "Operacion 20261019-0045721"). No es el numero de cuenta del edificio.',
    },
    'QR': {
        label: 'N.º de operacion QR',
        placeholder: '1234567890',
        ayuda: 'Es el N.º de operacion que da la app bancaria al escanear el QR del edificio. Aparece en el comprobante del residente.',
    },
    'Cheque': {
        label: 'N.º de cheque',
        placeholder: '000123',
        ayuda: 'Cheque entregado al administrador. Registre el N.º impreso en el cheque.',
    },
    'Efectivo': {
        label: 'N.º de recibo (opcional)',
        placeholder: 'REC-00000',
        ayuda: 'Pago en efectivo recibido por el administrador. El N.º de recibo interno es opcional.',
        opcional: true,
    },
};

export default function RegistrarPago() {
    const navigate = useNavigate();
    const [deptoId, setDeptoId] = useState('');
    const [fecha, setFecha] = useState('2026-10-19');
    const [monto, setMonto] = useState('');
    const [medio, setMedio] = useState('Transferencia');
    const [referencia, setReferencia] = useState('');
    const [pagadoPor, setPagadoPor] = useState('');
    const [aplicaciones, setAplicaciones] = useState([]); // [{periodo, aplicar}]

    const depto = DEPARTAMENTOS_DEUDA.find((d) => d.id === deptoId);
    const saldoPendiente = depto ? depto.saldoPendiente : 0;
    const refCfg = REF_CONFIG[medio] || REF_CONFIG['Transferencia'];

    // Suma de las aplicaciones (helper)
    const sumarAplicaciones = (arr) => arr.reduce((s, a) => s + (Number(a.aplicar) || 0), 0);

    // Cambiar depto: reinicia aplicaciones a 0, precarga "Pagado por" con el responsable
    const cambiarDepto = (id) => {
        setDeptoId(id);
        const d = DEPARTAMENTOS_DEUDA.find((x) => x.id === id);
        if (d) {
            setAplicaciones(d.deudas.map((x) => ({ periodo: x.periodo, aplicar: 0 })));
            setPagadoPor(d.responsable.split(' · ')[0]);
        } else {
            setAplicaciones([]);
            setPagadoPor('');
        }
        setMonto('');
    };

    // Monto -> auto-distribuye en aplicaciones (deuda mas antigua primero)
    const cambiarMonto = (valor) => {
        setMonto(valor);
        if (depto) setAplicaciones(distribuir(depto.deudas, valor));
    };

    // Editar manualmente una casilla "Aplicar" -> sincroniza "Monto pagado" al total
    const cambiarAplicar = (periodo, valor) => {
        const nuevas = aplicaciones.map((a) => (a.periodo === periodo ? { ...a, aplicar: valor } : a));
        setAplicaciones(nuevas);
        setMonto(String(sumarAplicaciones(nuevas)));
    };

    // Clic en el chip "pendiente" -> auto-rellena "Aplicar" + sincroniza "Monto pagado"
    const aplicarPendiente = (periodo, pendiente) => {
        const nuevas = aplicaciones.map((a) => (a.periodo === periodo ? { ...a, aplicar: pendiente } : a));
        setAplicaciones(nuevas);
        setMonto(String(sumarAplicaciones(nuevas)));
    };

    // Pagar todos los pendientes de un solo clic
    const pagarSaldoCompleto = () => {
        if (!depto) return;
        const nuevas = depto.deudas.map((d) => ({ periodo: d.periodo, aplicar: d.pendiente }));
        setAplicaciones(nuevas);
        setMonto(String(sumarAplicaciones(nuevas)));
    };

    const montoNum = Number(monto) || 0;
    const totalAplicado = aplicaciones.reduce((acc, a) => acc + (Number(a.aplicar) || 0), 0);
    const nuevoSaldo = saldoPendiente - totalAplicado;
    const excedeSaldo = montoNum > saldoPendiente;
    const distribuidoOk = depto && montoNum > 0 && totalAplicado === montoNum && !excedeSaldo;

    const confirmar = () => {
        if (!distribuidoOk) return;
        const codigo = siguienteCodigo();
        const estado = nuevoSaldo > 0 ? 'Parcial' : 'Completo';

        const distribucion = depto.deudas.map((d) => {
            const ap = Number((aplicaciones.find((a) => a.periodo === d.periodo) || {}).aplicar) || 0;
            return { periodo: d.periodo, aplicado: ap, saldoRestante: d.pendiente - ap };
        }).filter((x) => x.aplicado > 0 || x.saldoRestante > 0);

        const periodos = distribucion.filter((x) => x.aplicado > 0).map((x) => x.periodo).join(' / ');

        PAGOS_MOCK.unshift({
            id: codigo,
            fecha: fechaBonita(fecha),
            depto: depto.id,
            responsable: depto.responsable.split(' · ')[0],
            pagadoPor: pagadoPor || depto.responsable.split(' · ')[0],
            medio,
            referencia,
            periodoAplicado: periodos,
            monto: montoNum,
            saldoPosterior: nuevoSaldo,
            estado,
        });
        depto.deudas.forEach((d) => {
            const ap = Number((aplicaciones.find((a) => a.periodo === d.periodo) || {}).aplicar) || 0;
            d.pagado += ap;
            d.pendiente -= ap;
        });
        depto.saldoPendiente = nuevoSaldo;

        navigate('/finanzas/pagos/registrado', {
            state: {
                detalle: {
                    codigo, departamento: depto.id, fecha: fechaBonita(fecha),
                    monto: montoNum, estado, nuevoSaldo, distribucion, pagadoPor, medio, referencia,
                },
            },
        });
    };

    return (
        <DashboardLayout>
            <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Registrar pago</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Asocia el pago con un departamento y distribuyelo entre sus deudas pendientes
            </Typography>

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
                    <Select fullWidth displayEmpty value={deptoId} onChange={(e) => cambiarDepto(e.target.value)} sx={{ mb: 2 }}>
                        <MenuItem value=""><em>Seleccione un departamento</em></MenuItem>
                        {DEPARTAMENTOS_DEUDA.map((d) => <MenuItem key={d.id} value={d.id}>{d.etiqueta}</MenuItem>)}
                    </Select>

                    {depto && (
                        <Box sx={{ border: '1px solid #CFDCEA', borderRadius: 2, p: 2, mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">Responsable del departamento</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{depto.responsable}</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#D9534F', mt: 0.5 }}>
                                Saldo pendiente actual: {formatBs(saldoPendiente)}
                            </Typography>
                        </Box>
                    )}

                    {/* Pagado por (editable, precarga con el responsable) */}
                    {depto && (
                        <>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Pagado por</Typography>
                            <TextField fullWidth value={pagadoPor} onChange={(e) => setPagadoPor(e.target.value)}
                                placeholder="Nombre de quien realiza el pago" sx={{ mb: 2 }} />
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: -1.5, mb: 2 }}>
                                Por defecto el responsable; puede cambiarse si pagó un familiar o inquilino.
                            </Typography>
                        </>
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
                                onChange={(e) => cambiarMonto(e.target.value)} />
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: 1, minWidth: 150 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Medio de pago</Typography>
                            <Select fullWidth value={medio} onChange={(e) => { setMedio(e.target.value); setReferencia(''); }}>
                                {MEDIOS_PAGO.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                            </Select>
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 150 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>{refCfg.label}</Typography>
                            <TextField fullWidth placeholder={refCfg.placeholder} value={referencia} onChange={(e) => setReferencia(e.target.value)} />
                        </Box>
                    </Box>

                    {/* Ayuda contextual segun el medio */}
                    <Box sx={{ bgcolor: '#E4EEF5', borderRadius: 2, p: 1.5, mt: 1.5 }}>
                        <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }} display="block">
                            {medio}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">{refCfg.ayuda}</Typography>
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
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                        <Typography variant="h3" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>Aplicacion del pago</Typography>
                        {depto && (
                            <Button size="small" variant="outlined" onClick={pagarSaldoCompleto}
                                sx={{ color: '#1a2733', borderColor: '#cdd8e3', textTransform: 'none' }}>
                                Pagar saldo completo ({formatBs(saldoPendiente)})
                            </Button>
                        )}
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {depto ? 'Haz clic en el monto pendiente para auto-rellenar. O edita manualmente la columna Aplicar.' : 'Prioridad: deuda mas antigua'}
                    </Typography>

                    {!depto ? (
                        <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                            Seleccione un departamento para distribuir el pago.
                        </Typography>
                    ) : (
                        <>
                            <Box sx={{ overflowX: 'auto' }}>
                                <Table size="small" sx={{ minWidth: 460 }}>
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
                                                    <TableCell>
                                                        <Chip
                                                            label={formatBs(d.pendiente)}
                                                            size="small"
                                                            onClick={() => aplicarPendiente(d.periodo, d.pendiente)}
                                                            sx={{
                                                                bgcolor: '#FBEAE9', color: '#D9534F', fontWeight: 700,
                                                                cursor: 'pointer', '&:hover': { bgcolor: '#F5CECB' },
                                                            }}
                                                        />
                                                    </TableCell>
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