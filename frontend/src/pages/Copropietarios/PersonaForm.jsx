import { useState } from 'react';
import {
  Box, Typography, TextField, Button, ToggleButton, ToggleButtonGroup,
  Select, MenuItem, Alert, Grid,
} from '@mui/material';
import { UNIDADES_MOCK } from '../../constants/copropietariosMock';

const VACIO = {
  tipo: 'Propietario',
  nombres: '',
  apellidos: '',
  documento: '',
  telefono: '',
  correo: '',
  unidad: '',
};

export default function PersonaForm({ titulo, subtitulo, valorInicial, textoBoton, onGuardar, onCancelar }) {
  const [form, setForm] = useState(valorInicial ?? VACIO);
  const [errores, setErrores] = useState({});
  const [mostrarAviso, setMostrarAviso] = useState(false);

  const cambiar = (campo, valor) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErrores((e) => ({ ...e, [campo]: '' }));
  };

  const validar = () => {
    const err = {};
    if (!form.nombres.trim()) err.nombres = 'Este campo es obligatorio';
    if (!form.apellidos.trim()) err.apellidos = 'Este campo es obligatorio';
    if (!/^\d+$/.test(form.documento)) err.documento = 'Ingrese un documento valido';
    if (!/^\d+$/.test(form.telefono)) err.telefono = 'Ingrese un telefono valido';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) err.correo = 'Ingrese un correo valido';
    setErrores(err);
    return Object.keys(err).length === 0;
  };

  const guardar = () => {
    if (!validar()) {
      setMostrarAviso(true);
      return;
    }
    setMostrarAviso(false);
    onGuardar(form);
  };

  return (
    <Box>
      <Typography variant="h1" sx={{ fontSize: '2rem', mb: 0.5 }}>{titulo}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{subtitulo}</Typography>

      <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, p: 4, boxShadow: 1 }}>
        <Typography variant="h3" sx={{ fontSize: '1.1rem', fontWeight: 600, mb: 2 }}>
          Informacion personal
        </Typography>

        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>Tipo de persona *</Typography>
        <ToggleButtonGroup
          exclusive
          value={form.tipo}
          onChange={(e, v) => v && cambiar('tipo', v)}
          sx={{ mb: 3 }}
        >
          <ToggleButton value="Propietario" sx={{ textTransform: 'none', px: 4 }}>Propietario</ToggleButton>
          <ToggleButton value="Inquilino" sx={{ textTransform: 'none', px: 4 }}>Inquilino</ToggleButton>
        </ToggleButtonGroup>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>Nombres *</Typography>
            <TextField fullWidth placeholder="Ej. Maria Jose" value={form.nombres}
              onChange={(e) => cambiar('nombres', e.target.value)}
              error={!!errores.nombres} helperText={errores.nombres} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>Apellidos *</Typography>
            <TextField fullWidth placeholder="Ej. Quispe Suazo" value={form.apellidos}
              onChange={(e) => cambiar('apellidos', e.target.value)}
              error={!!errores.apellidos} helperText={errores.apellidos} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>Documento de identidad *</Typography>
            <TextField fullWidth placeholder="Ej. 74538792" value={form.documento}
              onChange={(e) => cambiar('documento', e.target.value)}
              error={!!errores.documento} helperText={errores.documento} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>Telefono *</Typography>
            <TextField fullWidth placeholder="Ej. 67538792" value={form.telefono}
              onChange={(e) => cambiar('telefono', e.target.value)}
              error={!!errores.telefono} helperText={errores.telefono} />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>Correo electronico *</Typography>
            <TextField fullWidth placeholder="Ej. maria@gmail.com" value={form.correo}
              onChange={(e) => cambiar('correo', e.target.value)}
              error={!!errores.correo} helperText={errores.correo} />
          </Grid>
        </Grid>

        <Typography variant="h3" sx={{ fontSize: '1.1rem', fontWeight: 600, mt: 3, mb: 1 }}>
          Unidad relacionada
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>Departamento</Typography>
        <Select fullWidth displayEmpty value={form.unidad}
          onChange={(e) => cambiar('unidad', e.target.value)}>
          <MenuItem value=""><em>Seleccione unidad</em></MenuItem>
          {UNIDADES_MOCK.map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
        </Select>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          La asociacion puede completarse cuando corresponda
        </Typography>

        {mostrarAviso && (
          <Alert severity="error" sx={{ mt: 3 }}>
            Revisa los campos señalados antes de guardar
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
          <Button variant="outlined" onClick={onCancelar}>Cancelar</Button>
          <Button variant="contained" onClick={guardar}>{textoBoton}</Button>
        </Box>
      </Box>
    </Box>
  );
}
