import { useState } from 'react';
import {
    Box, Typography, Button, TextField, Alert, Divider,
    Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import {
    DENOMINACIONES, totalContado, resultadoArqueo, registrarArqueo, saldoCaja, fechaTexto,
} from '../../../constants/cajaBancosMock';
import { formatBs } from '../../../constants/finanzasMock';

// Arqueo de caja: se cuenta el efectivo por billetes y monedas y se compara
// con el saldo que dice el sistema. Si no cuadra, la observacion es obligatoria.
//
// props: open, responsable, onClose, onGuardado(arqueo)

const COLOR_RESULTADO = {
    Cuadra: { color: '#2E9D78', bg: '#E4F4EE' },
    Sobrante: { color: '#B6802A', bg: '#FDF0D5' },
    Faltante: { color: '#D9534F', bg: '#FBEAE9' },
};

const etiquetaDenominacion = (valor) => (valor < 1 ? `${Math.round(valor * 100)} ctvs.` : `Bs ${valor}`);

function GrupoConteo({ titulo, valores, conteo, onCambiar }) {
    return (
        <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>{titulo}</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' }, gap: 1.5 }}>
                {valores.map((v) => (
                    <TextField
                        key={v} size="small" type="number" label={etiquetaDenominacion(v)}
                        value={conteo[v] ?? ''} placeholder="0"
                        onChange={(e) => onCambiar(v, e.target.value)}
                        slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric' }, inputLabel: { shrink: true } }}
                    />
                ))}
            </Box>
        </Box>
    );
}

export default function ArqueoCajaDialog({ open, responsable, onClose, onGuardado }) {
    const [conteo, setConteo] = useState({});
    const [observacion, setObservacion] = useState('');
    const [errorObs, setErrorObs] = useState(false);

    const saldoSistema = saldoCaja();
    const contado = totalContado(conteo);
    const diferencia = Math.round((contado - saldoSistema) * 100) / 100;
    const resultado = resultadoArqueo(diferencia);
    const colores = COLOR_RESULTADO[resultado];

    // Solo cantidades enteras y positivas
    const cambiarCantidad = (valor, cantidad) => {
        const limpio = cantidad === '' ? '' : String(Math.max(0, Math.floor(Number(cantidad) || 0)));
        setConteo((c) => ({ ...c, [valor]: limpio }));
    };

    const guardar = () => {
        if (resultado !== 'Cuadra' && !observacion.trim()) { setErrorObs(true); return; }
        onGuardado(registrarArqueo({ contado, observacion, responsable }));
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 700 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#E4EEF5', color: 'primary.main', display: 'grid', placeItems: 'center' }}>
                    <FactCheckIcon fontSize="small" />
                </Box>
                Arqueo de caja
            </DialogTitle>
            <DialogContent dividers>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Cuenta el efectivo que hay en caja hoy ({fechaTexto()}) e ingresa la cantidad de cada billete y moneda.
                </Typography>

                <GrupoConteo titulo="Billetes" valores={DENOMINACIONES.billetes} conteo={conteo} onCambiar={cambiarCantidad} />
                <GrupoConteo titulo="Monedas" valores={DENOMINACIONES.monedas} conteo={conteo} onCambiar={cambiarCantidad} />

                <Divider sx={{ my: 1.5 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">Saldo segun el sistema</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatBs(saldoSistema)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">Efectivo contado</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatBs(contado)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, p: 1.5, borderRadius: 2, bgcolor: colores.bg }}>
                    <Typography sx={{ fontWeight: 700, color: colores.color }}>{resultado}</Typography>
                    <Typography sx={{ fontWeight: 700, color: colores.color }}>
                        {diferencia > 0 ? '+ ' : ''}{diferencia < 0 ? '− ' : ''}{formatBs(Math.abs(diferencia))}
                    </Typography>
                </Box>

                {resultado !== 'Cuadra' && (
                    <Alert severity="warning" icon={false} sx={{ mt: 2, mb: 1 }}>
                        <Typography variant="caption">
                            La caja no cuadra. Explica la diferencia (por ejemplo, un gasto sin registrar o un cambio mal dado).
                        </Typography>
                    </Alert>
                )}
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, mt: 1 }}>
                    Observacion {resultado === 'Cuadra' ? '(opcional)' : ''}
                </Typography>
                <TextField fullWidth multiline minRows={2} value={observacion}
                    onChange={(e) => { setObservacion(e.target.value); setErrorObs(false); }}
                    error={errorObs} helperText={errorObs ? 'Explica por que no cuadra la caja' : ''}
                    slotProps={{ htmlInput: { maxLength: 200 } }} />
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button variant="outlined" onClick={onClose}>Cancelar</Button>
                <Button variant="contained" onClick={guardar}>Guardar arqueo</Button>
            </DialogActions>
        </Dialog>
    );
}
