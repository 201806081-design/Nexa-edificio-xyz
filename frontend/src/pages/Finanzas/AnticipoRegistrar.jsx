import { useState, useMemo } from 'react';
import {
    Box, Typography, Paper, Button, Select, MenuItem, TextField, Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { MEDIOS_PAGO, HISTORIAL_ANTICIPOS } from '../../constants/pagosMock';
import { DEPARTAMENTOS_ACTIVOS, EXPENSAS_MOCK } from '../../constants/expensasMock';
import { formatBs } from '../../constants/finanzasMock';

const fechaBonita = (iso) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
};

function siguienteCodigo() {
    const nums = HISTORIAL_ANTICIPOS.map((a) => Number(String(a.id).replace(/\D/g, '')) || 0);
    const next = (nums.length ? Math.max(...nums) : 12) + 1;
    return `PA-${String(next).padStart(4, '0')}`;
}

// Config dinamica del campo "Referencia" segun el medio de pago (mismo criterio que RegistrarPago)
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

export default function RegistrarAnticipo() {
    const navigate = useNavigate();
    const [deptoId, setDeptoId] = useState('');
    const [fecha, setFecha] = useState('2026-10-19');
    const [monto, setMonto] = useState('');
    const [medio, setMedio] = useState('Transferencia');
    const [referencia, setReferencia] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [pagadoPor, setPagadoPor] = useState('');
    const [error, setError] = useState('');

    // Lista completa de deptos del edificio con credito acumulado y saldo pendiente
    // derivado automaticamente de HISTORIAL_ANTICIPOS y EXPENSAS_MOCK (ya no hardcoded)
    const deptosDisponibles = useMemo(() => {
        return DEPARTAMENTOS_ACTIVOS.map((d) => {
            const creditoAnterior = HISTORIAL_ANTICIPOS
                .filter((a) => a.depto === d.id)
                .reduce((s, a) => s + (a.credito || 0), 0);
            const saldoPendiente = EXPENSAS_MOCK
                .filter((e) => e.depto === d.id && e.estado !== 'Pagada')
                .reduce((s, e) => s + Math.max(0, (e.total || e.monto || 0) - (e.pagado || 0)), 0);
            return {
                id: d.id,
                etiqueta: `${d.id} — ${d.responsable}`,
                responsable: d.responsable,
                tipo: d.tipo,
                creditoAnterior,
                saldoPendiente,
            };
        });
    }, []);

    const depto = deptosDisponibles.find((d) => d.id === deptoId);
    const creditoAnterior = depto ? depto.creditoAnterior : 0;
    const montoNum = Number(monto) || 0;
    const nuevoCredito = creditoAnterior + montoNum;
    const refCfg = REF_CONFIG[medio] || REF_CONFIG['Transferencia'];
    const responsable = depto ? depto.responsable : '';

    // Cambiar depto: precarga "Pagado por" con el responsable (editable despues)
    const cambiarDepto = (id) => {
        setDeptoId(id);
        setError('');
        const d = deptosDisponibles.find((x) => x.id === id);
        setPagadoPor(d ? d.responsable : '');
    };

    const registrar = () => {
        if (!deptoId) { setError('Seleccione un departamento'); return; }
        if (!(montoNum > 0)) { setError('Ingrese un monto valido'); return; }
        const codigo = siguienteCodigo();
        // MOCK: se registra el anticipo. El credito del depto se deriva automaticamente
        // de HISTORIAL_ANTICIPOS, asi que ya no hace falta mutar un creditoAnterior aparte.
        HISTORIAL_ANTICIPOS.unshift({
            id: codigo, fecha: fechaBonita(fecha), depto: depto.id, tipoDepto: depto.tipo,
            responsable, pagadoPor: pagadoPor || responsable,
            medio, referencia,
            recibido: montoNum, aplicado: 0, credito: montoNum, estado: 'Disponible',
            aplicaciones: [],
        });
        navigate('/finanzas/pagos/anticipo/registrado', {
            state: { detalle: { codigo, departamento: depto.id, fecha: fechaBonita(fecha), monto: montoNum, nuevoCredito, medio, referencia, pagadoPor: pagadoPor || responsable } },
        });
    };

    return (
        <DashboardLayout>
            <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Registrar pago anticipado</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Crea un saldo a favor para un departamento
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                {/* Datos del anticipo */}
                <Paper sx={{ p: 3, borderRadius: 2, minWidth: 0 }}>
                    <Typography variant="h3" sx={{ fontSize: '1.1rem', fontWeight: 600, mb: 2 }}>Datos del anticipo</Typography>

                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Departamento</Typography>
                    <Select fullWidth displayEmpty value={deptoId} onChange={(e) => cambiarDepto(e.target.value)} sx={{ mb: 2 }}>
                        <MenuItem value=""><em>Seleccione un departamento</em></MenuItem>
                        {deptosDisponibles.map((d) => <MenuItem key={d.id} value={d.id}>{d.etiqueta}</MenuItem>)}
                    </Select>

                    {depto && (
                        <Box sx={{ border: '1px solid #CFDCEA', borderRadius: 2, p: 2, mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">Responsable del departamento</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{responsable || '—'}</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#2E9D78', mt: 0.5 }}>
                                Saldo pendiente: {formatBs(depto.saldoPendiente)} — Sin deuda vencida
                            </Typography>
                            {creditoAnterior > 0 && (
                                <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main', mt: 0.5 }}>
                                    Credito a favor actual: {formatBs(creditoAnterior)}
                                </Typography>
                            )}
                        </Box>
                    )}

                    {/* Pagado por (editable, precarga con el responsable) */}
                    {depto && (
                        <>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Pagado por</Typography>
                            <TextField fullWidth value={pagadoPor} onChange={(e) => setPagadoPor(e.target.value)}
                                placeholder="Nombre de quien realiza el pago" sx={{ mb: 0.5 }} />
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                                Por defecto el responsable; puede cambiarse si pagó un familiar o inquilino.
                            </Typography>
                        </>
                    )}

                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                        <Box sx={{ flex: 1, minWidth: 150 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Fecha de recepcion</Typography>
                            <TextField fullWidth type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
                                slotProps={{ inputLabel: { shrink: true } }} />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 150 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Monto anticipado</Typography>
                            <TextField fullWidth type="number" placeholder="Bs 0,00" value={monto}
                                onChange={(e) => { setMonto(e.target.value); setError(''); }} />
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 1.5 }}>
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
                    <Box sx={{ bgcolor: '#E4EEF5', borderRadius: 2, p: 1.5, mb: 2 }}>
                        <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }} display="block">
                            {medio}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">{refCfg.ayuda}</Typography>
                    </Box>

                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Descripcion</Typography>
                    <TextField fullWidth placeholder="Anticipo para proximas expensas" value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)} />

                    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

                    <Alert severity="success" icon={false} sx={{ bgcolor: '#E4F4EE', color: '#2E7D5B', mt: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>✓ El anticipo generara credito a favor</Typography>
                        <Typography variant="body2">y un unico ingreso en el flujo de caja.</Typography>
                    </Alert>
                </Paper>

                {/* Vista previa */}
                <Paper sx={{ p: 3, borderRadius: 2, minWidth: 0 }}>
                    <Typography variant="h3" sx={{ fontSize: '1.1rem', fontWeight: 600, mb: 2 }}>Vista previa</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                        <Typography variant="body2" color="text.secondary">Departamento</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{depto ? depto.id : '—'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                        <Typography variant="body2" color="text.secondary">Pagado por</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{pagadoPor || responsable || '—'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                        <Typography variant="body2" color="text.secondary">Medio</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{medio}{referencia ? ` — ${referencia}` : ''}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                        <Typography variant="body2" color="text.secondary">Monto recibido</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#2E9D78' }}>{formatBs(montoNum)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderTop: '1px solid #CFDCEA', mt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">Credito anterior</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatBs(creditoAnterior)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>Nuevo credito</Typography>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: '#2E9D78' }}>{formatBs(nuevoCredito)}</Typography>
                    </Box>
                    <Box sx={{ bgcolor: '#E4EEF5', borderRadius: 2, p: 2, mt: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Integracion con flujo de caja</Typography>
                        <Typography variant="body2" color="text.secondary">
                            El flujo de caja registra + {formatBs(montoNum)} hoy. Al aplicarlo a una expensa no se genera un segundo ingreso.
                        </Typography>
                    </Box>
                </Paper>
            </Box>

            {/* Botones */}
            <Box sx={{ display: 'flex', gap: 2, mt: 2, flexDirection: { xs: 'column-reverse', md: 'row' }, justifyContent: { md: 'flex-end' } }}>
                <Button variant="outlined" onClick={() => navigate('/finanzas/pagos')} sx={{ width: { xs: '100%', md: 'auto' } }}>
                    Cancelar
                </Button>
                <Button variant="contained" onClick={registrar} sx={{ width: { xs: '100%', md: 'auto' } }}>
                    Registrar anticipo
                </Button>
            </Box>
        </DashboardLayout>
    );
}