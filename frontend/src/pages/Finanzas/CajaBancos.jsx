import { useState, useMemo } from 'react';
import {
    Box, Typography, Paper, Button, Select, MenuItem, Chip, Alert, Snackbar,
    ToggleButton, ToggleButtonGroup, Table, TableHead, TableBody, TableRow, TableCell,
    Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import PaymentsIcon from '@mui/icons-material/Payments';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SavingsIcon from '@mui/icons-material/Savings';
import RuleIcon from '@mui/icons-material/Rule';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import MoveDownIcon from '@mui/icons-material/MoveDown';
import AddIcon from '@mui/icons-material/Add';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import SyncIcon from '@mui/icons-material/Sync';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../hooks/useAuth';
import LibroCuenta from './cajaBancos/LibroCuenta';
import CuentaBancariaDialog from './cajaBancos/CuentaBancariaDialog';
import MovimientoBancarioDialog from './cajaBancos/MovimientoBancarioDialog';
import ArqueoCajaDialog from './cajaBancos/ArqueoCajaDialog';
import {
    CAJA, ARQUEOS, TIPOS_MOV_BANCARIO,
    cuentaBancariaActiva, etiquetaCuenta, eliminarCuentaBancaria,
    movimientosCaja, movimientosBanco, saldoCaja, saldoBanco, libroDelPeriodo, resultadoArqueo,
} from '../../constants/cajaBancosMock';
import { movimientosConciliacion, porConciliar } from '../../constants/conciliacionMock';
import { periodosConMovimientos } from '../../constants/periodos';
import { formatBs } from '../../constants/finanzasMock';

// ============================================================
//  CAJA Y BANCOS (requisito 7)
//  Caja:   libro de caja con saldo, arqueos y depositos al banco (7.1)
//  Bancos: cuenta del edificio, sus movimientos y los del extracto (7.2)
//          y acceso a la conciliacion de ingresos y egresos (7.3)
// ============================================================

const tabGroupSx = {
    bgcolor: '#fff',
    '& .MuiToggleButton-root': {
        textTransform: 'none', fontWeight: 600, color: '#1F5F8B', borderColor: '#cdd8e3', px: 3, py: 1, gap: 1,
    },
    '& .MuiToggleButton-root.Mui-selected': {
        bgcolor: '#1F5F8B', color: '#fff', '&:hover': { bgcolor: '#1C4E70' },
    },
};

const botonSecundarioSx = { color: '#1a2733', borderColor: '#cdd8e3', width: { xs: '100%', sm: 'auto' } };

const COLOR_ARQUEO = {
    Cuadra: { bgcolor: '#E4F4EE', color: '#2E9D78' },
    Sobrante: { bgcolor: '#FDF0D5', color: '#B6802A' },
    Faltante: { bgcolor: '#FBEAE9', color: '#D9534F' },
};

const COLOR_CONCILIACION = {
    Conciliado: { bgcolor: '#E4F4EE', color: '#2E9D78' },
    Pendiente: { bgcolor: '#FDF0D5', color: '#B6802A' },
    Alerta: { bgcolor: '#FBEAE9', color: '#D9534F' },
};

function Kpi({ label, valor, nota, icon, color, bg }) {
    return (
        <Paper sx={{ p: 2.5, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
            <Box sx={{ flexShrink: 0, width: 44, height: 44, borderRadius: '50%', bgcolor: bg, color, display: 'grid', placeItems: 'center' }}>
                {icon}
            </Box>
            <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" color="text.secondary">{label}</Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color }} noWrap>{valor}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>{nota}</Typography>
            </Box>
        </Paper>
    );
}

function Dato({ etiqueta, valor }) {
    return (
        <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary">{etiqueta}</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{valor}</Typography>
        </Box>
    );
}

export default function CajaBancos() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const [tab, setTab] = useState(location.state?.tab === 'bancos' ? 'bancos' : 'caja');
    const periodos = useMemo(() => periodosConMovimientos(), []);
    const [periodo, setPeriodo] = useState(() => periodos[0] || '');

    // Los datos viven en los mocks; "version" fuerza a recalcular despues de cada cambio
    const [version, setVersion] = useState(0);
    const refrescar = () => setVersion((v) => v + 1);

    // Dialogos (se montan solo al abrirse, asi cada formulario arranca limpio)
    const [dialogoCuenta, setDialogoCuenta] = useState(false);
    const [dialogoMovimiento, setDialogoMovimiento] = useState(null); // tipo inicial
    const [dialogoArqueo, setDialogoArqueo] = useState(false);
    const [confirmarEliminar, setConfirmarEliminar] = useState(false);
    const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });
    const avisar = (msg, sev = 'success') => setSnack({ open: true, msg, sev });

    const datos = useMemo(() => {
        const cuenta = cuentaBancariaActiva();
        const conciliacion = cuenta ? movimientosConciliacion(cuenta.id) : [];
        return {
            cuenta,
            saldoCaja: saldoCaja(),
            saldoBanco: cuenta ? saldoBanco(cuenta.id) : 0,
            pendientes: cuenta ? porConciliar(cuenta.id) : 0,
            libroCaja: libroDelPeriodo(movimientosCaja(), CAJA.saldoInicial, periodo),
            libroBanco: cuenta ? libroDelPeriodo(movimientosBanco(cuenta.id), cuenta.saldoInicial, periodo) : null,
            estadoConciliacion: new Map(conciliacion.map((m) => [m.id, m.estado])),
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [periodo, version]);
    const { cuenta } = datos;

    const KPIS = [
        { label: 'Efectivo en caja', valor: formatBs(datos.saldoCaja), nota: CAJA.nombre, icon: <PaymentsIcon />, color: '#2E9D78', bg: '#E4F4EE' },
        {
            label: 'Saldo en banco', valor: cuenta ? formatBs(datos.saldoBanco) : '—',
            nota: cuenta ? etiquetaCuenta(cuenta) : 'Sin cuenta registrada', icon: <AccountBalanceIcon />, color: '#1F5F8B', bg: '#E4EEF5',
        },
        { label: 'Total disponible', valor: formatBs(datos.saldoCaja + datos.saldoBanco), nota: 'Caja + banco', icon: <SavingsIcon />, color: '#132B3E', bg: '#F1F5FA' },
        {
            label: 'Por conciliar', valor: datos.pendientes, nota: datos.pendientes ? 'Movimientos del banco' : 'Todo conciliado',
            icon: <RuleIcon />, color: datos.pendientes ? '#B6802A' : '#2E9D78', bg: datos.pendientes ? '#FDF0D5' : '#E4F4EE',
        },
    ];

    // ---------- Acciones ----------
    const cuentaGuardada = (nueva) => {
        setDialogoCuenta(false);
        refrescar();
        avisar(`Cuenta ${etiquetaCuenta(nueva)} registrada. Desde ahora recibe los cobros y pagos por banco.`);
    };

    const eliminarCuenta = () => {
        const etiqueta = etiquetaCuenta(cuenta);
        eliminarCuentaBancaria(cuenta.id);
        setConfirmarEliminar(false);
        refrescar();
        avisar(`Cuenta ${etiqueta} eliminada. Su historial se conserva.`, 'info');
    };

    const movimientoGuardado = (tipo) => {
        setDialogoMovimiento(null);
        refrescar();
        avisar(`${tipo} registrado.`);
    };

    const arqueoGuardado = (arqueo) => {
        setDialogoArqueo(false);
        refrescar();
        const resultado = resultadoArqueo(arqueo.diferencia);
        avisar(`Arqueo guardado: ${resultado.toLowerCase()}${resultado === 'Cuadra' ? '' : ` (${formatBs(arqueo.diferencia)})`}.`,
            resultado === 'Cuadra' ? 'success' : 'warning');
    };

    // ---------- Vista ----------
    return (
        <DashboardLayout>
            <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Caja y bancos</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Controla el efectivo de caja y la cuenta bancaria del edificio, y concilia sus movimientos
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 2 }}>
                {KPIS.map((k) => <Kpi key={k.label} {...k} />)}
            </Box>

            <Paper sx={{ p: 1.5, borderRadius: 2, mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                <ToggleButtonGroup exclusive value={tab} onChange={(e, v) => v && setTab(v)} sx={tabGroupSx}>
                    <ToggleButton value="caja"><PaymentsIcon fontSize="small" /> Caja</ToggleButton>
                    <ToggleButton value="bancos"><AccountBalanceIcon fontSize="small" /> Bancos</ToggleButton>
                </ToggleButtonGroup>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Periodo</Typography>
                    <Select size="small" value={periodo} onChange={(e) => setPeriodo(e.target.value)} sx={{ minWidth: 180, flex: { xs: 1, sm: 'none' } }}>
                        {periodos.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                    </Select>
                </Box>
            </Paper>

            {/* ===================== CAJA ===================== */}
            {tab === 'caja' && (
                <Box>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { sm: 'flex-end' }, mb: 2 }}>
                        <Button variant="outlined" startIcon={<MoveDownIcon />} sx={botonSecundarioSx}
                            disabled={!cuenta} onClick={() => setDialogoMovimiento(TIPOS_MOV_BANCARIO.DEPOSITO)}>
                            Depositar en banco
                        </Button>
                        <Button variant="contained" startIcon={<FactCheckIcon />} sx={{ width: { xs: '100%', sm: 'auto' } }}
                            onClick={() => setDialogoArqueo(true)}>
                            Arqueo de caja
                        </Button>
                    </Box>

                    <Alert severity="info" icon={false} sx={{ bgcolor: '#E4EEF5', color: 'text.primary', mb: 2 }}>
                        <Typography variant="body2">
                            Aqui entra todo lo que se cobra o se paga <strong>en efectivo</strong> (expensas, anticipos, gastos y sueldos),
                            ademas de los depositos y retiros con el banco. Haz un <strong>arqueo</strong> para comprobar que el efectivo
                            que hay coincide con el sistema.
                        </Typography>
                    </Alert>

                    <LibroCuenta libro={datos.libroCaja} titulo={`Libro de caja — ${CAJA.nombre}`} periodo={periodo}
                        vacio={`No hubo movimientos de caja en ${periodo}.`} />

                    <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, mt: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>Arqueos de caja</Typography>
                        <Box sx={{ overflowX: 'auto' }}>
                            <Table size="small" sx={{ minWidth: 700 }}>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#F1F5FA' }}>
                                        <TableCell><strong>Fecha</strong></TableCell>
                                        <TableCell align="right"><strong>Segun sistema</strong></TableCell>
                                        <TableCell align="right"><strong>Contado</strong></TableCell>
                                        <TableCell><strong>Resultado</strong></TableCell>
                                        <TableCell><strong>Responsable</strong></TableCell>
                                        <TableCell><strong>Observacion</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {ARQUEOS.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center" sx={{ color: 'text.secondary', py: 3 }}>Aun no se hizo ningun arqueo.</TableCell>
                                        </TableRow>
                                    ) : ARQUEOS.map((a) => {
                                        const resultado = resultadoArqueo(a.diferencia);
                                        return (
                                            <TableRow key={a.id}>
                                                <TableCell sx={{ fontWeight: 600 }}>{a.fecha}</TableCell>
                                                <TableCell align="right">{formatBs(a.saldoSistema)}</TableCell>
                                                <TableCell align="right">{formatBs(a.contado)}</TableCell>
                                                <TableCell>
                                                    <Chip size="small" sx={{ ...COLOR_ARQUEO[resultado], fontWeight: 600 }}
                                                        label={resultado === 'Cuadra' ? resultado : `${resultado} ${formatBs(Math.abs(a.diferencia))}`} />
                                                </TableCell>
                                                <TableCell>{a.responsable}</TableCell>
                                                <TableCell sx={{ color: 'text.secondary' }}>{a.observacion || '—'}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </Box>
                    </Paper>
                </Box>
            )}

            {/* ===================== BANCOS ===================== */}
            {tab === 'bancos' && (
                <Box>
                    {cuenta ? (
                        <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, mb: 2 }}>
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', minWidth: 0 }}>
                                    <Box sx={{ flexShrink: 0, width: 52, height: 52, borderRadius: 2, bgcolor: '#E4EEF5', color: 'primary.main', display: 'grid', placeItems: 'center' }}>
                                        <AccountBalanceIcon />
                                    </Box>
                                    <Box sx={{ minWidth: 0 }}>
                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                                            <Typography variant="h3" sx={{ fontWeight: 700 }}>{cuenta.banco}</Typography>
                                            <Chip size="small" label="En uso" sx={{ bgcolor: '#E4F4EE', color: '#2E9D78', fontWeight: 600 }} />
                                            {cuenta.ejemplo && <Chip size="small" label="Cuenta de ejemplo" sx={{ bgcolor: '#FDF0D5', color: '#B6802A', fontWeight: 600 }} />}
                                        </Box>
                                        <Typography variant="body2" color="text.secondary">{cuenta.tipoCuenta} · N.º {cuenta.nroCuenta}</Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
                                    <Button variant="outlined" startIcon={<SwapHorizIcon />} sx={botonSecundarioSx} onClick={() => setDialogoCuenta(true)}>
                                        Cambiar cuenta
                                    </Button>
                                    <Button variant="outlined" color="error" startIcon={<DeleteOutlinedIcon />} sx={{ width: { xs: '100%', sm: 'auto' } }}
                                        onClick={() => setConfirmarEliminar(true)}>
                                        Eliminar
                                    </Button>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mt: 2 }}>
                                <Dato etiqueta="Titular" valor={cuenta.titular} />
                                <Dato etiqueta="Moneda" valor={cuenta.moneda} />
                                <Dato etiqueta="En uso desde" valor={cuenta.desde} />
                                <Dato etiqueta="Saldo inicial" valor={formatBs(cuenta.saldoInicial)} />
                            </Box>
                            {cuenta.ejemplo && (
                                <Alert severity="warning" sx={{ mt: 2 }}>
                                    Es una cuenta de ejemplo para probar el sistema. Usa <strong>Cambiar cuenta</strong> para registrar la cuenta
                                    real del edificio (puedes indicar que se usa desde el inicio), o <strong>Eliminar</strong> si no la necesitas.
                                </Alert>
                            )}
                        </Paper>
                    ) : (
                        <Paper sx={{ p: 4, borderRadius: 2, mb: 2, textAlign: 'center' }}>
                            <AccountBalanceIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                            <Typography sx={{ fontWeight: 700, mb: 0.5 }}>No hay una cuenta bancaria registrada</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 520, mx: 'auto' }}>
                                Registra la cuenta del edificio: recibira todos los cobros y pagos por transferencia, QR, cheque y deposito.
                                Mientras no haya una, esos movimientos no se asignan a ningun banco.
                            </Typography>
                            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogoCuenta(true)}>
                                Registrar cuenta bancaria
                            </Button>
                        </Paper>
                    )}

                    {cuenta && (
                        <>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { sm: 'flex-end' }, mb: 2 }}>
                                <Button variant="outlined" startIcon={<SyncIcon />} sx={botonSecundarioSx}
                                    onClick={() => navigate('/finanzas/caja-bancos/conciliacion')}>
                                    Conciliar movimientos
                                </Button>
                                <Button variant="contained" startIcon={<AddIcon />} sx={{ width: { xs: '100%', sm: 'auto' } }}
                                    onClick={() => setDialogoMovimiento(TIPOS_MOV_BANCARIO.COMISION)}>
                                    Registrar movimiento bancario
                                </Button>
                            </Box>
                            <LibroCuenta
                                libro={datos.libroBanco}
                                titulo={`Movimientos — ${etiquetaCuenta(cuenta)}`}
                                periodo={periodo}
                                vacio={`No hubo movimientos en el banco en ${periodo}.`}
                                columnaExtra={{
                                    titulo: 'Conciliacion',
                                    render: (m) => {
                                        const estado = datos.estadoConciliacion.get(m.id) ?? 'Pendiente';
                                        return <Chip size="small" label={estado} sx={{ ...COLOR_CONCILIACION[estado], fontWeight: 600 }} />;
                                    },
                                }}
                            />
                        </>
                    )}
                </Box>
            )}

            {/* ===================== DIALOGOS ===================== */}
            {dialogoCuenta && (
                <CuentaBancariaDialog open cuentaActual={cuenta} onClose={() => setDialogoCuenta(false)} onGuardada={cuentaGuardada} />
            )}
            {dialogoMovimiento && (
                <MovimientoBancarioDialog open cuenta={cuenta} tipoInicial={dialogoMovimiento}
                    onClose={() => setDialogoMovimiento(null)} onGuardado={movimientoGuardado} />
            )}
            {dialogoArqueo && (
                <ArqueoCajaDialog open responsable={user?.nombre || 'Administrador'}
                    onClose={() => setDialogoArqueo(false)} onGuardado={arqueoGuardado} />
            )}

            <Dialog open={confirmarEliminar} onClose={() => setConfirmarEliminar(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Eliminar cuenta bancaria</DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" sx={{ mb: 1.5 }}>
                        <strong>{etiquetaCuenta(cuenta)}</strong> dejara de usarse desde hoy.
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Sus movimientos anteriores se conservan en el historial. Registra otra cuenta para seguir recibiendo
                        cobros y pagos por banco.
                    </Typography>
                    {datos.saldoBanco > 0 && (
                        <Alert severity="warning" sx={{ mt: 1.5 }}>
                            La cuenta tiene un saldo de <strong>{formatBs(datos.saldoBanco)}</strong>. Si lo vas a usar, registra antes
                            un retiro a caja.
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button variant="outlined" onClick={() => setConfirmarEliminar(false)}>Cancelar</Button>
                    <Button variant="contained" color="error" onClick={eliminarCuenta}>Eliminar cuenta</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack((s) => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity={snack.sev} onClose={() => setSnack((s) => ({ ...s, open: false }))} sx={{ width: '100%' }}>
                    {snack.msg}
                </Alert>
            </Snackbar>
        </DashboardLayout>
    );
}
