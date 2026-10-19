import { useState } from 'react';
import {
    Box, Typography, Paper, Button, Select, MenuItem, TextField, Alert, Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { DEPARTAMENTOS_ANTICIPO, MEDIOS_PAGO, HISTORIAL_ANTICIPOS } from '../../constants/pagosMock';
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

export default function RegistrarAnticipo() {
    const navigate = useNavigate();
    const [deptoId, setDeptoId] = useState('');
    const [fecha, setFecha] = useState('2026-10-19');
    const [monto, setMonto] = useState('');
    const [medio, setMedio] = useState('Transferencia');
    const [referencia, setReferencia] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [error, setError] = useState('');

    const depto = DEPARTAMENTOS_ANTICIPO.find((d) => d.id === deptoId);
    const creditoAnterior = depto ? depto.creditoAnterior : 0;
    const montoNum = Number(monto) || 0;
    const nuevoCredito = creditoAnterior + montoNum;

    const registrar = () => {
        if (!deptoId) { setError('Seleccione un departamento'); return; }
        if (!(montoNum > 0)) { setError('Ingrese un monto valido'); return; }
        const codigo = siguienteCodigo();
        const resp = depto.etiqueta.split(' — ')[1] || '';
        // MOCK: se registra el anticipo y suma el credito del departamento.
        HISTORIAL_ANTICIPOS.unshift({
            id: codigo, fecha: fechaBonita(fecha), depto: depto.id, responsable: resp,
            recibido: montoNum, aplicado: 0, credito: nuevoCredito, estado: 'Disponible',
        });
        depto.creditoAnterior = nuevoCredito;
        navigate('/finanzas/pagos/anticipo/registrado', {
            state: { detalle: { codigo, departamento: depto.id, fecha: fechaBonita(fecha), monto: montoNum, nuevoCredito, medio } },
        });
    };

    return (
        <DashboardLayout>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                <Box>
                    <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Registrar pago anticipado</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Crea un saldo a favor para un departamento
                    </Typography>
                </Box>
                <Chip label="HU-FI-05" sx={{ bgcolor: '#E4EEF5', color: 'primary.main', fontWeight: 600 }} />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                {/* Datos del anticipo */}
                <Paper sx={{ p: 3, borderRadius: 2, minWidth: 0 }}>
                    <Typography variant="h3" sx={{ fontSize: '1.1rem', fontWeight: 600, mb: 2 }}>Datos del anticipo</Typography>

                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Departamento</Typography>
                    <Select fullWidth displayEmpty value={deptoId} onChange={(e) => { setDeptoId(e.target.value); setError(''); }} sx={{ mb: 2 }}>
                        <MenuItem value=""><em>Seleccione un departamento</em></MenuItem>
                        {DEPARTAMENTOS_ANTICIPO.map((d) => <MenuItem key={d.id} value={d.id}>{d.etiqueta}</MenuItem>)}
                    </Select>

                    {depto && (
                        <Box sx={{ border: '1px solid #CFDCEA', borderRadius: 2, p: 2, mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">Saldo pendiente actual</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#2E9D78' }}>
                                {formatBs(depto.saldoPendiente)} — Sin deuda vencida
                            </Typography>
                        </Box>
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

                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                        <Box sx={{ flex: 1, minWidth: 150 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Medio de pago</Typography>
                            <Select fullWidth value={medio} onChange={(e) => setMedio(e.target.value)}>
                                {MEDIOS_PAGO.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                            </Select>
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 150 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Referencia</Typography>
                            <TextField fullWidth placeholder="TRF-0000" value={referencia} onChange={(e) => setReferencia(e.target.value)} />
                        </Box>
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
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Integracion</Typography>
                        <Typography variant="body2" color="text.secondary">
                            HU-FI-04 recibe + {formatBs(montoNum)} hoy. Aplicarlo despues no genera otro ingreso.
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