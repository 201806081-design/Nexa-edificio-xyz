import { useState, useMemo } from 'react';
import {
    Box, Typography, Paper, Button, Chip, TextField, Select, MenuItem,
    Table, TableHead, TableBody, TableRow, TableCell, InputAdornment, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, Divider, Alert, Snackbar,
    Menu, Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyIcon from '@mui/icons-material/Key';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import EmpleadoForm from './EmpleadoForm';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SettingsIcon from '@mui/icons-material/Settings';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import PaidIcon from '@mui/icons-material/Paid';
import BadgeIcon from '@mui/icons-material/Badge';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
    EMPLEADOS_MOCK, CARGOS, ESTADOS_EMPLEADO, TARIFAS_CARGO,
    PLANILLA_MOCK, PAGOS_PERSONAL_MOCK, RESUMEN_PLANILLA, RESUMEN_PAGOS_PERSONAL,
    HISTORIAL_SALARIOS_CARGO, salarioDesdeCargo, periodoEnCurso,
    MOTIVOS_BAJA, empleadoTieneHistorial, eliminarEmpleado,
} from '../../constants/personalMock';
import {
    usuarioDeEmpleado, asegurarCuentaAdministrador, sincronizarCuentaConEmpleado,
} from '../../constants/usuariosMock';
import { formatBs } from '../../constants/finanzasMock';

const estadoChipSx = (estado) => estado === 'Activo'
    ? { bgcolor: '#E4F4EE', color: '#2E9D78' }
    : { bgcolor: '#FBEAE9', color: '#D9534F' };

// Siguiente ID disponible para un empleado nuevo (EM-00X)
function siguienteIdEmpleado() {
    const nums = EMPLEADOS_MOCK.map((e) => Number(String(e.id).replace(/\D/g, '')) || 0);
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `EM-${String(next).padStart(3, '0')}`;
}

// Formatea Date -> "dd/mm/yyyy"
const fechaHoyBonita = () => {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
};

// Fecha de hoy en "YYYY-MM" para el month picker de vigencia
const mesHoyYYYYMM = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// Calcula meses en el edificio desde "dd/mm/yyyy" hasta hoy
const mesesEnElEdificio = (fechaStr) => {
    if (!fechaStr) return 0;
    const [d, m, y] = fechaStr.split('/').map(Number);
    if (!d || !m || !y) return 0;
    const ingreso = new Date(y, m - 1, d);
    const hoy = new Date();
    const meses = (hoy.getFullYear() - ingreso.getFullYear()) * 12 + (hoy.getMonth() - ingreso.getMonth());
    return Math.max(0, meses);
};

// Nombre del mes en espanol a partir de "YYYY-MM"
const MESES_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const yyyyMmATexto = (yyyyMm) => {
    if (!yyyyMm) return '';
    const [y, m] = yyyyMm.split('-');
    return `${MESES_ES[Number(m) - 1]} ${y}`;
};

// Recalcula los resumenes del mock mutando sus propiedades (misma referencia)
// para que las pantallas de Planilla e Historial vean los numeros actualizados.
const recalcularResumenes = () => {
    RESUMEN_PLANILLA.totalPlanilla = PLANILLA_MOCK.reduce((s, p) => s + (p.neto || 0), 0);
    RESUMEN_PLANILLA.bonos = PLANILLA_MOCK.reduce((s, p) => s + (p.bonos || 0), 0);
    RESUMEN_PLANILLA.anticiposDescontados = PLANILLA_MOCK.reduce((s, p) => s + (p.anticipos || 0), 0);
    RESUMEN_PLANILLA.conceptosAplicados = PLANILLA_MOCK.filter((p) => (p.bonos || 0) > 0).length;
    RESUMEN_PLANILLA.empleadosAnticipos = PLANILLA_MOCK.filter((p) => (p.anticipos || 0) > 0).length;

    const pagados = PAGOS_PERSONAL_MOCK.filter((p) => p.estado === 'Pagado');
    const pendientes = PAGOS_PERSONAL_MOCK.filter((p) => p.estado === 'Pendiente');
    RESUMEN_PAGOS_PERSONAL.pagadoEnMes = pagados.reduce((s, p) => s + (p.montoNeto || 0), 0);
    RESUMEN_PAGOS_PERSONAL.pagosConfirmados = pagados.length;
    RESUMEN_PAGOS_PERSONAL.pendiente = pendientes.reduce((s, p) => s + (p.montoNeto || 0), 0);
    RESUMEN_PAGOS_PERSONAL.empleadosPendientes = pendientes.length;
    RESUMEN_PAGOS_PERSONAL.comprobantes = pagados.length;
};

export default function Empleados() {
    const [busqueda, setBusqueda] = useState('');
    const [cargo, setCargo] = useState('Todos');
    const [estado, setEstado] = useState('Todos');
    const [tick, setTick] = useState(0); // fuerza re-render tras mutar el mock
    const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });

    // Menu de acciones por fila
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [filaSel, setFilaSel] = useState(null);
    const abrirMenu = (e, f) => { setMenuAnchor(e.currentTarget); setFilaSel(f); };
    const cerrarMenu = () => setMenuAnchor(null);

    // Modales
    const [formAbierto, setFormAbierto] = useState(false);
    const [empEditar, setEmpEditar] = useState(null);      // null = nuevo empleado
    const [credenciales, setCredenciales] = useState(null); // { usuario, password } recien creados
    const [eliminarAbierto, setEliminarAbierto] = useState(false);
    const [motivoBaja, setMotivoBaja] = useState({ motivo: 'Renuncia', detalle: '' });

    const [cfgAbierta, setCfgAbierta] = useState(false);
    const [tarifasDraft, setTarifasDraft] = useState({ ...TARIFAS_CARGO });
    const [vigenciaMes, setVigenciaMes] = useState(mesHoyYYYYMM());
    const [razonCambio, setRazonCambio] = useState('');

    const [detalleAbierto, setDetalleAbierto] = useState(false);
    const [editarEstadoAbierto, setEditarEstadoAbierto] = useState(false);
    const [estadoDraft, setEstadoDraft] = useState('Activo');

    const empleados = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        return EMPLEADOS_MOCK.filter((e) => {
            if (cargo !== 'Todos' && e.cargo !== cargo) return false;
            if (estado !== 'Todos' && e.estado !== estado) return false;
            if (q && !`${e.nombre} ${e.ci} ${e.cargo}`.toLowerCase().includes(q)) return false;
            return true;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [busqueda, cargo, estado, tick]);

    // --- Nuevo empleado / Editar informacion (misma ficha) ---
    const abrirNuevo = () => { setEmpEditar(null); setFormAbierto(true); };
    const abrirEditar = () => { setEmpEditar(filaSel); setFormAbierto(true); cerrarMenu(); };

    const guardarEmpleado = (datos) => {
        let emp;
        if (empEditar) {
            emp = EMPLEADOS_MOCK.find((e) => e.id === empEditar.id);
            Object.assign(emp, datos);
            // El cambio de cargo afecta las planillas que se generen desde ahora;
            // las ya generadas o pagadas no se tocan.
            emp.salarioBase = salarioDesdeCargo(emp.cargo);
        } else {
            emp = { id: siguienteIdEmpleado(), ...datos, estado: 'Activo', salarioBase: salarioDesdeCargo(datos.cargo) };
            // Entra en la planilla del mes de su ingreso cuando se genere (no en meses que no trabajo)
            EMPLEADOS_MOCK.push(emp);
        }
        // El Administrador es personal y usuario del sistema: se le crea su cuenta
        const cuenta = asegurarCuentaAdministrador(emp);
        recalcularResumenes();
        setFormAbierto(false);
        setTick((t) => t + 1);
        if (cuenta) setCredenciales(cuenta);
        setSnack({ open: true, msg: empEditar ? `Datos de ${emp.nombre} actualizados` : `Empleado ${emp.nombre} (${emp.id}) registrado`, sev: 'success' });
    };

    // Eliminar: solo si se registro por error (sin planilla ni pagos). Si tiene historial, se da de baja.
    const abrirEliminar = () => { setEliminarAbierto(true); cerrarMenu(); };
    const confirmarEliminar = () => {
        const nombre = filaSel?.nombre;
        if (eliminarEmpleado(filaSel.id)) {
            setSnack({ open: true, msg: `Empleado ${nombre} eliminado`, sev: 'success' });
        } else {
            setSnack({ open: true, msg: 'Tiene planilla o pagos registrados: dale de baja en lugar de eliminarlo', sev: 'warning' });
        }
        setEliminarAbierto(false);
        setTick((t) => t + 1);
    };

    // --- Configuracion de salarios por cargo ---
    const abrirConfig = () => {
        setTarifasDraft({ ...TARIFAS_CARGO });
        setVigenciaMes(mesHoyYYYYMM());
        setRazonCambio('');
        setCfgAbierta(true);
    };
    const cambiarTarifa = (cargoNombre, valor) => {
        setTarifasDraft((prev) => ({ ...prev, [cargoNombre]: Number(valor) || 0 }));
    };
    const guardarConfig = () => {
        // 0) Registrar en HISTORIAL_SALARIOS_CARGO cada cargo cuyo salario cambio
        //    (ignoramos los que quedaron igual). Esto queda visible luego en el
        //    detalle del empleado como su historial salarial.
        const hoyBonita = fechaHoyBonita();
        const nextIdNum = (() => {
            const nums = HISTORIAL_SALARIOS_CARGO.map((h) => Number(String(h.id).replace(/\D/g, '')) || 0);
            return (nums.length ? Math.max(...nums) : 0) + 1;
        })();
        let n = nextIdNum;
        Object.entries(tarifasDraft).forEach(([c, salario]) => {
            const anterior = TARIFAS_CARGO[c] || 0;
            const nuevo = Number(salario) || 0;
            if (nuevo === anterior) return;
            HISTORIAL_SALARIOS_CARGO.push({
                id: `HS-${String(n).padStart(3, '0')}`,
                fecha: hoyBonita,
                cargo: c,
                salarioAnterior: anterior,
                salarioNuevo: nuevo,
                vigenciaMes,
                razon: razonCambio.trim() || 'Ajuste de tarifa',
            });
            n += 1;
        });

        // 1) Mutar las tarifas (fuente unica)
        Object.entries(tarifasDraft).forEach(([c, salario]) => {
            TARIFAS_CARGO[c] = Number(salario) || 0;
        });
        // 2) Actualizar el salarioBase de los empleados afectados
        EMPLEADOS_MOCK.forEach((e) => {
            e.salarioBase = TARIFAS_CARGO[e.cargo] || 0;
        });

        // 3) La planilla del mes actual solo se recalcula si la vigencia es este mes
        //    o anterior; para una vigencia futura, el ajuste aplica solo cuando se
        //    genere la planilla de ese mes (los netos de hoy quedan intactos).
        const vigenciaEsEsteMesOAnterior = vigenciaMes <= mesHoyYYYYMM();
        if (vigenciaEsEsteMesOAnterior) {
            PLANILLA_MOCK.forEach((p) => {
                const emp = EMPLEADOS_MOCK.find((e) => e.id === p.empleadoId);
                const nuevoBase = emp ? TARIFAS_CARGO[emp.cargo] || 0 : p.salarioBase;
                p.salarioBase = nuevoBase;
                p.neto = nuevoBase + (p.bonos || 0) - (p.anticipos || 0) - (p.otrosDesc || 0);
            });
            recalcularResumenes();
        }
        setCfgAbierta(false);
        setTick((t) => t + 1);
        const msg = vigenciaEsEsteMesOAnterior
            ? `Salarios actualizados y aplicados a la planilla de ${yyyyMmATexto(vigenciaMes)}`
            : `Salarios registrados. Se aplicaran a la planilla de ${yyyyMmATexto(vigenciaMes)}`;
        setSnack({ open: true, msg, sev: 'success' });
    };

    // --- Ver detalle ---
    const verDetalle = () => {
        setDetalleAbierto(true);
        cerrarMenu();
    };
    const empDet = filaSel;

    // Historial salarial relevante al empleado: cambios del cargo que ocupa,
    // filtrados a partir del mes en que ingreso al edificio y ordenados cronologicamente.
    const historialSalarial = useMemo(() => {
        if (!empDet) return [];
        const partes = (empDet.fechaIngreso || '').split('/').map(Number);
        const y = partes[2];
        const m = partes[1];
        const mesIngreso = y && m ? `${y}-${String(m).padStart(2, '0')}` : '0000-01';
        return HISTORIAL_SALARIOS_CARGO
            .filter((h) => h.cargo === empDet.cargo && h.vigenciaMes >= mesIngreso)
            .sort((a, b) => a.vigenciaMes.localeCompare(b.vigenciaMes));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [empDet, tick]);

    // --- Editar estado ---
    const abrirEditarEstado = () => {
        setEstadoDraft(filaSel?.estado || 'Activo');
        setMotivoBaja({ motivo: filaSel?.motivoBaja?.motivo || 'Renuncia', detalle: filaSel?.motivoBaja?.detalle || '' });
        setEditarEstadoAbierto(true);
        cerrarMenu();
    };
    const guardarEstado = () => {
        const emp = EMPLEADOS_MOCK.find((e) => e.id === filaSel.id);
        if (emp && emp.estado !== estadoDraft) {
            emp.estado = estadoDraft;
            // Fecha de baja: desde el mes en curso ya no entra en la planilla.
            // Si se reactiva, se borra y vuelve a entrar.
            if (estadoDraft === 'Inactivo') {
                const h = new Date();
                emp.fechaBaja = `${String(h.getDate()).padStart(2, '0')}/${String(h.getMonth() + 1).padStart(2, '0')}/${h.getFullYear()}`;
                emp.motivoBaja = { motivo: motivoBaja.motivo, detalle: motivoBaja.detalle.trim() };
            } else {
                delete emp.fechaBaja;
                delete emp.motivoBaja;
            }
            // Si tenia cuenta (Administrador), se desactiva o reactiva con el empleado
            sincronizarCuentaConEmpleado(emp);
            const cuenta = asegurarCuentaAdministrador(emp);
            if (cuenta) setCredenciales(cuenta);
        }
        setEditarEstadoAbierto(false);
        setTick((t) => t + 1);
        setSnack({ open: true, msg: `Estado de ${filaSel.nombre} cambiado a ${estadoDraft}`, sev: 'success' });
    };

    const vigenciaEsFuturo = vigenciaMes > mesHoyYYYYMM();

    return (
        <DashboardLayout>
            {/* Encabezado */}
            <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Empleados</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Catalogo del personal del edificio y configuracion de salarios por cargo.
            </Typography>

            {/* Barra de acciones (al nivel de Expensas) */}
            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: { xs: 'stretch', md: 'flex-end' }, flexWrap: 'wrap', mb: 2 }}>
                <Button variant="outlined" startIcon={<SettingsIcon />} onClick={abrirConfig}
                    sx={{ color: '#1a2733', borderColor: '#cdd8e3', width: { xs: '100%', md: 'auto' } }}>
                    Configuracion de salarios
                </Button>
                <Button variant="contained" startIcon={<PersonAddIcon />} onClick={abrirNuevo}
                    sx={{ width: { xs: '100%', md: 'auto' } }}>
                    Nuevo empleado
                </Button>
            </Box>

            {/* Filtros con labels (color gris) */}
            <Paper sx={{ p: 2, borderRadius: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <Box sx={{ flex: 2, minWidth: 220 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, color: '#132B3E' }}>Buscar</Typography>
                        <TextField fullWidth size="small" placeholder="Nombre, CI o cargo"
                            value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
                                    )
                                }
                            }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 160 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, color: '#132B3E' }}>Cargo</Typography>
                        <Select fullWidth size="small" value={cargo} onChange={(e) => setCargo(e.target.value)}>
                            <MenuItem value="Todos">Todos los cargos</MenuItem>
                            {CARGOS.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                        </Select>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 140 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, color: '#132B3E' }}>Estado</Typography>
                        <Select fullWidth size="small" value={estado} onChange={(e) => setEstado(e.target.value)}>
                            {ESTADOS_EMPLEADO.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                        </Select>
                    </Box>
                </Box>
            </Paper>

            {/* Tabla de empleados */}
            <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Personal registrado</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {empleados.length} {empleados.length === 1 ? 'empleado' : 'empleados'}
                    </Typography>
                </Box>
                <Box sx={{ overflowX: 'auto' }}>
                    <Table size="small" sx={{ minWidth: 820 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#F1F5FA' }}>
                                <TableCell><strong>Codigo</strong></TableCell>
                                <TableCell><strong>Nombre</strong></TableCell>
                                <TableCell><strong>CI</strong></TableCell>
                                <TableCell><strong>Cargo</strong></TableCell>
                                <TableCell><strong>Salario base</strong></TableCell>
                                <TableCell><strong>Fecha ingreso</strong></TableCell>
                                <TableCell><strong>Estado</strong></TableCell>
                                <TableCell align="center"><strong>Acciones</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {empleados.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                                        No hay empleados que coincidan con los filtros.
                                    </TableCell>
                                </TableRow>
                            ) : empleados.map((e) => (
                                <TableRow key={e.id}>
                                    <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>{e.id}</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>
                                        {e.nombre}
                                        {usuarioDeEmpleado(e.id) && (
                                            <Typography variant="caption" color="primary.main" sx={{ display: 'block', fontWeight: 600 }}>
                                                Usuario del sistema: {usuarioDeEmpleado(e.id).username}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>{e.ci}</TableCell>
                                    <TableCell>{e.cargo}</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>{formatBs(e.salarioBase)}</TableCell>
                                    <TableCell>{e.fechaIngreso}</TableCell>
                                    <TableCell><Chip label={e.estado} size="small" sx={estadoChipSx(e.estado)} /></TableCell>
                                    <TableCell align="center">
                                        <IconButton size="small" onClick={(ev) => abrirMenu(ev, e)}>
                                            <MoreVertIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Box>
            </Paper>

            {/* Menu de acciones por fila */}
            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={cerrarMenu}>
                <MenuItem onClick={verDetalle}>
                    <VisibilityIcon fontSize="small" sx={{ mr: 1, color: '#1F5F8B' }} />
                    Ver detalle
                </MenuItem>
                <MenuItem onClick={abrirEditarEstado}>
                    <SwapHorizIcon fontSize="small" sx={{ mr: 1, color: '#B6802A' }} />
                    {filaSel?.estado === 'Activo' ? 'Dar de baja' : 'Reactivar'}
                </MenuItem>
                <MenuItem onClick={abrirEditar}>
                    <EditIcon fontSize="small" sx={{ mr: 1, color: '#1F5F8B' }} />
                    Editar informacion
                </MenuItem>
                <Tooltip placement="left"
                    title={filaSel && empleadoTieneHistorial(filaSel.id) ? 'Tiene planilla o pagos: usa "Dar de baja"' : ''}>
                    <span>
                        <MenuItem onClick={abrirEliminar} disabled={!filaSel || empleadoTieneHistorial(filaSel.id)}>
                            <DeleteIcon fontSize="small" sx={{ mr: 1, color: '#D9534F' }} />
                            Eliminar
                        </MenuItem>
                    </span>
                </Tooltip>
            </Menu>

            {/* Ficha del empleado: registrar o editar (se monta de nuevo cada vez) */}
            {formAbierto && (
                <EmpleadoForm key={empEditar?.id ?? 'nuevo'} open={formAbierto} empleado={empEditar}
                    onClose={() => setFormAbierto(false)} onGuardar={guardarEmpleado} />
            )}

            {/* Cuenta creada para el Administrador */}
            <Dialog open={!!credenciales} onClose={() => setCredenciales(null)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 700 }}>
                    <KeyIcon color="primary" /> Cuenta de usuario creada
                </DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Como es <strong>Administrador</strong>, se le creo una cuenta para entrar al sistema.
                    </Typography>
                    <Box sx={{ bgcolor: '#F3F6FA', borderRadius: 2, p: 2, mb: 2 }}>
                        <Typography variant="body2">Usuario: <strong>{credenciales?.usuario.username}</strong></Typography>
                        <Typography variant="body2">Contraseña temporal: <strong>{credenciales?.password}</strong></Typography>
                    </Box>
                    <Alert severity="info" icon={false} sx={{ bgcolor: '#E4EEF5', color: 'text.primary' }}>
                        <Typography variant="body2">
                            Se envio a <strong>{credenciales?.usuario.email}</strong>
                            {credenciales?.usuario.celular ? <> y por SMS a <strong>+591 {credenciales.usuario.celular}</strong></> : null}.
                            Al entrar por primera vez debera cambiar la contraseña.
                        </Typography>
                        <Typography variant="caption" color="text.secondary">(Envio simulado: lo hara el backend.)</Typography>
                    </Alert>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button variant="contained" onClick={() => setCredenciales(null)}>Entendido</Button>
                </DialogActions>
            </Dialog>

            {/* Eliminar empleado (solo registrado por error) */}
            <Dialog open={eliminarAbierto} onClose={() => setEliminarAbierto(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Eliminar empleado</DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2">
                        ¿Eliminar a <strong>{filaSel?.nombre}</strong> ({filaSel?.id})? Usalo solo si se registro por error;
                        si el empleado dejo de trabajar, usa <strong>Dar de baja</strong> para conservar su historial.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button variant="outlined" onClick={() => setEliminarAbierto(false)}>Cancelar</Button>
                    <Button variant="contained" color="error" onClick={confirmarEliminar}>Eliminar</Button>
                </DialogActions>
            </Dialog>

            {/* ============================================================ */}
            {/* Dialog: Configuracion de salarios por cargo                  */}
            {/* ============================================================ */}
            <Dialog open={cfgAbierta} onClose={() => setCfgAbierta(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 700 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#E4EEF5', color: 'primary.main', display: 'grid', placeItems: 'center' }}>
                        <SettingsIcon fontSize="small" />
                    </Box>
                    Configuracion de salarios por cargo
                </DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Define el salario base mensual para cada cargo y desde que mes rige el cambio.
                    </Typography>

                    {CARGOS.map((c) => {
                        const cantidad = EMPLEADOS_MOCK.filter((e) => e.cargo === c).length;
                        return (
                            <Box key={c} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                                <Box sx={{ flex: 1, minWidth: 160 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{c}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {cantidad} {cantidad === 1 ? 'empleado' : 'empleados'}
                                    </Typography>
                                </Box>
                                <TextField size="small" type="number" value={tarifasDraft[c] ?? ''}
                                    onChange={(e) => cambiarTarifa(c, e.target.value)}
                                    sx={{ width: 160 }}
                                    slotProps={{
                                        input: {
                                            startAdornment: (
                                                <InputAdornment position="start">Bs</InputAdornment>
                                            )
                                        }
                                    }} />
                            </Box>
                        );
                    })}

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: 1, minWidth: 160 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Vigente desde</Typography>
                            <TextField fullWidth size="small" type="month"
                                value={vigenciaMes} onChange={(e) => setVigenciaMes(e.target.value)}
                                slotProps={{ inputLabel: { shrink: true } }} />
                        </Box>
                        <Box sx={{ flex: 2, minWidth: 220 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Razon del cambio (opcional)</Typography>
                            <TextField fullWidth size="small" value={razonCambio}
                                onChange={(e) => setRazonCambio(e.target.value)}
                                placeholder="Ej. Ajuste salarial anual" />
                        </Box>
                    </Box>

                    <Alert severity={vigenciaEsFuturo ? 'info' : 'warning'} icon={false}
                        sx={{
                            bgcolor: vigenciaEsFuturo ? '#E4EEF5' : '#FDF0D5',
                            color: vigenciaEsFuturo ? 'text.primary' : '#8A5A00'
                        }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                            {vigenciaEsFuturo
                                ? `Aplicara desde ${yyyyMmATexto(vigenciaMes)}`
                                : `Aplicara al toque en la planilla de ${yyyyMmATexto(vigenciaMes)}`}
                        </Typography>
                        <Typography variant="body2">
                            {vigenciaEsFuturo
                                ? 'La planilla y los pagos del mes actual no se modifican. Los nuevos valores se usan cuando se genere la planilla del mes elegido.'
                                : 'Se actualizara el salario base de cada empleado y se recalculara el neto de la planilla de este periodo. Los pagos ya ejecutados no se modifican.'}
                        </Typography>
                    </Alert>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button variant="outlined" onClick={() => setCfgAbierta(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={guardarConfig}>Guardar configuracion</Button>
                </DialogActions>
            </Dialog>

            {/* ============================================================ */}
            {/* Dialog: Ver detalle del empleado                             */}
            {/* ============================================================ */}
            <Dialog open={detalleAbierto} onClose={() => setDetalleAbierto(false)} maxWidth="md" fullWidth>
                {empDet && (
                    <>
                        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 700 }}>
                            <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#E4EEF5', color: 'primary.main', display: 'grid', placeItems: 'center' }}>
                                <BadgeIcon fontSize="small" />
                            </Box>
                            {empDet.nombre}
                            <Chip label={empDet.id} size="small" sx={{ ml: 1, bgcolor: '#E4EEF5', color: 'primary.main', fontWeight: 700 }} />
                        </DialogTitle>
                        <DialogContent dividers>
                            {/* Datos basicos */}
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5, mb: 2 }}>
                                <Box sx={{ bgcolor: '#E4EEF5', p: 1.5, borderRadius: 2 }}>
                                    <Typography variant="caption" color="text.secondary">Cargo</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{empDet.cargo}</Typography>
                                </Box>
                                <Box sx={{ bgcolor: '#E4EEF5', p: 1.5, borderRadius: 2 }}>
                                    <Typography variant="caption" color="text.secondary">Carnet de identidad</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{empDet.ci}</Typography>
                                </Box>
                                <Box sx={{ bgcolor: '#E4EEF5', p: 1.5, borderRadius: 2 }}>
                                    <Typography variant="caption" color="text.secondary">Estado</Typography>
                                    <Chip label={empDet.estado} size="small" sx={{ ...estadoChipSx(empDet.estado), mt: 0.5 }} />
                                </Box>
                                <Box sx={{ bgcolor: '#E4F4EE', p: 1.5, borderRadius: 2 }}>
                                    <Typography variant="caption" color="text.secondary">Salario base</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#2E9D78' }}>{formatBs(empDet.salarioBase)}</Typography>
                                </Box>
                                <Box sx={{ bgcolor: '#FDF0D5', p: 1.5, borderRadius: 2 }}>
                                    <Typography variant="caption" color="text.secondary">Fecha de ingreso</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#B6802A' }}>{empDet.fechaIngreso}</Typography>
                                </Box>
                                <Box sx={{ bgcolor: '#FDF0D5', p: 1.5, borderRadius: 2 }}>
                                    <Typography variant="caption" color="text.secondary">Tiempo en el edificio</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#B6802A' }}>
                                        {mesesEnElEdificio(empDet.fechaIngreso)} meses
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Ficha: datos personales, contacto y experiencia */}
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1, mb: 2 }}>
                                {[
                                    ['CI', `${empDet.ci}${empDet.complemento ? `-${empDet.complemento}` : ''} ${empDet.expedido || ''}`],
                                    ['Fecha de nacimiento', empDet.fechaNacimiento ? empDet.fechaNacimiento.split('-').reverse().join('/') : '—'],
                                    ['Celular', empDet.celular ? `+591 ${empDet.celular}` : '—'],
                                    ['Telefono fijo', empDet.telefono ? `+591 ${empDet.telefono}` : '—'],
                                    ['Correo', empDet.correo || '—'],
                                    ['Direccion', empDet.direccion || '—'],
                                    ['Tipo de contrato', empDet.tipoContrato || '—'],
                                    ['Contacto de emergencia', empDet.contactoEmergencia
                                        ? `${empDet.contactoEmergencia.nombre} · +591 ${empDet.contactoEmergencia.celular}` : '—'],
                                    ['Usuario del sistema', usuarioDeEmpleado(empDet.id)
                                        ? `${usuarioDeEmpleado(empDet.id).username} (${usuarioDeEmpleado(empDet.id).activo ? 'activo' : 'desactivado'})` : 'No tiene'],
                                    ...(empDet.motivoBaja ? [['Baja', `${empDet.fechaBaja} · ${empDet.motivoBaja.motivo}${empDet.motivoBaja.detalle ? ` — ${empDet.motivoBaja.detalle}` : ''}`]] : []),
                                ].map(([k, v]) => (
                                    <Box key={k} sx={{ borderBottom: '1px solid #EEF2F6', py: 0.5 }}>
                                        <Typography variant="caption" color="text.secondary">{k}</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-word' }}>{v}</Typography>
                                    </Box>
                                ))}
                            </Box>
                            {(empDet.experiencia || empDet.cv) && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>Experiencia</Typography>
                                    {empDet.experiencia && <Typography variant="body2" sx={{ mb: 1 }}>{empDet.experiencia}</Typography>}
                                    {empDet.cv && (
                                        <Chip icon={<PictureAsPdfIcon />} label={empDet.cv.name}
                                            onClick={empDet.cv.url ? () => window.open(empDet.cv.url, '_blank') : undefined}
                                            sx={{ bgcolor: '#E4EEF5', color: '#1F5F8B', fontWeight: 600 }} />
                                    )}
                                </Box>
                            )}

                            {/* Historial salarial del cargo (filtrado desde la fecha de ingreso) */}
                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
                                Historial salarial — Cargo {empDet.cargo} ({historialSalarial.length})
                            </Typography>
                            <Box sx={{ overflowX: 'auto', mb: 2 }}>
                                <Table size="small" sx={{ minWidth: 500 }}>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: '#F1F5FA' }}>
                                            <TableCell><strong>Vigente desde</strong></TableCell>
                                            <TableCell><strong>Salario anterior</strong></TableCell>
                                            <TableCell><strong>Salario nuevo</strong></TableCell>
                                            <TableCell><strong>Variacion</strong></TableCell>
                                            <TableCell><strong>Razon</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {historialSalarial.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center" sx={{ color: 'text.secondary', py: 2 }}>
                                                    Sin modificaciones salariales registradas para este cargo desde el ingreso del empleado.
                                                </TableCell>
                                            </TableRow>
                                        ) : historialSalarial.map((h, idx) => {
                                            const diff = (h.salarioAnterior != null) ? (h.salarioNuevo - h.salarioAnterior) : null;
                                            return (
                                                <TableRow key={h.id || `hs-${idx}`}>
                                                    <TableCell sx={{ fontWeight: 600 }}>{yyyyMmATexto(h.vigenciaMes)}</TableCell>
                                                    <TableCell>{h.salarioAnterior != null ? formatBs(h.salarioAnterior) : '—'}</TableCell>
                                                    <TableCell sx={{ fontWeight: 700, color: '#2E9D78' }}>{formatBs(h.salarioNuevo)}</TableCell>
                                                    <TableCell sx={{ color: diff == null ? 'text.secondary' : (diff >= 0 ? '#2E9D78' : '#D9534F'), fontWeight: 600 }}>
                                                        {diff == null ? '—' : (diff >= 0 ? `+ ${formatBs(diff)}` : `− ${formatBs(Math.abs(diff))}`)}
                                                    </TableCell>
                                                    <TableCell sx={{ color: 'text.secondary' }}>{h.razon}</TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </Box>

                        </DialogContent>
                        <DialogActions sx={{ p: 2 }}>
                            <Button variant="contained" onClick={() => setDetalleAbierto(false)}>Cerrar</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* ============================================================ */}
            {/* Dialog: Editar estado del empleado                           */}
            {/* ============================================================ */}
            <Dialog open={editarEstadoAbierto} onClose={() => setEditarEstadoAbierto(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 700 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#FDF0D5', color: '#B6802A', display: 'grid', placeItems: 'center' }}>
                        <SwapHorizIcon fontSize="small" />
                    </Box>
                    Editar estado
                </DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Cambia el estado de <strong>{filaSel?.nombre}</strong> ({filaSel?.cargo}).
                        Si lo pasas a <strong>Inactivo</strong>, deja de aparecer en la planilla desde el mes en curso
                        ({periodoEnCurso()}). Los meses que ya trabajo y no se le pagaron siguen pendientes y se le pueden pagar.
                        Si lo reactivas, vuelve a entrar en la planilla.
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Estado</Typography>
                    <Select fullWidth size="small" value={estadoDraft} onChange={(e) => setEstadoDraft(e.target.value)}>
                        <MenuItem value="Activo">Activo</MenuItem>
                        <MenuItem value="Inactivo">Inactivo (dar de baja)</MenuItem>
                    </Select>
                    {estadoDraft === 'Inactivo' && filaSel?.estado === 'Activo' && (
                        <>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, mt: 2 }}>Motivo de la baja</Typography>
                            <Select fullWidth size="small" value={motivoBaja.motivo}
                                onChange={(e) => setMotivoBaja((m) => ({ ...m, motivo: e.target.value }))}>
                                {MOTIVOS_BAJA.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                            </Select>
                            <TextField fullWidth size="small" multiline minRows={2} sx={{ mt: 1.5 }}
                                placeholder="Detalle (opcional). Ej. Presento su renuncia el 05/11/2026"
                                value={motivoBaja.detalle} slotProps={{ htmlInput: { maxLength: 200 } }}
                                onChange={(e) => setMotivoBaja((m) => ({ ...m, detalle: e.target.value }))} />
                            {usuarioDeEmpleado(filaSel?.id) && (
                                <Alert severity="warning" sx={{ mt: 1.5 }}>
                                    Su cuenta <strong>{usuarioDeEmpleado(filaSel.id).username}</strong> quedara desactivada.
                                </Alert>
                            )}
                        </>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button variant="outlined" onClick={() => setEditarEstadoAbierto(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={guardarEstado}>Guardar estado</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snack.open} autoHideDuration={2500} onClose={() => setSnack({ ...snack, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity={snack.sev} onClose={() => setSnack({ ...snack, open: false })} sx={{ width: '100%' }}>
                    {snack.msg}
                </Alert>
            </Snackbar>
        </DashboardLayout>
    );
}