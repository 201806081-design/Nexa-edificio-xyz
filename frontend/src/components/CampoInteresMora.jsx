import { Box, Typography, Switch, TextField, InputAdornment } from '@mui/material';
import { METODOS_MORA } from '../constants/moraMock';

// Campo de interes de mora con interruptor de activacion.
// Se usan dos: "Interes mensual (%)" e "Interes mensual (fijo)".
// Solo uno puede estar activo: al apagar uno se enciende el otro.
// Lo comparten "Mora e intereses" y "Configuracion financiera".
//
// props:
//   metodo    -> METODOS_MORA.PORCENTAJE | METODOS_MORA.MONTO_FIJO (el de este campo)
//   seleccion -> metodo activo en el formulario
//   valor     -> valor del campo (porcentaje o monto en Bs)
//   onMetodo  -> (metodoActivo) => void
//   onValor   -> (valor) => void
const CAMPOS = {
    [METODOS_MORA.PORCENTAJE]: {
        etiqueta: 'Interes mensual (%)',
        otro: METODOS_MORA.MONTO_FIJO,
        adorno: { endAdornment: <InputAdornment position="end">%</InputAdornment> },
        limites: { min: 0, max: 100, step: 0.5 },
    },
    [METODOS_MORA.MONTO_FIJO]: {
        etiqueta: 'Interes mensual (fijo)',
        otro: METODOS_MORA.PORCENTAJE,
        adorno: { startAdornment: <InputAdornment position="start">Bs</InputAdornment> },
        limites: { min: 0, step: 1 },
    },
};

export default function CampoInteresMora({ metodo, seleccion, valor, onMetodo, onValor, sx }) {
    const campo = CAMPOS[metodo];
    const activo = seleccion === metodo;

    return (
        <Box sx={sx}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: activo ? 'text.primary' : 'text.secondary' }}>
                    {campo.etiqueta}
                </Typography>
                <Switch
                    size="small"
                    checked={activo}
                    onChange={(e) => onMetodo(e.target.checked ? metodo : campo.otro)}
                    sx={{ my: -0.5 }}
                    slotProps={{ input: { 'aria-label': `Activar ${campo.etiqueta.toLowerCase()}` } }}
                />
            </Box>
            <TextField
                fullWidth type="number" value={valor}
                disabled={!activo}
                onChange={(e) => onValor(e.target.value)}
                slotProps={{
                    htmlInput: { ...campo.limites, 'aria-label': campo.etiqueta },
                    input: campo.adorno,
                }}
            />
        </Box>
    );
}
