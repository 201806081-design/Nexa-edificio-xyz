import { useState } from 'react';
import {
  Box, Typography, TextField, Button, ToggleButton, ToggleButtonGroup,
  Select, MenuItem, Alert,
} from '@mui/material';
import { deptosParaSelector, ESTADOS_CIVILES } from '../../constants/copropietariosMock';

const VACIO = {
  tipo: 'Propietario',
  nombres: '',
  apellidos: '',
  documento: '',
  telefono: '',
  correo: '',
  estadoCivil: '',
  hijos: '',
  habitantes: '',
  unidad: '',
  tipoDepartamento: '',
  piso: '',
};

// Etiqueta de la unidad para el selector: "Depto. 302 -- 2 dormitorios -- piso 3"
const etiquetaUnidad = (d) => `${d.identificador} -- ${d.tipoDepartamento} -- piso ${d.piso}`;

// Un campo con su etiqueta arriba
function Campo({ label, ...props }) {
  return (
    <Box sx={{ flex: 1, minWidth: 220 }}>
      <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>{label}</Typography>
      <TextField fullWidth {...props} />
    </Box>
  );
}

export default function PersonaForm({
  titulo, subtitulo, valorInicial, textoBoton, onGuardar, onCancelar,
  tipoEditable = true, // en editar se pasa false: el tipo queda bloqueado
}) {
  const [form, setForm] = useState({ ...VACIO, ...(valorInicial ?? {}) });
  // Deptos registrados en Unidades (incluye los agregados despues de cargar la app)
  const deptos = deptosParaSelector();
  const [errores, setErrores] = useState({});
  const [mostrarAviso, setMostrarAviso] = useState(false);

  const cambiar = (campo, valor) => {
    if (campo === 'unidad') {
      // Al elegir unidad, se autocompletan tipo de departamento y piso
      const d = deptos.find((x) => x.identificador === valor);
      const info = d ? { tipoDepartamento: d.tipoDepartamento, piso: d.piso } : { tipoDepartamento: '', piso: '' };
      setForm((f) => ({ ...f, unidad: valor, ...info }));
    } else {
      setForm((f) => ({ ...f, [campo]: valor }));
    }
    setErrores((e) => ({ ...e, [campo]: '' }));
  };

  const validar = () => {
    const err = {};
    if (!form.nombres.trim()) err.nombres = 'Este campo es obligatorio';
    if (!form.apellidos.trim()) err.apellidos = 'Este campo es obligatorio';
    if (!/^\d+$/.test(form.documento)) err.documento = 'Ingrese un documento valido';
    if (!/^\d+$/.test(form.telefono)) err.telefono = 'Ingrese un telefono valido';
    if (!form.estadoCivil) err.estadoCivil = 'Seleccione el estado civil';
    const hijos = Number(form.hijos);
    if (form.hijos === '' || !Number.isInteger(hijos) || hijos < 0 || hijos > 20) err.hijos = 'Entre 0 y 20';
    const hab = Number(form.habitantes);
    if (form.habitantes === '' || !Number.isInteger(hab) || hab < 1 || hab > 30) err.habitantes = 'Entre 1 y 30';
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
    onGuardar({ ...form, hijos: Number(form.hijos), habitantes: Number(form.habitantes) });
  };

  return (
    <Box>
      <Typography variant="h1" sx={{ fontSize: '2rem', mb: 0.5 }}>{titulo}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{subtitulo}</Typography>

      <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, p: 4, boxShadow: 1 }}>
        <Typography variant="h3" sx={{ fontSize: '1.1rem', fontWeight: 600, mb: 2 }}>
          Informacion personal
        </Typography>

        {tipoEditable ? (
          <>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>Tipo de persona *</Typography>
            <ToggleButtonGroup
              exclusive
              value={form.tipo}
              onChange={(e, v) => v && cambiar('tipo', v)}
              sx={{
                mb: 3,
                '& .MuiToggleButton-root.Mui-selected': {
                  bgcolor: '#1F5F8B', color: '#fff',
                  '&:hover': { bgcolor: '#1C4E70' },
                },
              }}
            >
              <ToggleButton value="Propietario" sx={{ textTransform: 'none', px: 4 }}>Propietario</ToggleButton>
              <ToggleButton value="Inquilino" sx={{ textTransform: 'none', px: 4 }}>Inquilino</ToggleButton>
            </ToggleButtonGroup>
          </>
        ) : (
          // En editar el tipo no se cambia: se muestra bloqueado
          <Box sx={{
            display: 'inline-flex', gap: 1, alignItems: 'center',
            bgcolor: '#EEF1F4', borderRadius: 2, px: 2, py: 1.5, mb: 3,
          }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Tipo de persona :</Typography>
            <Typography variant="body2" color="text.secondary">{form.tipo}</Typography>
          </Box>
        )}

        {/* Fila 1: Nombres + Apellidos */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <Campo label="Nombres *" placeholder="Ej. Maria Jose" value={form.nombres}
            onChange={(e) => cambiar('nombres', e.target.value)}
            error={!!errores.nombres} helperText={errores.nombres} />
          <Campo label="Apellidos *" placeholder="Ej. Quispe Suazo" value={form.apellidos}
            onChange={(e) => cambiar('apellidos', e.target.value)}
            error={!!errores.apellidos} helperText={errores.apellidos} />
        </Box>

        {/* Fila 2: Documento + Telefono */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <Campo label="Documento de identidad *" placeholder="Ej. 74538792" value={form.documento}
            onChange={(e) => cambiar('documento', e.target.value)}
            error={!!errores.documento} helperText={errores.documento} />
          <Campo label="Telefono *" placeholder="Ej. 67538792" value={form.telefono}
            onChange={(e) => cambiar('telefono', e.target.value)}
            error={!!errores.telefono} helperText={errores.telefono} />
        </Box>

        {/* Fila 3: Correo (ancho completo) */}
        <Box sx={{ mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>Correo electronico *</Typography>
          <TextField fullWidth placeholder="Ej. maria@gmail.com" value={form.correo}
            onChange={(e) => cambiar('correo', e.target.value)}
            error={!!errores.correo} helperText={errores.correo} />
        </Box>

        <Typography variant="h3" sx={{ fontSize: '1.1rem', fontWeight: 600, mt: 3, mb: 1 }}>
          Datos del hogar
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 1, flexDirection: { xs: 'column', md: 'row' } }}>
          <Box sx={{ flex: 1, minWidth: 220 }}>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>Estado civil *</Typography>
            <Select fullWidth displayEmpty value={form.estadoCivil}
              onChange={(e) => cambiar('estadoCivil', e.target.value)} error={!!errores.estadoCivil}>
              <MenuItem value=""><em>Seleccione</em></MenuItem>
              {ESTADOS_CIVILES.map((ec) => <MenuItem key={ec} value={ec}>{ec}</MenuItem>)}
            </Select>
            {errores.estadoCivil && (
              <Typography variant="caption" color="error" sx={{ ml: 1.75 }}>{errores.estadoCivil}</Typography>
            )}
          </Box>
          <Campo label="Numero de hijos *" type="number" placeholder="Ej. 2" value={form.hijos}
            onChange={(e) => cambiar('hijos', e.target.value)}
            slotProps={{ htmlInput: { min: 0, max: 20 } }}
            error={!!errores.hijos} helperText={errores.hijos} />
          <Campo label="Personas que viven en el depto *" type="number" placeholder="Ej. 4" value={form.habitantes}
            onChange={(e) => cambiar('habitantes', e.target.value)}
            slotProps={{ htmlInput: { min: 1, max: 30 } }}
            error={!!errores.habitantes} helperText={errores.habitantes} />
        </Box>

        <Typography variant="h3" sx={{ fontSize: '1.1rem', fontWeight: 600, mt: 3, mb: 1 }}>
          Unidad relacionada
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>Departamento</Typography>
        <Select fullWidth displayEmpty value={form.unidad}
          onChange={(e) => cambiar('unidad', e.target.value)}>
          <MenuItem value=""><em>Seleccione unidad</em></MenuItem>
          {deptos.map((d) => (
            <MenuItem key={d.identificador} value={d.identificador}>{etiquetaUnidad(d)}</MenuItem>
          ))}
        </Select>

        {mostrarAviso && (
          <Alert severity="error" sx={{ mt: 3 }}>
            Revisa los campos señalados antes de guardar
          </Alert>
        )}

        {/* Botones: lado a lado en escritorio, apilados en movil */}
        <Box sx={{
          display: 'flex', gap: 2, mt: 3,
          flexDirection: { xs: 'column-reverse', md: 'row' },
          justifyContent: { md: 'flex-end' },
        }}>
          <Button variant="outlined" onClick={onCancelar} sx={{ width: { xs: '100%', md: 'auto' } }}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={guardar} sx={{ width: { xs: '100%', md: 'auto' } }}>
            {textoBoton}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}