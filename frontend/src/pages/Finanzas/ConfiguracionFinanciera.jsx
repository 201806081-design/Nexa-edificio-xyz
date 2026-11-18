import { useState, useMemo, useEffect } from 'react';
import {
    Box, Typography, Paper, Button, Select, MenuItem, TextField, Alert, InputAdornment, Snackbar,
    Chip, Table, TableHead, TableBody, TableRow, TableCell,
    Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HistoryIcon from '@mui/icons-material/History';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import CampoInteresMora from '../../components/CampoInteresMora';
import {
    CONFIG_AGUA, CONFIG_MORA, ALICUOTAS,
    HISTORIAL_TARIFAS, EXPENSAS_MOCK, calcularAgua,
} from '../../constants/expensasMock';
// Configuracion compartida (expensa base y agua) para sincronizar en ambos sentidos
import * as ConfigMod from '../../constants/configuracionMock';
import {
    METODOS_MORA, APLICAR_MORA_DESDE, OPCIONES_BASE_MORA, AYUDA_BASE_MORA,
    textoMora, validarConfigMora, guardarConfigMora,
} from '../../constants/moraMock';
import { formatBs } from '../../constants/finanzasMock';

// Objetos compartidos de configuracion (pueden no existir en todas las instalaciones)
const EXPENSA_BASE_V1 = ConfigMod.EXPENSA_BASE || null;
const CONFIG_AGUA_V1 = ConfigMod.CONFIG_AGUA || null;
const { REGLAS_PERIODO } = ConfigMod;

const MESES_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
// Misma lista que Mora e intereses (fuente unica en configuracionMock)
const { DIAS_VENCIMIENTO, textoDiaVencimiento } = ConfigMod;

const yyyyMmToTexto = (yyyyMm) => {
    if (!yyyyMm) return '';
    const [y, m] = yyyyMm.split('-');
    return `${MESES_ES[Number(m) - 1]} ${y}`;
};

const hoyYyyyMm = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

function TarjetaTipo({ tipo, valor, onChange }) {
    return (
        <Box sx={{ flex: 1, minWidth: { xs: '100%', md: 220 }, display: 'flex', alignItems: 'center', gap: 2, border: '1px solid #CFDCEA', boxShadow: '0 1px 3px rgba(19, 43, 62, 0.08), 0 4px 12px rgba(19, 43, 62, 0.08)', borderRadius: 2, p: 2 }}>
            <Box sx={{ flexShrink: 0, width: 40, height: 40, borderRadius: 1.5, bgcolor: '#E4EEF5', color: 'primary.main', display: 'grid', placeItems: 'center', fontWeight: 700 }}>
                {tipo}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Departamento tipo {tipo}</Typography>
                <TextField fullWidth type="number" value={valor} onChange={(e) => onChange(e.target.value)}
                    slotProps={{ input: { startAdornment: <InputAdornment position="start">Bs</InputAdornment> } }} />
            </Box>
        </Box>
    );
}

export default function ConfiguracionFinanciera() {
    const navigate = useNavigate();

    // Valores iniciales: se leen de la configuracion compartida (sync bidireccional al abrir)
    const inicialBase = {
        A: EXPENSA_BASE_V1?.A ?? ALICUOTAS.A,
        B: EXPENSA_BASE_V1?.B ?? ALICUOTAS.B,
        C: EXPENSA_BASE_V1?.C ?? ALICUOTAS.C,
    };
    const inicialAgua = {
        precioM3: CONFIG_AGUA_V1?.precioM3 ?? CONFIG_AGUA.tarifaPorM3,
        minimoM3: CONFIG_AGUA.minimoM3,
        tarifaMinima: CONFIG_AGUA_V1?.tarifaMinima ?? CONFIG_AGUA.minimoBs,
    };
    // Reglas de mora: la misma configuracion que usa "Mora e intereses"
    const inicialReglas = {
        diaVencimiento: REGLAS_PERIODO.diaVencimiento,
        metodo: CONFIG_MORA.metodo,
        interesMensual: CONFIG_MORA.interesMensual,
        montoFijo: CONFIG_MORA.montoFijo,
        tipoCalculo: CONFIG_MORA.tipoCalculo,
        baseMora: CONFIG_MORA.baseMora,
        aplicarMoraDesde: CONFIG_MORA.aplicarMoraDesde,
    };

    const [base, setBase] = useState(inicialBase);
    const [agua, setAgua] = useState(inicialAgua);
    const [reglas, setReglas] = useState(inicialReglas);
    // Flag: si el admin edita a mano la tarifa minima, deja de auto-calcularse
    const [tarifaMinManual, setTarifaMinManual] = useState(false);

    const [vigenciaMes, setVigenciaMes] = useState(hoyYyyyMm());
    const [razon, setRazon] = useState('');

    const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });
    const [recalcAbierto, setRecalcAbierto] = useState(false);
    const [tick, setTick] = useState(0);

    // Auto-calcular tarifa minima = minimo m3 × precio por m3 (mientras el admin no la haya editado a mano)
    useEffect(() => {
        if (tarifaMinManual) return;
        const auto = (Number(agua.minimoM3) || 0) * (Number(agua.precioM3) || 0);
        setAgua((a) => ({ ...a, tarifaMinima: auto }));
    }, [agua.precioM3, agua.minimoM3, tarifaMinManual]);

    const cambiarBase = (tipo, valor) => setBase((b) => ({ ...b, [tipo]: valor }));
    const cambiarAgua = (campo, valor) => setAgua((a) => ({ ...a, [campo]: valor }));
    const cambiarTarifaMin = (valor) => {
        setAgua((a) => ({ ...a, tarifaMinima: valor }));
        setTarifaMinManual(true);
    };
    const resetTarifaMinAuto = () => {
        setTarifaMinManual(false);
    };
    const cambiarReglas = (campo, valor) => setReglas((r) => ({ ...r, [campo]: valor }));
    const errorMora = validarConfigMora(reglas);
    const esFijo = reglas.metodo === METODOS_MORA.MONTO_FIJO;

    const vigenteDesde = useMemo(() => yyyyMmToTexto(vigenciaMes), [vigenciaMes]);
    const esRetroactivo = useMemo(() => vigenciaMes < hoyYyyyMm(), [vigenciaMes]);

    const expensasAfectadas = useMemo(() => {
        if (!esRetroactivo) return [];
        return EXPENSAS_MOCK.filter((e) => e.periodo === vigenteDesde);
    }, [esRetroactivo, vigenteDesde, tick]);

    const aplicarCambios = (recalcular) => {
        // 1) Actualizar expensa base y agua
        ALICUOTAS.A = Number(base.A) || 0;
        ALICUOTAS.B = Number(base.B) || 0;
        ALICUOTAS.C = Number(base.C) || 0;

        CONFIG_AGUA.tarifaPorM3 = Number(agua.precioM3) || 0;
        CONFIG_AGUA.minimoM3 = Number(agua.minimoM3) || 0;
        CONFIG_AGUA.minimoBs = Number(agua.tarifaMinima) || 0;

        // Mora y dia de vencimiento: se guardan en la configuracion compartida con "Mora e intereses"
        guardarConfigMora({ ...reglas, vigenteDesde });

        // 2) Sincronizar la expensa base y el agua con la configuracion compartida
        try {
            if (EXPENSA_BASE_V1) {
                EXPENSA_BASE_V1.A = ALICUOTAS.A;
                EXPENSA_BASE_V1.B = ALICUOTAS.B;
                EXPENSA_BASE_V1.C = ALICUOTAS.C;
            }
            if (CONFIG_AGUA_V1) {
                CONFIG_AGUA_V1.precioM3 = CONFIG_AGUA.tarifaPorM3;
                CONFIG_AGUA_V1.tarifaMinima = CONFIG_AGUA.minimoBs;
            }
        } catch { /* configuracion compartida no disponible, ok */ }

        // 3) Agregar entrada al historial
        const serie = HISTORIAL_TARIFAS.length + 1;
        HISTORIAL_TARIFAS.unshift({
            id: `HT-${String(serie).padStart(3, '0')}`,
            fechaCambio: new Date().toLocaleDateString('es-BO'),
            vigenteDesde,
            precioPorM3: CONFIG_AGUA.tarifaPorM3,
            minimoBs: CONFIG_AGUA.minimoBs,
            minimoM3: CONFIG_AGUA.minimoM3,
            mora: textoMora(CONFIG_MORA),
            diaVencimiento: REGLAS_PERIODO.diaVencimiento,
            alicuotaA: ALICUOTAS.A, alicuotaB: ALICUOTAS.B, alicuotaC: ALICUOTAS.C,
            admin: 'Oscar Tarque',
            razon: razon.trim() || '—',
        });

        // 4) Recalcular expensas retroactivas si corresponde
        let recalcCount = 0;
        if (recalcular && expensasAfectadas.length > 0) {
            expensasAfectadas.forEach((e) => {
                if (e.m3 != null && e.m3 > 0 && e.estado !== 'Pagada') {
                    const { agua: nuevoAgua } = calcularAgua(e.m3);
                    e.agua = nuevoAgua;
                    e.total = e.base + nuevoAgua;
                    recalcCount += 1;
                }
            });
        }

        setRazon('');
        setRecalcAbierto(false);
        setTick((t) => t + 1);
        const sufijo = recalcCount > 0 ? ` ${recalcCount} expensa${recalcCount !== 1 ? 's' : ''} recalculada${recalcCount !== 1 ? 's' : ''}.` : '';
        setSnack({ open: true, msg: `Configuracion guardada (vigente desde ${vigenteDesde}).${sufijo}`, sev: 'success' });
    };

    const onGuardar = () => {
        if (errorMora) {
            setSnack({ open: true, msg: errorMora, sev: 'error' });
            return;
        }
        if (esRetroactivo && expensasAfectadas.length > 0) {
            setRecalcAbierto(true);
        } else {
            aplicarCambios(false);
        }
    };

    return (
        <DashboardLayout>
            <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Configuracion financiera</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Define los valores que se utilizaran al generar cada periodo
            </Typography>

            <Alert severity="info" icon={false} sx={{ bgcolor: '#E4EEF5', color: 'text.primary', mb: 3 }}>
                <strong>Los montos A, B y C son fijos por tipo de departamentos.</strong><br />
                Solo cambian cuando el administrador actualiza esta configuracion; no se escriben nuevamente cada mes.
                Lo que guardes aqui se sincroniza con <strong>Mora e intereses</strong>.
            </Alert>

            {/* Expensa base por tipo */}
            <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                <Typography variant="h3" sx={{ fontSize: '1.1rem', fontWeight: 600, mb: 0.5 }}>
                    Expensa base por tipo de departamento
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Configure el monto mensual vigente para cada tipo de departamento.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <TarjetaTipo tipo="A" valor={base.A} onChange={(v) => cambiarBase('A', v)} />
                    <TarjetaTipo tipo="B" valor={base.B} onChange={(v) => cambiarBase('B', v)} />
                    <TarjetaTipo tipo="C" valor={base.C} onChange={(v) => cambiarBase('C', v)} />
                </Box>
            </Paper>

            {/* Agua + Reglas del periodo */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
                {/* Configuracion del agua */}
                <Paper sx={{ p: 3, borderRadius: 2, minWidth: 0 }}>
                    <Typography variant="h3" sx={{ fontSize: '1.1rem', fontWeight: 600, mb: 0.5 }}>
                        Configuracion del agua
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        El consumo se obtiene de la diferencia entre lecturas del medidor
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                        <Box sx={{ flex: 1, minWidth: 140 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Precio por m³</Typography>
                            <TextField fullWidth type="number" value={agua.precioM3}
                                onChange={(e) => cambiarAgua('precioM3', e.target.value)}
                                slotProps={{ input: { startAdornment: <InputAdornment position="start">Bs</InputAdornment> } }} />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 140 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Minimo</Typography>
                            <TextField fullWidth type="number" value={agua.minimoM3}
                                onChange={(e) => cambiarAgua('minimoM3', e.target.value)}
                                slotProps={{ input: { endAdornment: <InputAdornment position="end">m³</InputAdornment> } }} />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 140 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Tarifa minima</Typography>
                            <TextField fullWidth type="number" value={agua.tarifaMinima}
                                onChange={(e) => cambiarTarifaMin(e.target.value)}
                                slotProps={{ input: { startAdornment: <InputAdornment position="start">Bs</InputAdornment> } }} />
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                {tarifaMinManual ? (
                                    <>
                                        Valor manual.{' '}
                                        <Button size="small" variant="text" onClick={resetTarifaMinAuto}
                                            sx={{ p: 0, minWidth: 0, textTransform: 'none', color: '#1F5F8B', fontSize: '0.72rem', textDecoration: 'underline' }}>
                                            Recalcular automatico
                                        </Button>
                                    </>
                                ) : (
                                    <>Auto: minimo × precio = {formatBs((Number(agua.minimoM3) || 0) * (Number(agua.precioM3) || 0))}</>
                                )}
                            </Typography>
                        </Box>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Si el consumo es ≤ al minimo, se cobra la tarifa minima.
                    </Typography>
                </Paper>

                {/* Reglas del periodo + mora */}
                <Paper sx={{ p: 3, borderRadius: 2, minWidth: 0 }}>
                    <Typography variant="h3" sx={{ fontSize: '1.1rem', fontWeight: 600, mb: 2 }}>
                        Reglas del periodo y mora
                    </Typography>
                    {/* Interes mensual (%) y, debajo, Interes mensual (fijo): solo uno activo */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 2, mb: 2 }}>
                        <Box sx={{ order: { xs: 0, sm: 'initial' } }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Dia de vencimiento</Typography>
                            <Select fullWidth value={reglas.diaVencimiento} onChange={(e) => cambiarReglas('diaVencimiento', e.target.value)}>
                                {DIAS_VENCIMIENTO.map((d) => <MenuItem key={d} value={d}>{textoDiaVencimiento(d)}</MenuItem>)}
                            </Select>
                        </Box>
                        <CampoInteresMora
                            metodo={METODOS_MORA.PORCENTAJE} seleccion={reglas.metodo} valor={reglas.interesMensual}
                            onMetodo={(m) => cambiarReglas('metodo', m)} onValor={(v) => cambiarReglas('interesMensual', v)}
                            sx={{ order: { xs: 1, sm: 'initial' } }}
                        />
                        <Box sx={{ order: { xs: 3, sm: 'initial' } }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: esFijo ? 'text.secondary' : 'text.primary' }}>Tipo de calculo</Typography>
                            <Select fullWidth value={reglas.tipoCalculo} disabled={esFijo} onChange={(e) => cambiarReglas('tipoCalculo', e.target.value)}>
                                <MenuItem value="Simple">Simple</MenuItem>
                                <MenuItem value="Compuesto">Compuesto</MenuItem>
                            </Select>
                        </Box>
                        <CampoInteresMora
                            metodo={METODOS_MORA.MONTO_FIJO} seleccion={reglas.metodo} valor={reglas.montoFijo}
                            onMetodo={(m) => cambiarReglas('metodo', m)} onValor={(v) => cambiarReglas('montoFijo', v)}
                            sx={{ order: { xs: 2, sm: 'initial' } }}
                        />
                    </Box>
                    {errorMora && <Alert severity="error" sx={{ mb: 2 }}>{errorMora}</Alert>}
                    {/* Mora con pagos parciales (sincronizado con Mora e intereses) */}
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Mora con pagos parciales</Typography>
                        <Select fullWidth value={reglas.baseMora} onChange={(e) => cambiarReglas('baseMora', e.target.value)}>
                            {OPCIONES_BASE_MORA.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                        </Select>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            {AYUDA_BASE_MORA[reglas.baseMora]}
                        </Typography>
                    </Box>
                    {/* Aplicar mora desde (sincronizado con Mora e intereses) */}
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Aplicar mora desde</Typography>
                        <Select fullWidth value={reglas.aplicarMoraDesde}
                            onChange={(e) => cambiarReglas('aplicarMoraDesde', e.target.value)}>
                            {APLICAR_MORA_DESDE.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
                        </Select>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        La mora se aplica a las expensas que no se paguen antes del dia de vencimiento.
                        El interes se sincroniza con <strong>Mora e intereses</strong>.
                    </Typography>
                </Paper>
            </Box>

            {/* Vigencia */}
            <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                <Typography variant="h3" sx={{ fontSize: '1.1rem', fontWeight: 600, mb: 0.5 }}>
                    Vigencia
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Mes desde el que se aplicaran estos valores. Si eliges un mes anterior, la configuracion se aplica
                    retroactivamente (se puede recalcular las expensas ya generadas).
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end', mb: 2 }}>
                    <Box sx={{ flex: 1, minWidth: 220 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Vigente desde el mes</Typography>
                        <TextField fullWidth type="month" value={vigenciaMes}
                            onChange={(e) => setVigenciaMes(e.target.value)} />
                    </Box>
                    <Box sx={{ flex: 2, minWidth: 220 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Razon del cambio (opcional)</Typography>
                        <TextField fullWidth value={razon} onChange={(e) => setRazon(e.target.value)}
                            placeholder="Ej: Asamblea 15/10, ajuste tarifa SAGUAPAC" />
                    </Box>
                </Box>

                {esRetroactivo ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#FDF0D5', borderRadius: 2, p: 2 }}>
                        <WarningAmberIcon sx={{ color: '#B6802A' }} />
                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#B6802A' }}>Aplicacion retroactiva</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Vigente desde <strong>{vigenteDesde}</strong>
                                {expensasAfectadas.length > 0 && (
                                    <> · {expensasAfectadas.length} expensa{expensasAfectadas.length !== 1 ? 's' : ''} generada{expensasAfectadas.length !== 1 ? 's' : ''} en ese mes</>
                                )}
                            </Typography>
                        </Box>
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#E4F4EE', borderRadius: 2, p: 2 }}>
                        <CheckCircleIcon sx={{ color: '#2E9D78' }} />
                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#2E9D78' }}>Configuracion vigente</Typography>
                            <Typography variant="body2" color="text.secondary">Se aplicara desde {vigenteDesde}</Typography>
                        </Box>
                    </Box>
                )}
            </Paper>

            {/* Historial */}
            <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }} key={tick}>
                    <HistoryIcon sx={{ color: '#1F5F8B' }} />
                    <Typography variant="h3" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>Historial de cambios</Typography>
                    <Chip label={`${HISTORIAL_TARIFAS.length} registro${HISTORIAL_TARIFAS.length !== 1 ? 's' : ''}`} size="small"
                        sx={{ bgcolor: '#E4EEF5', color: '#1F5F8B', fontWeight: 600 }} />
                </Box>
                <Box sx={{ overflowX: 'auto' }}>
                    <Table size="small" sx={{ minWidth: 820 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#F1F5FA' }}>
                                <TableCell><strong>Fecha cambio</strong></TableCell>
                                <TableCell><strong>Vigente desde</strong></TableCell>
                                <TableCell align="right"><strong>Agua / m³</strong></TableCell>
                                <TableCell align="right"><strong>Mín. agua</strong></TableCell>
                                <TableCell align="right"><strong>Mora</strong></TableCell>
                                <TableCell><strong>Admin</strong></TableCell>
                                <TableCell><strong>Razón</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {HISTORIAL_TARIFAS.map((h) => (
                                <TableRow key={h.id}>
                                    <TableCell>{h.fechaCambio}</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>{h.vigenteDesde}</TableCell>
                                    <TableCell align="right">{formatBs(h.precioPorM3)}</TableCell>
                                    <TableCell align="right">{formatBs(h.minimoBs)}</TableCell>
                                    <TableCell align="right">{h.mora}</TableCell>
                                    <TableCell>{h.admin}</TableCell>
                                    <TableCell sx={{ color: 'text.secondary' }}>{h.razon}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Box>
            </Paper>

            {/* Botones */}
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column-reverse', md: 'row' }, justifyContent: { md: 'flex-end' } }}>
                <Button variant="outlined" onClick={() => navigate('/finanzas/expensas')} sx={{ width: { xs: '100%', md: 'auto' } }}>
                    Cancelar
                </Button>
                <Button variant="contained" onClick={onGuardar} disabled={!!errorMora} sx={{ width: { xs: '100%', md: 'auto' } }}>
                    Guardar configuracion
                </Button>
            </Box>

            {/* Dialog: confirmar aplicacion retroactiva */}
            <Dialog open={recalcAbierto} onClose={() => setRecalcAbierto(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningAmberIcon sx={{ color: '#B6802A' }} />
                    Aplicacion retroactiva
                </DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        La vigencia que elegiste es <strong>{vigenteDesde}</strong>, un periodo que ya tiene
                        <strong> {expensasAfectadas.length} expensa{expensasAfectadas.length !== 1 ? 's' : ''}</strong> generada{expensasAfectadas.length !== 1 ? 's' : ''}.
                    </Typography>
                    <Box sx={{ bgcolor: '#F1F5FA', borderRadius: 2, p: 1.5, mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                            <strong>Solo guardar:</strong> los nuevos valores quedan registrados y se usan en expensas
                            futuras, pero no se tocan las ya generadas.
                            <br />
                            <strong>Guardar y recalcular:</strong> las expensas de {vigenteDesde} registradas por medidor y
                            aun no pagadas se recalculan con los nuevos valores. Las pagadas y las de monto manual no se tocan.
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRecalcAbierto(false)}>Cancelar</Button>
                    <Button onClick={() => aplicarCambios(false)}>Solo guardar</Button>
                    <Button variant="contained" color="warning" onClick={() => aplicarCambios(true)}>
                        Guardar y recalcular
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack({ ...snack, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity={snack.sev} onClose={() => setSnack({ ...snack, open: false })} sx={{ width: '100%' }}>
                    {snack.msg}
                </Alert>
            </Snackbar>
        </DashboardLayout>
    );
}