import { useState } from 'react';
import {
    Box, Typography, TextField, Button, ToggleButton, ToggleButtonGroup,
    Select, MenuItem, Alert, InputAdornment, FormControlLabel, Switch,
} from '@mui/material';
import {
    TIPOS_UNIDAD, CATEGORIAS_DEPTO, NIVELES, UNIDADES_MOCK, personasDisponibles, deptosParaAnexo,
} from '../../constants/unidadesMock';
import { nombreCompleto } from '../../constants/copropietariosMock';
import { etiquetaTipoDepto, ocupanteDe } from '../../constants/edificioMock';

const VACIO = {
    tipo: 'Departamento',
    identificador: '',
    piso: '',
    categoria: '', // tipo de departamento: 'A' | 'B' | 'C'
    nivel: '',
    techado: '', // 'Si' | 'No'
    // Parqueo y baulera: depto al que pertenecen y si se usan
    deptoId: '',
    enUso: true,
    // Departamento
    propietarioId: '',
    inquilinoId: '',
    propietarioViveAhi: true,
    pagaPropietario: false,
};

// El prefijo de cada tipo ya viene escrito: el usuario solo pone el numero o codigo.
// Ej. Departamento -> "Depto. " + "401" = "Depto. 401"; Parqueo -> "Parqueo P-" + "15".
const PREFIJOS = { Departamento: 'Depto. ', Parqueo: 'Parqueo P-', Baulera: 'Baulera B-' };

// Deja solo el codigo: quita el prefijo si lo escribieron igual ("Depto. 401" -> "401",
// "P-15" -> "15") y los caracteres no validos. Letras en mayuscula (ej. "B5").
function limpiarCodigo(valor, tipo) {
    let v = String(valor || '').toUpperCase();
    const quitar = {
        Departamento: [/^DEPTO\.?\s*/, /^DEPARTAMENTO\s*/, /^DPTO\.?\s*/],
        Parqueo: [/^PARQUEO\s*/, /^P-/],
        Baulera: [/^BAULERA\s*/, /^B-/],
    }[tipo] || [];
    quitar.forEach((re) => { v = v.replace(re, ''); });
    return v.replace(/[^A-Z0-9-]/g, '').slice(0, 10);
}

// Convierte una unidad existente al formato del formulario (para editar)
function desdeUnidad(u) {
    return {
        tipo: u.tipo,
        identificador: limpiarCodigo(u.identificador ?? '', u.tipo),
        piso: u.piso ?? '',
        categoria: u.categoria ?? '',
        nivel: u.nivel ?? '',
        techado: u.techado === undefined ? '' : (u.techado ? 'Si' : 'No'),
        deptoId: u.deptoId ?? '',
        enUso: u.enUso ?? true,
        propietarioId: u.propietarioId ?? '',
        inquilinoId: u.inquilinoId ?? '',
        propietarioViveAhi: u.propietarioViveAhi ?? true,
        pagaPropietario: u.pagaPropietario ?? false,
    };
}

// Texto de quien usara el parqueo o baulera segun el depto elegido
function usuarioPrevisto(form) {
    if (!form.enUso) return 'Sigue siendo del departamento, pero queda sin uso.';
    const ocupante = ocupanteDe(UNIDADES_MOCK.find((u) => u.id === form.deptoId));
    return ocupante ? `Lo usa ${nombreCompleto(ocupante)} (${ocupante.tipo.toLowerCase()}).` : 'Nadie vive hoy en ese departamento.';
}

// Selector de persona con etiqueta arriba (asociacion de la unidad)
function SelectorPersona({ label, value, onChange, opciones, vacio, disabled }) {
    return (
        <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>{label}</Typography>
            <Select fullWidth displayEmpty value={value} onChange={onChange} disabled={disabled}>
                <MenuItem value=""><em>{vacio}</em></MenuItem>
                {opciones.map((c) => <MenuItem key={c.id} value={c.id}>{nombreCompleto(c)}</MenuItem>)}
            </Select>
        </Box>
    );
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
            setForm({ ...VACIO, tipo: valor });
        } else {
            setForm((f) => ({ ...f, [campo]: valor }));
        }
        setErrores((e) => ({ ...e, [campo]: false }));
    };

    const validar = () => {
        const err = {};
        const codigo = String(form.identificador).trim();
        if (!codigo) {
            err.identificador = 'Este campo es obligatorio';
        } else {
            // No puede repetirse con otra unidad (en editar se ignora la propia)
            const completo = PREFIJOS[form.tipo] + codigo;
            const repetida = UNIDADES_MOCK.some((u) => u.identificador.toUpperCase() === completo.toUpperCase()
                && u.id !== valorInicial?.id);
            if (repetida) err.identificador = `Ya existe "${completo}"`;
        }
        if (form.tipo === 'Departamento') {
            if (!String(form.piso).trim()) err.piso = true;
            if (!form.categoria) err.categoria = true;
        } else {
            if (!form.nivel) err.nivel = true;
            if (form.tipo === 'Parqueo' && !form.techado) err.techado = true;
        }
        // Si el propietario vive en el depto, no puede haber inquilino
        if (form.tipo === 'Departamento' && form.inquilinoId && form.propietarioId && form.propietarioViveAhi) {
            err.inquilinoId = 'Si el propietario vive en el departamento no puede tener inquilino';
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
        // Se guarda con el prefijo: "Depto. 401", "Parqueo P-15", "Baulera B-09"
        onGuardar({ ...form, identificador: PREFIJOS[form.tipo] + String(form.identificador).trim() });
    };

    // Etiquetas del campo identificador segun el tipo
    const labelNumero = {
        Departamento: 'Numero de departamento *',
        Parqueo: 'Numero de parqueo *',
        Baulera: 'Numero de baulera *',
    }[form.tipo];
    const placeholderNumero = { Departamento: 'Ej. 401', Parqueo: 'Ej. 15', Baulera: 'Ej. 09' }[form.tipo];

    return (
        <Box>
            <Typography variant="h1" sx={{ fontSize: '2rem', mb: 0.5 }}>{titulo}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{subtitulo}</Typography>

            <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, p: 4, boxShadow: 1 }}>
                {/* Tipo de unidad */}
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>Tipo de unidad *</Typography>
                <ToggleButtonGroup
                    exclusive
                    fullWidth
                    value={form.tipo}
                    onChange={(e, v) => v && cambiar('tipo', v)}
                    sx={{
                        mb: 3,
                        bgcolor: '#fff',
                        '& .MuiToggleButton-root': {
                            textTransform: 'none',
                            fontWeight: 600,
                            color: '#1F5F8B',
                            borderColor: '#cdd8e3',
                            py: 1.1,
                            fontSize: { xs: '0.75rem', md: '0.9rem' },
                        },
                        '& .MuiToggleButton-root.Mui-selected': {
                            bgcolor: '#1F5F8B', color: '#fff', '&:hover': { bgcolor: '#1C4E70' },
                        },
                    }}
                >
                    {TIPOS_UNIDAD.map((t) => (
                        <ToggleButton key={t} value={t}>{t}</ToggleButton>
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
                                onChange={(e) => cambiar('identificador', limpiarCodigo(e.target.value, form.tipo))}
                                slotProps={{
                                    input: { startAdornment: <InputAdornment position="start">{PREFIJOS[form.tipo].trim()}</InputAdornment> },
                                    htmlInput: { maxLength: 10 },
                                }}
                                error={!!errores.identificador}
                                helperText={errores.identificador || `Escribe solo el numero o codigo: "${PREFIJOS[form.tipo].trim()}" ya esta incluido`} />
                            <Campo label="Piso *" placeholder="Ej. 4" value={form.piso}
                                onChange={(e) => cambiar('piso', e.target.value)}
                                error={!!errores.piso} helperText={errores.piso && 'Este campo es obligatorio'} />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                            <CampoSelect label="Tipo de departamento *" value={form.categoria}
                                onChange={(e) => cambiar('categoria', e.target.value)} error={!!errores.categoria}>
                                <MenuItem value=""><em>Seleccione tipo</em></MenuItem>
                                {CATEGORIAS_DEPTO.map((c) => <MenuItem key={c} value={c}>{etiquetaTipoDepto(c)}</MenuItem>)}
                            </CampoSelect>
                            <Box sx={{ flex: 1, minWidth: 220 }} />
                        </Box>
                    </>
                )}

                {(form.tipo === 'Parqueo' || form.tipo === 'Baulera') && (
                    <>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                            <Campo label={labelNumero} placeholder={placeholderNumero} value={form.identificador}
                                onChange={(e) => cambiar('identificador', limpiarCodigo(e.target.value, form.tipo))}
                                slotProps={{
                                    input: { startAdornment: <InputAdornment position="start">{PREFIJOS[form.tipo].trim()}</InputAdornment> },
                                    htmlInput: { maxLength: 10 },
                                }}
                                error={!!errores.identificador}
                                helperText={errores.identificador || `Escribe solo el numero o codigo: "${PREFIJOS[form.tipo].trim()}" ya esta incluido`} />
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

                {form.tipo === 'Departamento' ? (
                    <>
                        <SelectorPersona label="Propietario" value={form.propietarioId} vacio="Sin propietario"
                            opciones={personasDisponibles(valorInicial?.id ?? null, 'Propietario')}
                            onChange={(e) => cambiar('propietarioId', e.target.value)} />
                        {form.propietarioId && (
                            <Box sx={{ mt: -1, mb: 2 }}>
                                <FormControlLabel label="El propietario vive en el departamento"
                                    control={<Switch checked={form.propietarioViveAhi}
                                        onChange={(e) => cambiar('propietarioViveAhi', e.target.checked)} />} />
                            </Box>
                        )}
                        <SelectorPersona label="Inquilino" value={form.inquilinoId} vacio="Sin inquilino"
                            disabled={!!form.propietarioId && form.propietarioViveAhi}
                            opciones={personasDisponibles(valorInicial?.id ?? null, 'Inquilino')}
                            onChange={(e) => cambiar('inquilinoId', e.target.value)} />
                        {errores.inquilinoId && (
                            <Typography sx={{ color: '#d64545', fontSize: '0.76rem', mt: -1.5, mb: 2 }}>{errores.inquilinoId}</Typography>
                        )}
                        {form.inquilinoId && form.propietarioId && (
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>Responsable de pago de expensas</Typography>
                                <Select fullWidth value={form.pagaPropietario ? 'Propietario' : 'Inquilino'}
                                    onChange={(e) => cambiar('pagaPropietario', e.target.value === 'Propietario')}>
                                    <MenuItem value="Inquilino">Inquilino</MenuItem>
                                    <MenuItem value="Propietario">Propietario</MenuItem>
                                </Select>
                            </Box>
                        )}
                        <Typography variant="body2" color="text.secondary">
                            Para alquilar el departamento, el propietario no debe vivir en el. Solo aparecen
                            las personas que todavia no tienen departamento.
                        </Typography>
                    </>
                ) : (
                    <>
                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>Departamento al que pertenece</Typography>
                        <Select fullWidth displayEmpty value={form.deptoId} onChange={(e) => cambiar('deptoId', e.target.value)}>
                            <MenuItem value=""><em>Libre (sin departamento)</em></MenuItem>
                            {deptosParaAnexo(form.tipo, valorInicial?.id ?? null).map((d) => (
                                <MenuItem key={d.id} value={d.id}>{d.identificador}</MenuItem>
                            ))}
                        </Select>
                        {form.deptoId && (
                            <Box sx={{ mt: 1 }}>
                                <FormControlLabel label="En uso"
                                    control={<Switch checked={form.enUso} onChange={(e) => cambiar('enUso', e.target.checked)} />} />
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                    {usuarioPrevisto(form)}
                                </Typography>
                            </Box>
                        )}
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            El {form.tipo.toLowerCase()} viene con el departamento y lo usa quien vive en el (propietario o
                            inquilino). Cada departamento tiene como maximo un parqueo y una baulera.
                        </Typography>
                    </>
                )}

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