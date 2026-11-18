import { Box, Typography, Paper } from '@mui/material';
import { fondosDelPeriodo } from '../constants/cajaBancosMock';
import { TODOS_LOS_PERIODOS } from '../constants/periodos';
import { formatBs } from '../constants/finanzasMock';

// Cuadre de fondos del periodo:
//   saldo de apertura (o al inicio del mes) + ingresos - gastos = disponible (caja + banco)
// Lo usan el Resumen financiero e Ingresos y gastos, con las mismas cifras que
// Caja y bancos. El saldo de apertura NO es un ingreso: es el dinero con el que
// el edificio empezo a usar el sistema.

function Bloque({ signo, titulo, monto, detalle, color, bg }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            {signo && (
                <Typography sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '1.25rem', width: 16, textAlign: 'center', flexShrink: 0 }}>
                    {signo}
                </Typography>
            )}
            <Box sx={{ flex: 1, minWidth: 0, bgcolor: bg, borderRadius: 2, px: 2, py: 1.25 }}>
                <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>{titulo}</Typography>
                <Typography sx={{ fontWeight: 700, color, fontSize: '1.1rem' }} noWrap>{formatBs(monto)}</Typography>
                {detalle && <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>{detalle}</Typography>}
            </Box>
        </Box>
    );
}

export default function CuadreFondos({ periodo }) {
    const f = fondosDelPeriodo(periodo);
    const todos = periodo === TODOS_LOS_PERIODOS;

    return (
        <Paper sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2, mb: 3 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>
                Cuadre de fondos · {periodo}
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 1.5 }}>
                <Bloque
                    titulo={f.esApertura ? `Saldo de apertura (${f.apertura.fecha})` : 'Saldo al inicio del mes'}
                    monto={f.saldoInicial}
                    detalle={f.esApertura ? `Caja ${formatBs(f.apertura.caja)} · Banco ${formatBs(f.apertura.banco)}` : null}
                    color="#1F5F8B" bg="#E4EEF5"
                />
                <Bloque signo="+" titulo="Ingresos" monto={f.ingresos} color="#2E9D78" bg="#E4F4EE" />
                <Bloque signo="−" titulo="Gastos" monto={f.gastos} color="#D9534F" bg="#FBEAE9" />
                <Bloque
                    signo="="
                    titulo={todos ? 'Disponible hoy' : 'Saldo al cierre del mes'}
                    monto={f.saldoFinal}
                    detalle={`Caja ${formatBs(f.caja)} · Banco ${formatBs(f.banco)}`}
                    color="#132B3E" bg="#F1F5FA"
                />
            </Box>
            {f.esApertura && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
                    El saldo de apertura es el dinero que habia en caja y en el banco cuando el edificio empezo a usar el sistema.
                    No se cuenta como ingreso. Se revisa en <strong>Caja y bancos</strong>.
                </Typography>
            )}
        </Paper>
    );
}
