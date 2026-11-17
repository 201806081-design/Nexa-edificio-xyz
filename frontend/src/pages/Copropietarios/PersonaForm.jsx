import { useState } from 'react';
import {
  Box, Typography, TextField, Button, ToggleButton, ToggleButtonGroup,
  Select, MenuItem, Alert, FormControlLabel, Switch,
} from '@mui/material';
import {
  ESTADOS_CIVILES, unidadDePersona, deptosDisponibles, anexosDisponibles, anexoDeDepto, nombreCompleto,
} from '../../constants/copropietariosMock';
import { etiquetaUnidad } from '../../constants/unidadesMock';
import { personaPorId } from '../../constants/edificioMock';

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
  // Unidades relacionadas (ids de UNIDADES). Todas son opcionales.
  deptoId: '',
  viveAhi: true, // solo propietarios: si no vive, el depto queda disponible para alquilar
  // Parqueo y baulera son del departamento (anexos): se eligen para el depto elegido
  parqueoId: '',
  parqueoEnUso: true,
  bauleraId: '',
  bauleraEnUso: true,
};

const ANEXOS = [
  { tipo: 'Parqueo', campo: 'parqueoId', usa: 'parqueoEnUso', label: 'Parqueo (opcional)', vacio: 'Sin parqueo', textoUsa: 'Usa el parqueo' },
  { tipo: 'Baulera', campo: 'bauleraId', usa: 'bauleraEnUso', label: 'Baulera (opcional)', vacio: 'Sin baulera', textoUsa: 'Usa la baulera' },
];

// Campos del formulario que no son de la persona (se guardan en las unidades)
const CAMPOS_UNIDAD = ['deptoId', 'viveAhi', ...ANEXOS.flatMap((a) => [a.campo, a.usa])];

// Parqueo y baulera que ya tiene un depto (se cargan al elegir el depto)
const anexosDelDepto = (deptoId) => Object.fromEntries(ANEXOS.flatMap(({ tipo, campo, usa }) => {
  const anexo = anexoDeDepto(deptoId || null, tipo);
  return [[campo, anexo?.id ?? ''], [usa, anexo ? anexo.enUso : true]];
}));

// Datos de la persona para el formulario (en editar se cargan su depto y sus anexos)
function formInicial(persona) {
  if (!persona) return VACIO;
  const datos = Object.fromEntries(Object.keys(VACIO).map((k) => [k, persona[k] ?? VACIO[k]]));
  const depto = unidadDePersona(persona.id, 'Departamento');
  datos.deptoId = depto?.id ?? '';
  datos.viveAhi = depto?.propietarioId === persona.id ? depto.propietarioViveAhi : true;
  return { ...datos, ...anexosDelDepto(depto?.id) };
}

// Etiqueta de un depto en el selector, con quien mas esta relacionado:
//   inquilino ve al dueño  -> "Depto. 102 -- 2 dormitorios -- piso 1 -- dueño: Hugo Salazar"
//   propietario ve al inquilino que ya lo alquila (deptos sin dueño)
function etiquetaDepto(u, tipoPersona, personaId) {
  const otro = tipoPersona === 'Inquilino'
    ? (u.propietarioId && `dueño: ${nombreCompleto(personaPorId(u.propietarioId))}`)
    : (u.inquilinoId && u.inquilinoId !== personaId && `alquilado a ${nombreCompleto(personaPorId(u.inquilinoId))}`);
  return otro ? `${etiquetaUnidad(u)} -- ${otro}` : etiquetaUnidad(u);
}

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
  const [form, setForm] = useState(() => formInicial(valorInicial));
  const [errores, setErrores] = useState({});
  const [mostrarAviso, setMostrarAviso] = useState(false);

  const cambiar = (campo, valor) => {
    setForm((f) => {
      // Propietarios e inquilinos ven deptos distintos: al cambiar el tipo se limpia el depto
      if (campo === 'tipo') return { ...f, tipo: valor, deptoId: '', ...anexosDelDepto(null) };
      // Al elegir un depto se cargan su parqueo y su baulera
      if (campo === 'deptoId') return { ...f, deptoId: valor, ...anexosDelDepto(valor) };
      return { ...f, [campo]: valor };
    });
    setErrores((e) => ({ ...e, [campo]: '' }));
  };

  const personaId = valorInicial?.id ?? null;
  const esPropietario = form.tipo === 'Propietario';
  const deptoElegido = deptosDisponibles(personaId, form.tipo).find((d) => d.id === form.deptoId);
  // El parqueo y la baulera los define el dueño del depto (o el inquilino si el depto no tiene dueño)
  const defineAnexos = !!deptoElegido && (esPropietario || !deptoElegido.propietarioId);
  // Si el depto ya esta alquilado a otra persona, el propietario no puede vivir ahi
  const alquiladoA = esPropietario && deptoElegido?.inquilinoId && deptoElegido.inquilinoId !== personaId
    ? personaPorId(deptoElegido.inquilinoId) : null;
  const viveAhi = esPropietario && !!form.deptoId && form.viveAhi && !alquiladoA;

  const validar = () => {
    const err = {};
    if (!form.nombres.trim()) err.nombres = 'Este campo es obligatorio';
    if (!form.apellidos.trim()) err.apellidos = 'Este campo es obligatorio';
    if (!/^\d+$/.test(form.documento)) err.documento = 'Ingrese un documento valido';
    if (!/^\d+$/.test(form.telefono)) err.telefono = 'Ingrese un telefono valido';
    if (!form.estadoCivil) err.estadoCivil = 'Seleccione el estado civil';
    const hijos = Number(form.hijos);
    if (form.hijos === '' || !Number.isInteger(hijos) || hijos < 0 || hijos > 20) err.hijos = 'Entre 0 y 20';
    // Un propietario que no vive en su depto puede tener 0 personas viviendo
    const minimo = esPropietario && !viveAhi ? 0 : 1;
    const hab = Number(form.habitantes);
    if (form.habitantes === '' || !Number.isInteger(hab) || hab < minimo || hab > 30) err.habitantes = `Entre ${minimo} y 30`;
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
    // Se separan los datos de la persona de sus unidades (las unidades se asignan aparte)
    const persona = Object.fromEntries(Object.entries(form).filter(([k]) => !CAMPOS_UNIDAD.includes(k)));
    onGuardar(
      { ...persona, hijos: Number(form.hijos), habitantes: Number(form.habitantes) },
      {
        deptoId: form.deptoId || null,
        viveAhi,
        parqueo: form.deptoId ? { id: form.parqueoId || null, enUso: form.parqueoEnUso } : null,
        baulera: form.deptoId ? { id: form.bauleraId || null, enUso: form.bauleraEnUso } : null,
      },
    );
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
            slotProps={{ htmlInput: { min: 0, max: 30 } }}
            error={!!errores.habitantes} helperText={errores.habitantes} />
        </Box>

        <Typography variant="h3" sx={{ fontSize: '1.1rem', fontWeight: 600, mt: 3, mb: 0.5 }}>
          Unidades relacionadas
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {esPropietario
            ? 'Aparecen los departamentos que todavia no tienen dueño.'
            : 'Aparecen los departamentos sin inquilino cuyo dueño no vive ahi (disponibles para alquilar).'}
          {' '}El parqueo y la baulera vienen con el departamento; si eliges &quot;Sin parqueo&quot; queda libre para otro depto.
        </Typography>
        {/* Departamento */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>Departamento</Typography>
          <Select fullWidth displayEmpty value={form.deptoId} onChange={(e) => cambiar('deptoId', e.target.value)}>
            <MenuItem value="">
              <em>{deptosDisponibles(personaId, form.tipo).length ? 'Sin departamento' : 'No hay departamentos disponibles'}</em>
            </MenuItem>
            {deptosDisponibles(personaId, form.tipo).map((u) => (
              <MenuItem key={u.id} value={u.id}>{etiquetaDepto(u, form.tipo, personaId)}</MenuItem>
            ))}
          </Select>
          {/* El propietario indica si usa su depto; si no, queda disponible para alquilar */}
          {esPropietario && form.deptoId && (
            <Box sx={{ mt: 1 }}>
              <FormControlLabel label="Vive en el departamento"
                control={<Switch checked={viveAhi} disabled={!!alquiladoA} onChange={(e) => cambiar('viveAhi', e.target.checked)} />} />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {alquiladoA
                  ? `Esta alquilado a ${nombreCompleto(alquiladoA)}: el departamento queda como alquilado.`
                  : viveAhi
                    ? 'El departamento queda ocupado por el propietario.'
                    : 'El departamento queda disponible para alquilar a un inquilino.'}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Parqueo y baulera: vienen con el departamento (incluidos en la expensa) */}
        {deptoElegido && !defineAnexos && (
          <Alert severity="info" sx={{ mb: 2 }}>
            El parqueo y la baulera son del departamento y los define su propietario.
            Aqui solo indicas si el inquilino los usa.
          </Alert>
        )}
        {ANEXOS.map(({ tipo, campo, usa, label, vacio, textoUsa }) => {
          const opciones = anexosDisponibles(tipo, form.deptoId || null);
          let textoVacio = vacio;
          if (!form.deptoId) textoVacio = 'Elige primero un departamento';
          else if (!opciones.length) textoVacio = `No hay ${tipo.toLowerCase()}s libres`;
          return (
            <Box key={campo} sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>{label}</Typography>
              <Select fullWidth displayEmpty value={form[campo]} disabled={!defineAnexos}
                onChange={(e) => cambiar(campo, e.target.value)}>
                <MenuItem value=""><em>{textoVacio}</em></MenuItem>
                {opciones.map((u) => <MenuItem key={u.id} value={u.id}>{etiquetaUnidad(u)}</MenuItem>)}
              </Select>
              {form[campo] && (
                <Box sx={{ mt: 0.5 }}>
                  <FormControlLabel label={textoUsa}
                    control={<Switch checked={form[usa]} onChange={(e) => cambiar(usa, e.target.checked)} />} />
                  {!form[usa] && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Sigue siendo del departamento, pero queda sin uso.
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          );
        })}

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