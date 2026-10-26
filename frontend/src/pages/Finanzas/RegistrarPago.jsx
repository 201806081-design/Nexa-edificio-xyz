import { useState, useEffect, useMemo } from 'react';
import {
    Box, Typography, Paper, Button, Select, MenuItem, TextField, Alert, Chip,
    Table, TableHead, TableBody, TableRow, TableCell, Checkbox, FormControlLabel,
} from '@mui/material';
import SavingsIcon from '@mui/icons-material/Savings';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
    DEPARTAMENTOS_DEUDA, MEDIOS_PAGO, PAGOS_MOCK, HISTORIAL_ANTICIPOS,
} from '../../constants/pagosMock';
import { EXPENSAS_MOCK, DEPARTAMENTOS_ACTIVOS } from '../../constants/expensasMock';
import { DEUDAS_VENCIDAS, CONFIG_MORA } from '../../constants/moraMock';
import { formatBs } from '../../constants/finanzasMock';

// Calcula el total con mora acumulada segun CONFIG_MORA (compuesto o simple)
const calcularConMora = (deudaOriginal, meses) => {
    const tasa = (Number(CONFIG_MORA.interesMensual) || 0) / 100;
    const m = Math.max(0, Number(meses) || 0);
    if (CONFIG_MORA.tipoCalculo === 'Simple') {
        return Math.round(deudaOriginal * (1 + tasa * m) * 100) / 100;
    }
    return Math.round(deudaOriginal * ((1 + tasa) ** m) * 100) / 100;
};

// Pagos ya aplicados a un depto en un periodo (para descontar de DEUDAS_VENCIDAS)
const pagadoDeudaVencida = (deptoId, periodo) => PAGOS_MOCK
    .filter((p) => p.depto === deptoId && (p.periodoAplicado || '').toLowerCase().includes((periodo || '').toLowerCase().split(' ')[0]))
    .reduce((s, p) => s + (p.monto || 0), 0);

// Distribuye un monto entre las deudas, de la mas antigua a la mas nueva
function distribuir(deudas, monto) {
    let restante = Number(monto) || 0;
    return deudas.map((d) => {
        const aplicar = Math.min(d.pendiente, Math.max(0, restante));
        restante -= aplicar;
        return { periodo: d.periodo, aplicar, expensaId: d.expensaId };
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

const REF_CONFIG = {
    'Transferencia': {
        label: 'N.º de transferencia',
        placeholder: '1234567890',
        ayuda: 'Es el N.º de operacion que da el banco emisor en el comprobante de quien paga.',
    },
    'QR': {
        label: 'N.º de operacion QR',
        placeholder: '1234567890',
        ayuda: 'Es el N.º de operacion que da la app bancaria al escanear el QR del edificio.',
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

// Fecha de hoy en formato YYYY-MM-DD
const hoyIso = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function RegistrarPago() {
    const navigate = useNavigate();
    const location = useLocation();

    // --- Lista unificada de deptos con deuda ---
    // Fuentes: DEPARTAMENTOS_DEUDA (legacy) + EXPENSAS_MOCK pendientes + DEUDAS_VENCIDAS (con mora)
    // Esto asegura que el admin vea en Registrar pago TODAS las deudas del depto,
    // incluyendo las moras acumuladas que aparecen en Estado de cuenta y en Mora e intereses.
    const deptosDisponibles = useMemo(() => {
        const mapa = new Map();
        // 1) Agregar los de DEPARTAMENTOS_DEUDA (ya traen deudas estructuradas con pagado/pendiente)
        DEPARTAMENTOS_DEUDA.forEach((d) => {
            mapa.set(d.id, { ...d, deudas: d.deudas.map((x) => ({ ...x })) });
        });
        // 2) Agregar los de EXPENSAS_MOCK que tengan saldo pendiente y no esten en el mapa
        EXPENSAS_MOCK.forEach((e) => {
            if (e.estado === 'Pagada') return;
            const pendiente = Math.max(0, (e.total || e.monto || 0) - (e.pagado || 0));
            if (pendiente === 0) return;
            if (!mapa.has(e.depto)) {
                mapa.set(e.depto, {
                    id: e.depto,
                    etiqueta: `${e.depto} — ${e.responsable}`,
                    responsable: `${e.responsable} · Propietario`,
                    saldoPendiente: 0,
                    deudas: [],
                });
            }
            const d = mapa.get(e.depto);
            if (!d.deudas.some((x) => x.periodo === e.periodo)) {
                d.deudas.push({
                    periodo: e.periodo,
                    totalDeuda: e.total || e.monto || 0,
                    pagado: e.pagado || 0,
                    pendiente,
                    expensaId: e.id,
                });
            }
        });
        // 3) Agregar DEUDAS_VENCIDAS (meses pasados con mora acumulada) — misma fuente que Mora
        DEUDAS_VENCIDAS.forEach((dv) => {
            const totalConMora = calcularConMora(dv.deudaOriginal, dv.meses);
            const pagado = pagadoDeudaVencida(dv.depto, dv.periodo);
            const pendiente = Math.max(0, totalConMora - pagado);
            if (pendiente === 0) return;
            if (!mapa.has(dv.depto)) {
                // Buscar el nombre real del responsable en DEPARTAMENTOS_ACTIVOS
                const activo = DEPARTAMENTOS_ACTIVOS.find((a) => a.id === dv.depto);
                const nombre = activo ? activo.responsable : `Depto. ${dv.depto}`;
                mapa.set(dv.depto, {
                    id: dv.depto,
                    etiqueta: `${dv.depto} — ${nombre}`,
                    responsable: `${nombre} · Propietario`,
                    saldoPendiente: 0,
                    deudas: [],
                });
            }
            const d = mapa.get(dv.depto);
            if (!d.deudas.some((x) => x.periodo === dv.periodo)) {
                d.deudas.push({
                    periodo: dv.periodo,
                    totalDeuda: totalConMora,
                    pagado,
                    pendiente,
                    expensaId: null, // no esta en EXPENSAS_MOCK; es solo deuda vencida
                    mora: Math.round((totalConMora - dv.deudaOriginal) * 100) / 100,
                    meses: dv.meses,
                });
            }
        });
        // 4) Recalcular saldoPendiente y ordenar deudas por periodo (mas antiguo primero)
        const MES_IDX = {
            enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
            julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12
        };
        const periodoKey = (p) => {
            const [mes, anio] = (p || '').toLowerCase().split(' ');
            return (Number(anio) || 0) * 100 + (MES_IDX[mes] || 0);
        };
        mapa.forEach((d) => {
            d.deudas.sort((a, b) => periodoKey(a.periodo) - periodoKey(b.periodo));
            d.saldoPendiente = d.deudas.reduce((s, x) => s + x.pendiente, 0);
        });
        return Array.from(mapa.values()).sort((a, b) => String(a.id).localeCompare(String(b.id)));
    }, []);

    const [deptoId, setDeptoId] = useState('');
    const [fecha, setFecha] = useState(hoyIso());
    const [monto, setMonto] = useState('');
    const [medio, setMedio] = useState('Transferencia');
    const [referencia, setReferencia] = useState('');
    const [pagadoPor, setPagadoPor] = useState('');
    const [aplicaciones, setAplicaciones] = useState([]);
    const [aplicarCredito, setAplicarCredito] = useState(false);

    const depto = deptosDisponibles.find((d) => d.id === deptoId);
    const saldoPendiente = depto ? depto.saldoPendiente : 0;
    const refCfg = REF_CONFIG[medio] || REF_CONFIG['Transferencia'];

    // Credito disponible del depto (suma de todos los anticipos con saldo a favor)
    const creditoDepto = useMemo(() => {
        if (!depto) return 0;
        return HISTORIAL_ANTICIPOS
            .filter((a) => a.depto === depto.id)
            .reduce((s, a) => s + (a.credito || 0), 0);
    }, [depto]);

    // Credito a aplicar efectivamente (nunca mas que lo necesario)
    const efectivoNum = Number(monto) || 0;
    const creditoReal = aplicarCredito && depto
        ? Math.min(creditoDepto, Math.max(0, saldoPendiente - efectivoNum))
        : 0;
    const totalEfectivo = efectivoNum + creditoReal;

    const sumarAplicaciones = (arr) => arr.reduce((s, a) => s + (Number(a.aplicar) || 0), 0);
    const totalAplicado = sumarAplicaciones(aplicaciones);
    const excedeSaldo = totalEfectivo > saldoPendiente;
    const distribuidoOk = depto && totalEfectivo > 0 && totalAplicado === totalEfectivo && !excedeSaldo;
    const nuevoSaldo = saldoPendiente - totalAplicado;

    // Pago 100% con credito: no hay efectivo, solo se aplica saldo a favor del depto
    const soloCredito = depto && efectivoNum === 0 && creditoReal > 0;

    // Cambiar depto: reinicia aplicaciones, precarga pagadoPor, resetea credito
    const cambiarDepto = (id) => {
        setDeptoId(id);
        const d = deptosDisponibles.find((x) => x.id === id);
        if (d) {
            setAplicaciones(d.deudas.map((x) => ({ periodo: x.periodo, aplicar: 0, expensaId: x.expensaId })));
            setPagadoPor((d.responsable || '').split(' · ')[0]);
        } else {
            setAplicaciones([]);
            setPagadoPor('');
        }
        setMonto('');
        setAplicarCredito(false);
    };

    // Autocarga desde location.state (viene de Expensas -> "Registrar pago")
    useEffect(() => {
        const s = location.state;
        if (s?.deptoPrecargado) {
            const d = deptosDisponibles.find((x) => x.id === s.deptoPrecargado);
            if (d) {
                setDeptoId(d.id);
                setAplicaciones(d.deudas.map((x) => ({ periodo: x.periodo, aplicar: 0, expensaId: x.expensaId })));
                setPagadoPor((d.responsable || '').split(' · ')[0]);
                // Precargar el monto pendiente y auto-distribuir
                const montoP = s.montoPendiente || d.saldoPendiente;
                setMonto(String(montoP));
                setAplicaciones(distribuir(d.deudas, montoP));
            }
            // Limpiar state para no repetir en refresh
            window.history.replaceState({}, '');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Monto -> auto-distribuye en aplicaciones (deuda mas antigua primero)
    const cambiarMonto = (valor) => {
        setMonto(valor);
        const efectivo = Number(valor) || 0;
        const credito = aplicarCredito ? Math.min(creditoDepto, Math.max(0, saldoPendiente - efectivo)) : 0;
        const totalADistribuir = efectivo + credito;
        if (depto) setAplicaciones(distribuir(depto.deudas, totalADistribuir));
    };

    // Toggle credito -> redistribuye incluyendo o excluyendo el credito
    const toggleCredito = (checked) => {
        setAplicarCredito(checked);
        const efectivo = Number(monto) || 0;
        const credito = checked ? Math.min(creditoDepto, Math.max(0, saldoPendiente - efectivo)) : 0;
        const totalADistribuir = efectivo + credito;
        if (depto) setAplicaciones(distribuir(depto.deudas, totalADistribuir));
    };

    // Editar manualmente una casilla "Aplicar" -> sincroniza "Monto pagado"
    const cambiarAplicar = (periodo, valor) => {
        const nuevas = aplicaciones.map((a) => (a.periodo === periodo ? { ...a, aplicar: valor } : a));
        setAplicaciones(nuevas);
        const total = sumarAplicaciones(nuevas);
        const credito = aplicarCredito ? Math.min(creditoDepto, total) : 0;
        setMonto(String(Math.max(0, total - credito)));
    };

    // Clic en el chip "pendiente" -> auto-rellena "Aplicar"
    const aplicarPendiente = (periodo, pendiente) => {
        const nuevas = aplicaciones.map((a) => (a.periodo === periodo ? { ...a, aplicar: pendiente } : a));
        setAplicaciones(nuevas);
        const total = sumarAplicaciones(nuevas);
        const credito = aplicarCredito ? Math.min(creditoDepto, total) : 0;
        setMonto(String(Math.max(0, total - credito)));
    };

    // Pagar todos los pendientes de un solo clic
    const pagarSaldoCompleto = () => {
        if (!depto) return;
        const nuevas = depto.deudas.map((d) => ({ periodo: d.periodo, aplicar: d.pendiente, expensaId: d.expensaId }));
        setAplicaciones(nuevas);
        const total = sumarAplicaciones(nuevas);
        const credito = aplicarCredito ? Math.min(creditoDepto, total) : 0;
        setMonto(String(Math.max(0, total - credito)));
    };

    const confirmar = () => {
        if (!distribuidoOk) return;
        const codigo = siguienteCodigo();
        const estado = nuevoSaldo > 0 ? 'Parcial' : 'Completo';

        const distribucion = depto.deudas.map((d) => {
            const ap = Number((aplicaciones.find((a) => a.periodo === d.periodo) || {}).aplicar) || 0;
            return { periodo: d.periodo, aplicado: ap, saldoRestante: d.pendiente - ap };
        }).filter((x) => x.aplicado > 0 || x.saldoRestante > 0);

        const periodos = distribucion.filter((x) => x.aplicado > 0).map((x) => x.periodo).join(' / ');

        // Si el pago es 100% con credito, no hay medio ni referencia reales
        const medioFinal = soloCredito ? 'Crédito a favor' : medio;
        const referenciaFinal = soloCredito ? '' : referencia;

        // 1) Agregar el pago al PAGOS_MOCK
        PAGOS_MOCK.unshift({
            id: codigo,
            fecha: fechaBonita(fecha),
            depto: depto.id,
            responsable: (depto.responsable || '').split(' · ')[0],
            pagadoPor: pagadoPor || (depto.responsable || '').split(' · ')[0],
            medio: medioFinal,
            referencia: referenciaFinal,
            periodoAplicado: periodos,
            monto: efectivoNum,                  // solo lo que entro en efectivo
            creditoAplicado: creditoReal,         // crédito aplicado del anticipo
            total: totalEfectivo,                 // suma de efectivo + crédito
            saldoPosterior: nuevoSaldo,
            estado,
        });

        // 2) Actualizar DEPARTAMENTOS_DEUDA (si el depto esta ahi)
        const deptoOriginal = DEPARTAMENTOS_DEUDA.find((x) => x.id === depto.id);
        if (deptoOriginal) {
            deptoOriginal.deudas.forEach((d) => {
                const ap = Number((aplicaciones.find((a) => a.periodo === d.periodo) || {}).aplicar) || 0;
                d.pagado += ap;
                d.pendiente -= ap;
            });
            deptoOriginal.saldoPendiente = Math.max(0, (deptoOriginal.saldoPendiente || 0) - totalAplicado);
        }

        // 3) Marcar expensas en EXPENSAS_MOCK como Pagada cuando corresponde
        aplicaciones.forEach((a) => {
            if (!a.expensaId || !a.aplicar) return;
            const exp = EXPENSAS_MOCK.find((e) => e.id === a.expensaId);
            if (!exp) return;
            exp.pagado = (exp.pagado || 0) + Number(a.aplicar);
            const totalExp = exp.total || exp.monto || 0;
            if (exp.pagado >= totalExp) exp.estado = 'Pagada';
        });

        // 4) Descontar credito aplicado del HISTORIAL_ANTICIPOS (mas antiguos primero)
        if (creditoReal > 0) {
            let restante = creditoReal;
            HISTORIAL_ANTICIPOS
                .filter((a) => a.depto === depto.id && (a.credito || 0) > 0)
                .sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''))
                .forEach((a) => {
                    if (restante <= 0) return;
                    const descontar = Math.min(a.credito, restante);
                    a.aplicado = (a.aplicado || 0) + descontar;
                    a.credito -= descontar;
                    restante -= descontar;
                    if (a.credito === 0) a.estado = 'Aplicado';
                    else if (a.aplicado > 0) a.estado = 'Parcial';
                    if (!a.aplicaciones) a.aplicaciones = [];
                    a.aplicaciones.push({
                        periodo: periodos || 'varios',
                        pagoRef: codigo,
                        tipo: a.tipoDepto,
                        base: 0, agua: 0, m3Agua: null, mora: 0, mesesMora: 0,
                        total: descontar, monto: descontar,
                    });
                });
        }

        navigate('/finanzas/pagos/registrado', {
            state: {
                detalle: {
                    codigo, departamento: depto.id, fecha: fechaBonita(fecha),
                    monto: efectivoNum, creditoAplicado: creditoReal, total: totalEfectivo,
                    estado, nuevoSaldo, distribucion, pagadoPor,
                    medio: medioFinal, referencia: referenciaFinal,
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
                        {deptosDisponibles.map((d) => <MenuItem key={d.id} value={d.id}>{d.etiqueta}</MenuItem>)}
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

                    {/* Credito disponible del depto */}
                    {depto && creditoDepto > 0 && (
                        <Box sx={{ bgcolor: '#E4F4EE', border: '1px solid #C6E6D7', borderRadius: 2, p: 2, mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <SavingsIcon sx={{ color: '#2E9D78' }} />
                                <Typography variant="body2" sx={{ fontWeight: 700, color: '#2E9D78' }}>
                                    Crédito disponible: {formatBs(creditoDepto)}
                                </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                Este departamento tiene saldo a favor de pagos anticipados.
                            </Typography>
                            <FormControlLabel
                                control={<Checkbox checked={aplicarCredito} onChange={(e) => toggleCredito(e.target.checked)} />}
                                label={<Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    Aplicar hasta {formatBs(Math.min(creditoDepto, saldoPendiente))} del crédito al pago
                                </Typography>}
                            />
                            {aplicarCredito && creditoReal > 0 && (
                                <Typography variant="caption" sx={{ display: 'block', color: '#2E9D78', fontWeight: 600 }}>
                                    Se aplicarán {formatBs(creditoReal)} del crédito.
                                </Typography>
                            )}
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
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                Monto en efectivo
                                {aplicarCredito && creditoReal > 0 && (
                                    <Typography variant="caption" sx={{ ml: 1, color: '#2E9D78' }}>
                                        (+ {formatBs(creditoReal)} crédito)
                                    </Typography>
                                )}
                            </Typography>
                            <TextField fullWidth type="number" placeholder="Bs 0,00" value={monto}
                                onChange={(e) => cambiarMonto(e.target.value)} />
                        </Box>
                    </Box>

                    {soloCredito ? (
                        /* Pago cubierto 100% con credito: no se piden medio ni referencia */
                        <Box sx={{ bgcolor: '#E4F4EE', border: '1px solid #C6E6D7', borderRadius: 2, p: 2, mt: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <SavingsIcon sx={{ color: '#2E9D78' }} fontSize="small" />
                                <Typography variant="body2" sx={{ fontWeight: 700, color: '#2E9D78' }}>
                                    Pago cubierto 100% con crédito a favor
                                </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                Este pago no requiere medio ni número de referencia porque se descuenta del
                                saldo a favor que el departamento ya tenía por un anticipo previo.
                                El registro quedará guardado con medio “Crédito a favor”.
                            </Typography>
                        </Box>
                    ) : (
                        <>
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
                        </>
                    )}

                    {excedeSaldo && (
                        <Alert severity="warning" icon={false} sx={{ bgcolor: '#FDF0D5', color: '#8A5A00', mt: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>El pago supera el saldo pendiente.</Typography>
                            <Typography variant="body2">Ajusta el monto o aplica un anticipo.</Typography>
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
                                                    <TableCell sx={{ fontWeight: 600 }}>
                                                        {d.periodo}
                                                        {d.mora > 0 && (
                                                            <Chip
                                                                size="small"
                                                                label={`+ ${formatBs(d.mora)} mora (${d.meses}m)`}
                                                                sx={{ ml: 1, bgcolor: '#FDE7E6', color: '#D9534F', fontWeight: 600, height: 22 }}
                                                            />
                                                        )}
                                                    </TableCell>
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
                                    <Typography variant="body2" color="text.secondary">Pagado en efectivo</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#2E9D78' }}>− {formatBs(efectivoNum)}</Typography>
                                </Box>
                                {creditoReal > 0 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                        <Typography variant="body2" color="text.secondary">Crédito aplicado</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#2E9D78' }}>− {formatBs(creditoReal)}</Typography>
                                    </Box>
                                )}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderTop: '1px solid #CFDCEA', mt: 0.5, pt: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>Nuevo saldo pendiente</Typography>
                                    <Typography variant="h3" sx={{ fontWeight: 700, color: nuevoSaldo > 0 ? '#D9534F' : '#2E9D78' }}>{formatBs(nuevoSaldo)}</Typography>
                                </Box>
                            </Box>

                            {distribuidoOk && (
                                <Alert severity="success" icon={false} sx={{ bgcolor: '#E4F4EE', color: '#2E7D5B', mt: 2 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>✓ El monto esta completamente distribuido.</Typography>
                                    <Typography variant="body2">Se generara un registro en el historial de pagos y se actualizaran las expensas.</Typography>
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