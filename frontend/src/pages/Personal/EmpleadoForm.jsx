import { useState } from 'react';
import {
    Box, Typography, TextField, Select, MenuItem, Button, Alert, InputAdornment, IconButton, Tooltip, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions, Divider,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import {
    CARGOS, EXPEDIDOS, TIPOS_CONTRATO, EMPLEADOS_MOCK, salarioDesdeCargo, registrarCargo,
} from '../../constants/personalMock';
import { formatBs } from '../../constants/finanzasMock';

// ------------------------------------------------------------
//  Ficha del empleado: datos personales, contacto, datos laborales y experiencia.
//  Se usa para registrar y para editar (si recibe "empleado").
//  Las fechas del formulario van en formato del input date (AAAA-MM-DD);
//  la fecha de ingreso se guarda como DD/MM/AAAA, igual que el resto del sistema.
// ------------------------------------------------------------

const LIMITES = { nombres: 60, apellidos: 60, correo: 150, direccion: 150, experiencia: 500, contacto: 80 };
const SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü' ]+$/;
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const CELULAR_BO = /^[67]\d{7}$/; // Bolivia: 8 digitos, empieza con 6 o 7

const dmyAIso = (dmy) => {
    const [d, m, a] = String(dmy || '').split('/');
    return a ? `${a}-${m.padStart(2, '0')}-${d.padStart(2, '0')}` : '';
};
const isoADmy = (iso) => {
    const [a, m, d] = String(iso || '').split('-');
    return d ? `${d}/${m}/${a}` : '';
};
const hoyIso = () => {
    const h = new Date();
    return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}-${String(h.getDate()).padStart(2, '0')}`;
};
const edad = (iso) => {
    if (!iso) return 0;
    const n = new Date(`${iso}T00:00:00`); const h = new Date();
    let e = h.getFullYear() - n.getFullYear();
    if (h.getMonth() < n.getMonth() || (h.getMonth() === n.getMonth() && h.getDate() < n.getDate())) e -= 1;
    return e;
};

const desdeEmpleado = (e) => ({
    nombres: e?.nombres ?? '', apellidos: e?.apellidos ?? '',
    ci: e?.ci ?? '', complemento: e?.complemento ?? '', expedido: e?.expedido ?? 'CB',
    fechaNacimiento: e?.fechaNacimiento ?? '',
    celular: e?.celular ?? '', telefono: e?.telefono ?? '', correo: e?.correo ?? '', direccion: e?.direccion ?? '',
    cargo: e?.cargo ?? 'Portero', fechaIngreso: e ? dmyAIso(e.fechaIngreso) : hoyIso(),
    tipoContrato: e?.tipoContrato ?? 'Indefinido',
    emergenciaNombre: e?.contactoEmergencia?.nombre ?? '', emergenciaCelular: e?.contactoEmergencia?.celular ?? '',
    experiencia: e?.experiencia ?? '', cv: e?.cv ?? null,
});

// Titulo de seccion
const Seccion = ({ children }) => (
    <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main', mt: 1, mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {children}
    </Typography>
);

// Campo con etiqueta arriba
function Campo({ label, ancho = 1, ...props }) {
    return (
        <Box sx={{ flex: ancho, minWidth: 160 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>{label}</Typography>
            <TextField fullWidth size="small" {...props} />
        </Box>
    );
}

const Fila = ({ children }) => (
    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexDirection: { xs: 'column', sm: 'row' } }}>{children}</Box>
);

export default function EmpleadoForm({ open, empleado, onClose, onGuardar }) {
    const editando = !!empleado;
    const [form, setForm] = useState(() => desdeEmpleado(empleado));
    const [errores, setErrores] = useState({});
    const [, setTick] = useState(0);

    // Nuevo cargo (boton "+" al lado del selector)
    const [cargoAbierto, setCargoAbierto] = useState(false);
    const [cargoNuevo, setCargoNuevo] = useState({ nombre: '', salario: '' });
    const [cargoError, setCargoError] = useState('');

    const cambiar = (campo, valor) => {
        setForm((f) => ({ ...f, [campo]: valor }));
        setErrores((e) => ({ ...e, [campo]: '' }));
    };
    const soloDigitos = (campo, max) => (e) => cambiar(campo, e.target.value.replace(/\D/g, '').slice(0, max));

    const elegirCv = (e) => {
        const file = e.target.files && e.target.files[0];
        e.target.value = '';
        if (!file) return;
        if (file.type !== 'application/pdf') { setErrores((er) => ({ ...er, cv: 'El curriculum debe ser PDF' })); return; }
        if (file.size > 5 * 1024 * 1024) { setErrores((er) => ({ ...er, cv: 'El archivo supera 5 MB' })); return; }
        cambiar('cv', { name: file.name, type: file.type, url: URL.createObjectURL(file) });
    };

    const validar = () => {
        const e = {};
        const t = (v) => String(v || '').trim();
        if (!t(form.nombres)) e.nombres = 'Obligatorio';
        else if (!SOLO_LETRAS.test(t(form.nombres))) e.nombres = 'Solo letras';
        if (!t(form.apellidos)) e.apellidos = 'Obligatorio';
        else if (!SOLO_LETRAS.test(t(form.apellidos))) e.apellidos = 'Solo letras';
        if (!/^\d{5,10}$/.test(form.ci)) e.ci = 'Entre 5 y 10 digitos';
        else if (EMPLEADOS_MOCK.some((x) => x.ci === form.ci && x.complemento === t(form.complemento).toUpperCase() && x.id !== empleado?.id)) {
            e.ci = 'Ya existe un empleado con este CI';
        }
        if (t(form.complemento) && !/^[0-9A-Za-z]{1,2}$/.test(t(form.complemento))) e.complemento = '1 o 2 caracteres';
        if (!form.fechaNacimiento) e.fechaNacimiento = 'Obligatorio';
        else if (edad(form.fechaNacimiento) < 18) e.fechaNacimiento = 'Debe ser mayor de 18 años';
        else if (edad(form.fechaNacimiento) > 80) e.fechaNacimiento = 'Revisa la fecha';
        if (!CELULAR_BO.test(form.celular)) e.celular = '8 digitos, empieza con 6 o 7';
        if (form.telefono && !/^\d{7,8}$/.test(form.telefono)) e.telefono = '7 u 8 digitos';
        if (!CORREO.test(t(form.correo))) e.correo = 'Correo no valido';
        if (!t(form.direccion)) e.direccion = 'Obligatorio';
        if (!form.cargo) e.cargo = 'Obligatorio';
        if (!form.fechaIngreso) e.fechaIngreso = 'Obligatorio';
        else if (form.fechaIngreso > hoyIso()) e.fechaIngreso = 'No puede ser una fecha futura';
        if (t(form.emergenciaNombre) && !CELULAR_BO.test(form.emergenciaCelular)) e.emergenciaCelular = 'Celular no valido';
        if (!t(form.emergenciaNombre) && form.emergenciaCelular) e.emergenciaNombre = 'Escribe el nombre';
        setErrores(e);
        return Object.keys(e).length === 0;
    };

    const guardar = () => {
        if (!validar()) return;
        const t = (v) => String(v || '').trim();
        onGuardar({
            nombres: t(form.nombres), apellidos: t(form.apellidos), nombre: `${t(form.nombres)} ${t(form.apellidos)}`,
            ci: form.ci, complemento: t(form.complemento).toUpperCase(), expedido: form.expedido,
            fechaNacimiento: form.fechaNacimiento,
            celular: form.celular, telefono: form.telefono, correo: t(form.correo).toLowerCase(), direccion: t(form.direccion),
            cargo: form.cargo, fechaIngreso: isoADmy(form.fechaIngreso), tipoContrato: form.tipoContrato,
            contactoEmergencia: t(form.emergenciaNombre) ? { nombre: t(form.emergenciaNombre), celular: form.emergenciaCelular } : null,
            experiencia: t(form.experiencia), cv: form.cv,
        });
    };

    const guardarCargo = () => {
        const err = registrarCargo(cargoNuevo.nombre, cargoNuevo.salario);
        if (err) { setCargoError(err); return; }
        cambiar('cargo', cargoNuevo.nombre.trim());
        setCargoNuevo({ nombre: '', salario: '' }); setCargoError(''); setCargoAbierto(false);
        setTick((x) => x + 1);
    };

    const err = (c) => ({ error: !!errores[c], helperText: errores[c] || ' ' });

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 700 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#E4EEF5', color: 'primary.main', display: 'grid', placeItems: 'center' }}>
                        {editando ? <EditIcon fontSize="small" /> : <PersonAddIcon fontSize="small" />}
                    </Box>
                    {editando ? `Editar empleado · ${empleado.id}` : 'Nuevo empleado'}
                </DialogTitle>
                <DialogContent dividers>
                    <Seccion>Datos personales</Seccion>
                    <Fila>
                        <Campo label="Nombres *" placeholder="Ej. Luisa Maria" value={form.nombres}
                            slotProps={{ htmlInput: { maxLength: LIMITES.nombres } }}
                            onChange={(e) => cambiar('nombres', e.target.value)} {...err('nombres')} />
                        <Campo label="Apellidos *" placeholder="Ej. Fernandez Rojas" value={form.apellidos}
                            slotProps={{ htmlInput: { maxLength: LIMITES.apellidos } }}
                            onChange={(e) => cambiar('apellidos', e.target.value)} {...err('apellidos')} />
                    </Fila>
                    <Fila>
                        <Campo label="Carnet de identidad *" placeholder="Ej. 9876543" value={form.ci} ancho={2}
                            slotProps={{ htmlInput: { inputMode: 'numeric' } }}
                            onChange={soloDigitos('ci', 10)} {...err('ci')} />
                        <Campo label="Complemento" placeholder="Ej. 1A" value={form.complemento}
                            slotProps={{ htmlInput: { maxLength: 2 } }}
                            onChange={(e) => cambiar('complemento', e.target.value.toUpperCase())} {...err('complemento')} />
                        <Box sx={{ flex: 1, minWidth: 120 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Expedido en *</Typography>
                            <Select fullWidth size="small" value={form.expedido} onChange={(e) => cambiar('expedido', e.target.value)}>
                                {EXPEDIDOS.map((x) => <MenuItem key={x} value={x}>{x}</MenuItem>)}
                            </Select>
                        </Box>
                        <Campo label="Fecha de nacimiento *" type="date" value={form.fechaNacimiento} ancho={2}
                            slotProps={{ htmlInput: { max: hoyIso() } }}
                            onChange={(e) => cambiar('fechaNacimiento', e.target.value)} {...err('fechaNacimiento')} />
                    </Fila>

                    <Divider sx={{ mb: 1 }} />
                    <Seccion>Contacto</Seccion>
                    <Fila>
                        <Campo label="Celular *" placeholder="71234567" value={form.celular}
                            slotProps={{ input: { startAdornment: <InputAdornment position="start">+591</InputAdornment> }, htmlInput: { inputMode: 'numeric' } }}
                            onChange={soloDigitos('celular', 8)} {...err('celular')} />
                        <Campo label="Telefono fijo (opcional)" placeholder="4456789" value={form.telefono}
                            slotProps={{ input: { startAdornment: <InputAdornment position="start">+591</InputAdornment> }, htmlInput: { inputMode: 'numeric' } }}
                            onChange={soloDigitos('telefono', 8)} {...err('telefono')} />
                        <Campo label="Correo electronico *" placeholder="nombre@correo.com" value={form.correo} ancho={1.5}
                            slotProps={{ htmlInput: { maxLength: LIMITES.correo } }}
                            onChange={(e) => cambiar('correo', e.target.value.trim())} {...err('correo')} />
                    </Fila>
                    <Fila>
                        <Campo label="Direccion de domicilio *" placeholder="Ej. Av. Ayacucho 1450, Cochabamba" value={form.direccion}
                            slotProps={{ htmlInput: { maxLength: LIMITES.direccion } }}
                            onChange={(e) => cambiar('direccion', e.target.value)} {...err('direccion')} />
                    </Fila>
                    <Fila>
                        <Campo label="Contacto de emergencia (opcional)" placeholder="Ej. Rosa Quispe (madre)" value={form.emergenciaNombre} ancho={1.5}
                            slotProps={{ htmlInput: { maxLength: LIMITES.contacto } }}
                            onChange={(e) => cambiar('emergenciaNombre', e.target.value)} {...err('emergenciaNombre')} />
                        <Campo label="Celular de emergencia" placeholder="71234567" value={form.emergenciaCelular}
                            slotProps={{ input: { startAdornment: <InputAdornment position="start">+591</InputAdornment> }, htmlInput: { inputMode: 'numeric' } }}
                            onChange={soloDigitos('emergenciaCelular', 8)} {...err('emergenciaCelular')} />
                    </Fila>

                    <Divider sx={{ mb: 1 }} />
                    <Seccion>Datos laborales</Seccion>
                    <Fila>
                        <Box sx={{ flex: 1.5, minWidth: 200 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Cargo *</Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Select fullWidth size="small" value={form.cargo} onChange={(e) => cambiar('cargo', e.target.value)}>
                                    {CARGOS.map((c) => <MenuItem key={c} value={c}>{c} · {formatBs(salarioDesdeCargo(c))}</MenuItem>)}
                                </Select>
                                <Tooltip title="Nuevo cargo">
                                    <IconButton color="primary" onClick={() => setCargoAbierto(true)}
                                        sx={{ border: '1px solid', borderColor: 'primary.main', borderRadius: 2 }}>
                                        <AddIcon />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Box>
                        <Campo label="Fecha de ingreso *" type="date" value={form.fechaIngreso}
                            slotProps={{ htmlInput: { max: hoyIso() } }}
                            onChange={(e) => cambiar('fechaIngreso', e.target.value)} {...err('fechaIngreso')} />
                        <Box sx={{ flex: 1, minWidth: 160 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Tipo de contrato *</Typography>
                            <Select fullWidth size="small" value={form.tipoContrato} onChange={(e) => cambiar('tipoContrato', e.target.value)}>
                                {TIPOS_CONTRATO.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                            </Select>
                        </Box>
                    </Fila>
                    <Alert severity="info" icon={false} sx={{ bgcolor: '#E4EEF5', color: 'text.primary', mb: 2 }}>
                        <Typography variant="body2">
                            Salario base del cargo: <strong>{formatBs(salarioDesdeCargo(form.cargo))}</strong>.
                            Entra en la planilla desde el mes de su fecha de ingreso.
                            {form.cargo === 'Administrador' && ' Como Administrador, se le creara una cuenta para entrar al sistema.'}
                        </Typography>
                    </Alert>

                    <Divider sx={{ mb: 1 }} />
                    <Seccion>Experiencia</Seccion>
                    <TextField fullWidth size="small" multiline minRows={3} value={form.experiencia}
                        placeholder="Formacion, trabajos anteriores, cursos..."
                        slotProps={{ htmlInput: { maxLength: LIMITES.experiencia } }}
                        helperText={`${form.experiencia.length}/${LIMITES.experiencia}`}
                        onChange={(e) => cambiar('experiencia', e.target.value)} sx={{ mb: 1.5 }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                        <Button component="label" variant="outlined" startIcon={<UploadFileIcon />}
                            sx={{ color: '#1a2733', borderColor: '#cdd8e3' }}>
                            {form.cv ? 'Cambiar curriculum' : 'Adjuntar curriculum (PDF)'}
                            <input hidden type="file" accept="application/pdf" onChange={elegirCv} />
                        </Button>
                        {form.cv && (
                            <Chip icon={<PictureAsPdfIcon />} label={form.cv.name}
                                onClick={form.cv.url ? () => window.open(form.cv.url, '_blank') : undefined}
                                onDelete={() => cambiar('cv', null)}
                                sx={{ bgcolor: '#E4EEF5', color: '#1F5F8B', fontWeight: 600 }} />
                        )}
                        {errores.cv && <Typography variant="caption" color="error">{errores.cv}</Typography>}
                    </Box>

                    {Object.values(errores).some(Boolean) && (
                        <Alert severity="error" sx={{ mt: 2 }}>Revisa los campos marcados en rojo.</Alert>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button variant="outlined" onClick={onClose}>Cancelar</Button>
                    <Button variant="contained" onClick={guardar}>{editando ? 'Guardar cambios' : 'Registrar empleado'}</Button>
                </DialogActions>
            </Dialog>

            {/* Nuevo cargo */}
            <Dialog open={cargoAbierto} onClose={() => setCargoAbierto(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Nuevo cargo</DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Quedara disponible para todos los empleados y en la configuracion de salarios.
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Nombre del cargo</Typography>
                    <TextField fullWidth size="small" placeholder="Ej. Jardinero" value={cargoNuevo.nombre} autoFocus
                        slotProps={{ htmlInput: { maxLength: 40 } }}
                        onChange={(e) => { setCargoNuevo((c) => ({ ...c, nombre: e.target.value })); setCargoError(''); }} sx={{ mb: 2 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Salario base mensual</Typography>
                    <TextField fullWidth size="small" type="number" placeholder="0" value={cargoNuevo.salario}
                        slotProps={{ input: { startAdornment: <InputAdornment position="start">Bs</InputAdornment> }, htmlInput: { min: 0, step: 0.01 } }}
                        onKeyDown={(e) => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); }}
                        onChange={(e) => { setCargoNuevo((c) => ({ ...c, salario: e.target.value })); setCargoError(''); }} />
                    {cargoError && <Alert severity="error" sx={{ mt: 2 }}>{cargoError}</Alert>}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button variant="outlined" onClick={() => setCargoAbierto(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={guardarCargo}>Guardar cargo</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
