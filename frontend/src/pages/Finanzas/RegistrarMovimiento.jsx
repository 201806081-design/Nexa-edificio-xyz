import { useState } from 'react';
import {
    Box, Typography, Select, MenuItem, Paper, Button, TextField, Alert, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import NorthIcon from '@mui/icons-material/North';
import SouthIcon from '@mui/icons-material/South';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { CATEGORIAS } from '../../constants/movimientosMock';
import { formatBs } from '../../constants/finanzasMock';

const VACIO = { tipo: 'Ingreso', categoria: '', fecha: '', monto: '', descripcion: '', comprobante: '' };

export default function RegistrarMovimiento() {
    const navigate = useNavigate();
    const [form, setForm] = useState(VACIO);
    const [errores, setErrores] = useState({});
    const [mostrarAviso, setMostrarAviso] = useState(false);

    const cambiar = (campo, valor) => {
        setForm((f) => ({ ...f, [campo]: valor }));
        setErrores((e) => ({ ...e, [campo]: false }));
    };

    const validar = () => {
        const err = {};
        if (!form.categoria) err.categoria = true;
        if (!form.fecha) err.fecha = true;
        if (!(Number(form.monto) > 0)) err.monto = true;
        if (!form.descripcion.trim()) err.descripcion = true;
        setErrores(err);
        return Object.keys(err).length === 0;
    };

    const guardar = () => {
        if (!validar()) { setMostrarAviso(true); return; }
        // MOCK: aqui iria el POST al backend.
        navigate('/finanzas/ingresos-gastos', { state: { mensaje: 'Movimiento registrado correctamente' } });
    };

    const esIngreso = form.tipo === 'Ingreso';
    const colorTipo = esIngreso ? '#2E9D78' : '#D9534F';

    return (
        <DashboardLayout>
            <Typography variant="h1" color="primary.main" sx={{ mb: 0.5 }}>Registrar movimiento economico</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Finanzas / Ingresos y gastos / Registrar movimiento
            </Typography>

            <Paper sx={{ p: 4, borderRadius: 2 }}>
                {mostrarAviso && (
                    <Alert severity="error" sx={{ mb: 3 }}>Revisa los campos señalados antes de registrar el movimiento</Alert>
                )}

                {/* Tipo de movimiento */}
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Tipo de movimiento</Typography>
                <ToggleButtonGroup exclusive fullWidth value={form.tipo} onChange={(e, v) => v && cambiar('tipo', v)} sx={{ mb: 3 }}>
                    <ToggleButton value="Ingreso" sx={{ textTransform: 'none', fontWeight: 600, '&.Mui-selected': { bgcolor: '#E4F4EE', color: '#2E9D78', '&:hover': { bgcolor: '#D7EEE4' } } }}>
                        <NorthIcon sx={{ mr: 1 }} /> Ingresos
                    </ToggleButton>
                    <ToggleButton value="Gasto" sx={{ textTransform: 'none', fontWeight: 600, '&.Mui-selected': { bgcolor: '#FBEAE9', color: '#D9534F', '&:hover': { bgcolor: '#F6DAD8' } } }}>
                        <SouthIcon sx={{ mr: 1 }} /> Gastos
                    </ToggleButton>
                </ToggleButtonGroup>

                {/* Categoria + Fecha */}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                    <Box sx={{ flex: 1, minWidth: 220 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Categoria</Typography>
                        <Select fullWidth displayEmpty value={form.categoria} onChange={(e) => cambiar('categoria', e.target.value)} error={!!errores.categoria}>
                            <MenuItem value=""><em>Seleccione categoria</em></MenuItem>
                            {CATEGORIAS.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                        </Select>
                        {errores.categoria && <Typography sx={{ color: '#D9534F', fontSize: '0.76rem', mt: 0.5 }}>Seleccione una categoria</Typography>}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 220 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Fecha</Typography>
                        <TextField fullWidth type="date" value={form.fecha} onChange={(e) => cambiar('fecha', e.target.value)}
                            error={!!errores.fecha} helperText={errores.fecha && 'Seleccione una fecha'} InputLabelProps={{ shrink: true }} />
                    </Box>
                </Box>

                {/* Monto */}
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Monto (Bs)</Typography>
                    <TextField fullWidth type="number" placeholder="0" value={form.monto} onChange={(e) => cambiar('monto', e.target.value)}
                        error={!!errores.monto} helperText={errores.monto && 'Ingrese un monto mayor a 0'} />
                </Box>

                {/* Descripcion */}
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Descripcion</Typography>
                    <TextField fullWidth multiline minRows={2} value={form.descripcion} onChange={(e) => cambiar('descripcion', e.target.value)}
                        error={!!errores.descripcion} helperText={errores.descripcion && 'Ingrese una descripcion'} />
                </Box>

                {/* Comprobante */}
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Comprobante</Typography>
                    <Button variant="outlined" startIcon={<UploadFileIcon />} sx={{ color: '#1a2733', borderColor: '#cdd8e3' }}>
                        Adjuntar archivo
                    </Button>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Adjunte un archivo PDF, JPG o PNG</Typography>
                </Box>

                {/* Aviso del monto a registrar */}
                {Number(form.monto) > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: esIngreso ? '#E4F4EE' : '#FBEAE9', color: colorTipo, borderRadius: 2, p: 2, mb: 2 }}>
                        {esIngreso ? <NorthIcon /> : <SouthIcon />}
                        <Typography sx={{ fontWeight: 600 }}>
                            {esIngreso ? 'Ingreso' : 'Gasto'} a registrar: {formatBs(Number(form.monto))}
                        </Typography>
                    </Box>
                )}

                {/* Botones */}
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column-reverse', md: 'row' }, justifyContent: { md: 'flex-end' } }}>
                    <Button variant="outlined" onClick={() => navigate('/finanzas/ingresos-gastos')} sx={{ width: { xs: '100%', md: 'auto' } }}>
                        Cancelar
                    </Button>
                    <Button variant="contained" onClick={guardar} sx={{ width: { xs: '100%', md: 'auto' } }}>
                        Registrar movimiento
                    </Button>
                </Box>
            </Paper>
        </DashboardLayout>
    );
}