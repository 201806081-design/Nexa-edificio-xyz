import { useState } from 'react';
import {
    Box, Typography, Button, TextField, InputAdornment,
    Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import FlagIcon from '@mui/icons-material/Flag';
import {
    saldoApertura, validarSaldosApertura, editarSaldosApertura, etiquetaCuenta,
} from '../../../constants/cajaBancosMock';
import { formatBs } from '../../../constants/finanzasMock';

// Saldo de apertura: lo que habia en caja y en el banco el dia que el edificio
// empezo a usar el sistema. Se corrige aqui si el edificio arranco con otra cifra.
// No deja montos con los que algun saldo quedaria en negativo.
//
// props: open, onClose, onGuardado()

export default function SaldoAperturaDialog({ open, onClose, onGuardado }) {
    const actual = saldoApertura();
    // { caja: '1500', 'BCO-001': '25000', ... }
    const [form, setForm] = useState(() => Object.fromEntries([
        ['caja', String(actual.caja)],
        ...actual.cuentas.map((c) => [c.id, String(c.saldoInicial)]),
    ]));
    const [errores, setErrores] = useState({});

    const cambiar = (campo, valor) => {
        setForm((f) => ({ ...f, [campo]: valor }));
        setErrores((e) => ({ ...e, [campo]: '' }));
    };

    const guardar = () => {
        const err = validarSaldosApertura(form);
        setErrores(err);
        if (Object.keys(err).length > 0) return;
        editarSaldosApertura(form);
        onGuardado();
    };

    const total = Object.values(form).reduce((s, v) => s + (Number(v) || 0), 0);
    const campo = (clave, etiqueta) => (
        <Box key={clave}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>{etiqueta}</Typography>
            <TextField fullWidth type="number" value={form[clave]}
                onChange={(e) => cambiar(clave, e.target.value)}
                error={!!errores[clave]} helperText={errores[clave] || ' '}
                slotProps={{
                    htmlInput: { min: 0, step: 0.01 },
                    input: { startAdornment: <InputAdornment position="start">Bs</InputAdornment> },
                }} />
        </Box>
    );

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 700 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#E4EEF5', color: 'primary.main', display: 'grid', placeItems: 'center' }}>
                    <FlagIcon fontSize="small" />
                </Box>
                Saldo de apertura
            </DialogTitle>
            <DialogContent dividers>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Es el dinero que habia en caja y en el banco el <strong>{actual.fecha}</strong>, cuando el edificio empezo a usar
                    el sistema. No es un ingreso: es el punto de partida. Desde ahi, todo lo que se cobra y se paga suma o resta.
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                    {campo('caja', 'Caja (efectivo)')}
                    {actual.cuentas.map((c) => campo(c.id, etiquetaCuenta(c)))}
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: '#E4EEF5', borderRadius: 2, p: 1.5 }}>
                    <Typography sx={{ fontWeight: 600 }}>Total de apertura</Typography>
                    <Typography sx={{ fontWeight: 700, color: 'primary.main' }}>{formatBs(total)}</Typography>
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button variant="outlined" onClick={onClose}>Cancelar</Button>
                <Button variant="contained" onClick={guardar}>Guardar</Button>
            </DialogActions>
        </Dialog>
    );
}
