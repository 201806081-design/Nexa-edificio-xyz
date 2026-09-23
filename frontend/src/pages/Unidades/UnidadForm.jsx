import { useState } from 'react';
import {
    Box, Typography, TextField, Button, ToggleButton, ToggleButtonGroup,
    Select, MenuItem, Alert,
} from '@mui/material';
import {
    TIPOS_UNIDAD, TIPOS_DEPARTAMENTO, NIVELES,
} from '../../constants/unidadesMock';
import { COPROPIETARIOS_MOCK, nombreCompleto } from '../../constants/copropietariosMock';

const VACIO = {
    tipo: 'Departamento',
    identificador: '',
    piso: '',
    tipoDepartamento: '',
    nivel: '',
    techado: '', // 'Si' | 'No'
    personaId: '',
};

// Convierte una unidad existente al formato del formulario (para editar)
function desdeUnidad(u) {
    return {
        tipo: u.tipo,
        identificador: u.identificador ?? '',
        piso: u.piso ?? '',
        tipoDepartamento: u.tipoDepartamento ?? '',
        nivel: u.nivel ?? '',
        techado: u.techado === undefined ? '' : (u.techado ? 'Si' : 'No'),
        personaId: u.personaId ?? '',
    };
}

// Campo de texto con etiqueta arriba
function Campo({ label, ...props }) {
    return (
        <Box sx={{ flex: 1, minWidth: 220 }}>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>{label}</Typography>
            <TextField fullWidth {...props} />
        </Box>
    );
}

// Selector con etiqueta arriba y mensaje de error
function CampoSelect({ label, value, onChange, error, children }) {
    return (
        <Box sx={{ flex: 1, minWidth: 220 }}>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>{label}</Typography>
            <Select fullWidth displayEmpty value={value} onChange={onChange} error={error}>
                {children}
            </Select>
            {error && (
                <Typography sx={{ color: '#d64545', fontSize: '0.76rem', mt: 0.5 }}>
                    Este campo es obligatorio
                </Typography>
            )}
        </Box>
    );
}

export default function UnidadForm({ titulo, subtitulo, valorInicial, textoBoton, onGuardar, onCancelar }) {
    const [form, setForm] = useState(valorInicial ? desdeUnidad(valorInicial) : VACIO);
    const [errores, setErrores] = useState({});
    const [mostrarAviso, setMostrarAviso] = useState(false);

    const cambiar = (campo, valor) => {
        // Al cambiar el tipo se limpian los campos propios del tipo anterior
        if (campo === 'tipo') {
            setForm((f) => ({ ...f, tipo: valor, piso: '', tipoDepartamento: '', nivel: '', techado: '' }));
        } else {
            setForm((f) => ({ ...f, [campo]: valor }));
        }
        setErrores((e) => ({ ...e, [campo]: false }));
    };

    const validar = () => {
        const err = {};
        if (!String(form.identificador).trim()) err.identificador = true;
        if (form.tipo === 'Departamento') {
            if (!String(form.piso).trim()) err.piso = true;
            if (!form.tipoDepartamento) err.tipoDepartamento = true;
        } else {
            if (!form.nivel) err.nivel = true;
            if (form.tipo === 'Parqueo' && !form.techado) err.techado = true;
        }
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

    // Etiquetas del campo identificador segun el tipo
    const labelNumero = {
        Departamento: 'Numero de departamento *',
        Parqueo: 'Numero de parqueo *',
        Baulera: 'Numero de baulera *',
    }[form.tipo];
    const placeholderNumero = { Departamento: 'Ej. Depto. 401', Parqueo: 'Ej. P-15', Baulera: 'Ej. B-09' }[form.tipo];

    return (
        <Box>
            <Typography variant="h1" sx={{ fontSize: '2rem', mb: 0.5 }}>{titulo}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{subtitulo}</Typography>

            <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, p: 4, boxShadow: 1 }}>
                {/* Tipo de unidad */}
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>Tipo de unidad *</Typography>
                <ToggleButtonGroup
                    exclusive
                    value={form.tipo}
                    onChange={(e, v) => v && cambiar('tipo', v)}
                    sx={{
                        mb: 3, flexWrap: 'wrap',
                        '& .MuiToggleButton-root.Mui-selected': {
                            bgcolor: '#1F5F8B', color: '#fff', '&:hover': { bgcolor: '#1C4E70' },
                        },
                    }}
                >
                    {TIPOS_UNIDAD.map((t) => (
                        <ToggleButton key={t} value={t} sx={{ textTransform: 'none', px: 4 }}>{t}</ToggleButton>
                    ))}
                </ToggleButtonGroup>

                {/* Datos de la unidad */}
                <Typography variant="h3" sx={{ fontSize: '1.1rem', fontWeight: 600, mb: 2 }}>
                    Datos de la unidad
                </Typography>

                {form.tipo === 'Departamento' && (
                    <>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                            <Campo label={labelNumero} placeholder={placeholderNumero} value={form.identificador}
                                onChange={(e) => cambiar('identificador', e.target.value)}
                                error={!!errores.identificador} helperText={errores.identificador && 'Este campo es obligatorio'} />
                            <Campo label="Piso *" placeholder="Ej. 4" value={form.piso}
                                onChange={(e) => cambiar('piso', e.target.value)}
                                error={!!errores.piso} helperText={errores.piso && 'Este campo es obligatorio'} />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                            <CampoSelect label="Tipo de departamento *" value={form.tipoDepartamento}
                                onChange={(e) => cambiar('tipoDepartamento', e.target.value)} error={!!errores.tipoDepartamento}>
                                <MenuItem value=""><em>Seleccione tipo</em></MenuItem>
                                {TIPOS_DEPARTAMENTO.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                            </CampoSelect>
                            <Box sx={{ flex: 1, minWidth: 220 }} />
                        </Box>
                    </>
                )}

                {(form.tipo === 'Parqueo' || form.tipo === 'Baulera') && (
                    <>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                            <Campo label={labelNumero} placeholder={placeholderNumero} value={form.identificador}
                                onChange={(e) => cambiar('identificador', e.target.value)}
                                error={!!errores.identificador} helperText={errores.identificador && 'Este campo es obligatorio'} />
                            <CampoSelect label="Nivel *" value={form.nivel}
                                onChange={(e) => cambiar('nivel', e.target.value)} error={!!errores.nivel}>
                                <MenuItem value=""><em>Seleccione nivel</em></MenuItem>
                                {NIVELES.map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                            </CampoSelect>
                        </Box>
                        {form.tipo === 'Parqueo' && (
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                                <CampoSelect label="¿Techado? *" value={form.techado}
                                    onChange={(e) => cambiar('techado', e.target.value)} error={!!errores.techado}>
                                    <MenuItem value=""><em>Seleccione</em></MenuItem>
                                    <MenuItem value="Si">Si</MenuItem>
                                    <MenuItem value="No">No</MenuItem>
                                </CampoSelect>
                                <Box sx={{ flex: 1, minWidth: 220 }} />
                            </Box>
                        )}
                    </>
                )}

                {/* Asociacion opcional */}
                <Typography variant="h3" sx={{ fontSize: '1.1rem', fontWeight: 600, mt: 3, mb: 1 }}>
                    Asociacion (Opcional)
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>Persona asociada</Typography>
                <Select fullWidth displayEmpty value={form.personaId}
                    onChange={(e) => cambiar('personaId', e.target.value)}>
                    <MenuItem value=""><em>Seleccionar propietario o inquilino</em></MenuItem>
                    {COPROPIETARIOS_MOCK.map((c) => (
                        <MenuItem key={c.id} value={c.id}>{nombreCompleto(c)} — {c.tipo}</MenuItem>
                    ))}
                </Select>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Puede asociar la unidad con una persona registrada
                </Typography>

                {mostrarAviso && (
                    <Alert severity="error" sx={{ mt: 3 }}>
                        Revisa los campos señalados antes de guardar
                    </Alert>
                )}

                {/* Botones */}
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