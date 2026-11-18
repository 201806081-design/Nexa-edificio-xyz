import { useState } from 'react';
import {
    Box, Typography, Button, TextField, Select, MenuItem, InputAdornment, Alert,
    Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import {
    TIPOS_MOV_BANCARIO, OPCIONES_MOV_BANCARIO, entraAlBanco,
    validarMovimientoBancario, registrarMovimientoBancario, cuentasBancarias,
    etiquetaCuenta, saldoCaja, saldoBanco, fechaTexto, isoATexto, textoAIso,
} from '../../../constants/cajaBancosMock';
import { formatBs } from '../../../constants/finanzasMock';

// Registra un movimiento que aparece en el extracto del banco:
//   - Deposito desde caja / Retiro a caja: traspaso (no es ingreso ni gasto)
//   - Comision o cargo bancario / Interes ganado: gasto o ingreso del edificio
//
// props: open, cuentaInicial, tipoInicial, onClose, onGuardado(tipo)
// Si hay varias cuentas, se elige en cual se registra.

const EXPLICACION = {
    [TIPOS_MOV_BANCARIO.DEPOSITO]: 'Dinero de caja que se deposita en el banco. Baja el efectivo y sube el banco; no es ingreso nuevo.',
    [TIPOS_MOV_BANCARIO.RETIRO]: 'Dinero que se saca del banco para tener efectivo en caja. No es gasto.',
    [TIPOS_MOV_BANCARIO.COMISION]: 'Cobro del banco (mantenimiento de cuenta, chequera, transferencias). Se registra como gasto.',
    [TIPOS_MOV_BANCARIO.INTERES]: 'Interes que paga el banco por el saldo. Se registra como ingreso.',
};

// En un deposito se propone depositar todo el efectivo de caja (se puede cambiar)
const montoSugerido = (tipo) => (tipo === TIPOS_MOV_BANCARIO.DEPOSITO && saldoCaja() > 0 ? String(saldoCaja()) : '');

const formInicial = (tipo) => ({
    tipo, fecha: textoAIso(fechaTexto()), monto: montoSugerido(tipo), referencia: '', descripcion: '',
});

export default function MovimientoBancarioDialog({ open, cuentaInicial, tipoInicial = TIPOS_MOV_BANCARIO.DEPOSITO, onClose, onGuardado }) {
    const cuentas = cuentasBancarias();
    const [cuentaId, setCuentaId] = useState(() => cuentaInicial?.id ?? cuentas[0]?.id ?? '');
    const cuenta = cuentas.find((c) => c.id === cuentaId) ?? null;
    // El formulario arranca limpio cada vez: la pantalla monta el dialogo solo al abrirlo
    const [form, setForm] = useState(() => formInicial(tipoInicial));
    const [errores, setErrores] = useState({});

    const cambiar = (campo, valor) => {
        setForm((f) => ({ ...f, [campo]: valor }));
        setErrores((e) => ({ ...e, [campo]: '' }));
    };

    const cambiarTipo = (tipo) => {
        setForm((f) => ({ ...f, tipo, monto: montoSugerido(tipo) }));
        setErrores((e) => ({ ...e, tipo: '', monto: '' }));
    };

    const guardar = () => {
        const datos = { ...form, fecha: isoATexto(form.fecha) };
        const err = validarMovimientoBancario(datos, cuenta.id);
        setErrores(err);
        if (Object.keys(err).length > 0) return;
        registrarMovimientoBancario(datos, cuenta.id);
        onGuardado(form.tipo);
    };

    if (!cuenta) return null;
    const entra = entraAlBanco(form.tipo);
    const esDeposito = form.tipo === TIPOS_MOV_BANCARIO.DEPOSITO;
    const disponible = esDeposito ? saldoCaja() : (entra ? null : saldoBanco(cuenta.id));

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 700 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#E4EEF5', color: 'primary.main', display: 'grid', placeItems: 'center' }}>
                    <SwapVertIcon fontSize="small" />
                </Box>
                Registrar movimiento bancario
            </DialogTitle>
            <DialogContent dividers>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Registra lo que figura en el extracto del banco.
                </Typography>

                {cuentas.length > 1 && (
                    <>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Cuenta</Typography>
                        <Select fullWidth value={cuentaId} onChange={(e) => { setCuentaId(e.target.value); setErrores({}); }} sx={{ mb: 2 }}>
                            {cuentas.map((c) => <MenuItem key={c.id} value={c.id}>{etiquetaCuenta(c)}</MenuItem>)}
                        </Select>
                    </>
                )}
                {cuentas.length === 1 && (
                    <Typography variant="body2" sx={{ mb: 2 }}>Cuenta: <strong>{etiquetaCuenta(cuenta)}</strong></Typography>
                )}

                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Tipo de movimiento</Typography>
                <Select fullWidth value={form.tipo} onChange={(e) => cambiarTipo(e.target.value)} sx={{ mb: 1 }}>
                    {OPCIONES_MOV_BANCARIO.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
                <Alert severity={entra ? 'success' : 'warning'} icon={false} sx={{ mb: 2, py: 0.25 }}>
                    <Typography variant="caption">
                        <strong>{entra ? 'Entra al banco.' : 'Sale del banco.'}</strong> {EXPLICACION[form.tipo]}
                    </Typography>
                </Alert>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
                    <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Fecha</Typography>
                        <TextField fullWidth type="date" value={form.fecha} onChange={(e) => cambiar('fecha', e.target.value)}
                            error={!!errores.fecha} helperText={errores.fecha}
                            slotProps={{ htmlInput: { max: textoAIso(fechaTexto()) } }} />
                    </Box>
                    <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Monto</Typography>
                        <TextField fullWidth type="number" value={form.monto} placeholder="0.00"
                            onChange={(e) => cambiar('monto', e.target.value)}
                            error={!!errores.monto}
                            helperText={errores.monto || (disponible != null ? `Disponible: ${formatBs(disponible)}${esDeposito ? ' (puedes dejar una parte en caja)' : ''}` : ' ')}
                            slotProps={{
                                htmlInput: { min: 0, step: 0.01 },
                                input: { startAdornment: <InputAdornment position="start">Bs</InputAdornment> },
                            }} />
                    </Box>
                </Box>

                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>N.º de operacion (opcional)</Typography>
                <TextField fullWidth value={form.referencia} placeholder="Como figura en el extracto"
                    onChange={(e) => cambiar('referencia', e.target.value)} sx={{ mb: 2 }}
                    slotProps={{ htmlInput: { maxLength: 40 } }} />

                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Descripcion</Typography>
                <TextField fullWidth value={form.descripcion} placeholder="Ej. Deposito de cobros en efectivo"
                    onChange={(e) => cambiar('descripcion', e.target.value)}
                    error={!!errores.descripcion} helperText={errores.descripcion}
                    slotProps={{ htmlInput: { maxLength: 120 } }} />
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button variant="outlined" onClick={onClose}>Cancelar</Button>
                <Button variant="contained" onClick={guardar}>Registrar movimiento</Button>
            </DialogActions>
        </Dialog>
    );
}
