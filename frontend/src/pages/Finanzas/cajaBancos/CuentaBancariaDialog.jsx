import { useState } from 'react';
import {
    Box, Typography, Button, TextField, Select, MenuItem, Autocomplete, InputAdornment,
    FormControlLabel, Checkbox,
    Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import {
    BANCOS_BOLIVIA, TIPOS_CUENTA_BANCARIA,
    validarCuentaBancaria, registrarCuentaBancaria, etiquetaCuenta,
    fechaTexto, isoATexto, textoAIso, INICIO_SISTEMA,
} from '../../../constants/cajaBancosMock';

// Registra una cuenta bancaria del edificio. Se AGREGA a las que ya hay.
// Si se marca como principal, recibe los cobros y pagos por banco desde su
// fecha de apertura. La primera cuenta registrada siempre es la principal.
//
// props: open, principalActual (o null), onClose, onGuardada(cuentaNueva)

const vacio = () => ({
    banco: '', nroCuenta: '', tipoCuenta: TIPOS_CUENTA_BANCARIA[0],
    titular: 'Edificio XYZ', saldoInicial: '', desde: textoAIso(fechaTexto()), principal: false,
});

function Campo({ etiqueta, children, ayuda }) {
    return (
        <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>{etiqueta}</Typography>
            {children}
            {ayuda && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>{ayuda}</Typography>}
        </Box>
    );
}

export default function CuentaBancariaDialog({ open, principalActual, onClose, onGuardada }) {
    // El formulario arranca limpio cada vez: la pantalla monta el dialogo solo al abrirlo
    const [form, setForm] = useState(vacio);
    const [errores, setErrores] = useState({});

    const cambiar = (campo, valor) => {
        setForm((f) => ({ ...f, [campo]: valor }));
        setErrores((e) => ({ ...e, [campo]: '' }));
    };

    const guardar = () => {
        const datos = { ...form, desde: isoATexto(form.desde) };
        const err = validarCuentaBancaria(datos);
        setErrores(err);
        if (Object.keys(err).length > 0) return;
        onGuardada(registrarCuentaBancaria(datos));
    };

    const esPrimera = !principalActual;

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 700 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#E4EEF5', color: 'primary.main', display: 'grid', placeItems: 'center' }}>
                    <AccountBalanceIcon fontSize="small" />
                </Box>
                Registrar cuenta bancaria
            </DialogTitle>
            <DialogContent dividers>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {esPrimera
                        ? 'Sera la cuenta principal: recibira los cobros y pagos por transferencia, QR, cheque y deposito.'
                        : 'La cuenta se agrega a las que ya tienes; ninguna se elimina.'}
                    {' '}Debe ser una cuenta en bolivianos, la moneda del sistema.
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                    <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
                        <Campo etiqueta="Banco">
                            <Autocomplete
                                freeSolo
                                options={BANCOS_BOLIVIA}
                                inputValue={form.banco}
                                onInputChange={(e, valor) => cambiar('banco', valor)}
                                renderInput={(params) => (
                                    <TextField {...params} placeholder="Elige o escribe el banco"
                                        error={!!errores.banco} helperText={errores.banco} />
                                )}
                            />
                        </Campo>
                    </Box>
                    <Campo etiqueta="N.º de cuenta">
                        <TextField fullWidth value={form.nroCuenta} placeholder="Ej. 1000-2345-6789"
                            onChange={(e) => cambiar('nroCuenta', e.target.value.replace(/[^\d-]/g, ''))}
                            error={!!errores.nroCuenta} helperText={errores.nroCuenta}
                            slotProps={{ htmlInput: { maxLength: 24, inputMode: 'numeric' } }} />
                    </Campo>
                    <Campo etiqueta="Tipo de cuenta">
                        <Select fullWidth value={form.tipoCuenta} onChange={(e) => cambiar('tipoCuenta', e.target.value)}>
                            {TIPOS_CUENTA_BANCARIA.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                        </Select>
                    </Campo>
                    <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
                        <Campo etiqueta="Titular">
                            <TextField fullWidth value={form.titular} onChange={(e) => cambiar('titular', e.target.value)}
                                error={!!errores.titular} helperText={errores.titular}
                                slotProps={{ htmlInput: { maxLength: 80 } }} />
                        </Campo>
                    </Box>
                    <Campo etiqueta="Saldo inicial" ayuda="Lo que tenia la cuenta en su fecha de apertura.">
                        <TextField fullWidth type="number" value={form.saldoInicial} placeholder="0.00"
                            onChange={(e) => cambiar('saldoInicial', e.target.value)}
                            error={!!errores.saldoInicial} helperText={errores.saldoInicial}
                            slotProps={{
                                htmlInput: { min: 0, step: 0.01 },
                                input: { startAdornment: <InputAdornment position="start">Bs</InputAdornment> },
                            }} />
                    </Campo>
                    <Campo etiqueta="Fecha de apertura" ayuda={`Desde el ${INICIO_SISTEMA} hasta hoy.`}>
                        <TextField fullWidth type="date" value={form.desde} onChange={(e) => cambiar('desde', e.target.value)}
                            error={!!errores.desde} helperText={errores.desde}
                            slotProps={{ htmlInput: { min: textoAIso(INICIO_SISTEMA), max: textoAIso(fechaTexto()) } }} />
                    </Campo>
                </Box>

                {!esPrimera && (
                    <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: '#F1F5FA' }}>
                        <FormControlLabel
                            control={<Checkbox checked={form.principal} onChange={(e) => cambiar('principal', e.target.checked)} />}
                            label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Usar como cuenta principal</Typography>}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', pl: 4 }}>
                            {form.principal
                                ? `Desde su fecha de apertura, los cobros y pagos por banco entraran en esta cuenta en lugar de ${etiquetaCuenta(principalActual)}.`
                                : `Los cobros y pagos por banco seguiran entrando en ${etiquetaCuenta(principalActual)}.`}
                        </Typography>
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button variant="outlined" onClick={onClose}>Cancelar</Button>
                <Button variant="contained" onClick={guardar}>Registrar cuenta</Button>
            </DialogActions>
        </Dialog>
    );
}
