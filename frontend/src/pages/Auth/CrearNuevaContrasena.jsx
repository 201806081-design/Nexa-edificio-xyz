import { useState } from 'react';
import {
    Typography, TextField, Button, InputAdornment, IconButton,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';

const REQUISITOS = 'Minimo 8 caracteres, una mayuscula, un numero y un simbolo';

// La contrasena cumple: min 8, una mayuscula, un numero, un simbolo
const cumpleRequisitos = (p) =>
    p.length >= 8 && /[A-Z]/.test(p) && /\d/.test(p) && /[^A-Za-z0-9]/.test(p);

export default function CrearNuevaContrasena() {
    const navigate = useNavigate();
    const [nueva, setNueva] = useState('');
    const [confirmar, setConfirmar] = useState('');
    const [verNueva, setVerNueva] = useState(false);
    const [verConfirmar, setVerConfirmar] = useState(false);
    const [errores, setErrores] = useState({});

    const actualizar = () => {
        const err = {};
        if (!cumpleRequisitos(nueva)) err.nueva = 'La contraseña no cumple los requisitos';
        if (confirmar !== nueva || !confirmar) err.confirmar = 'La contraseña no coincide';
        setErrores(err);
        if (Object.keys(err).length > 0) return;
        // MOCK: aqui el backend guardaria la nueva contraseña.
        navigate('/restablecer-contrasena/listo');
    };

    const ojo = (visible, toggle) => (
        <InputAdornment position="end">
            <IconButton type="button" onClick={toggle} edge="end">
                {visible ? <VisibilityOff /> : <Visibility />}
            </IconButton>
        </InputAdornment>
    );

    return (
        <AuthLayout>
            <Typography variant="h1" sx={{ fontSize: '2rem', mb: 3 }}>Crear nueva contraseña</Typography>

            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Nueva contraseña</Typography>
            <TextField
                fullWidth
                type={verNueva ? 'text' : 'password'}
                placeholder="Ingrese su nueva contraseña"
                value={nueva}
                onChange={(e) => { setNueva(e.target.value); setErrores((x) => ({ ...x, nueva: '' })); }}
                error={!!errores.nueva}
                helperText={errores.nueva || REQUISITOS}
                slotProps={{
                    input: {
                        startAdornment: <InputAdornment position="start"><LockIcon /></InputAdornment>,
                        endAdornment: ojo(verNueva, () => setVerNueva((s) => !s)),
                    }
                }}
                sx={{ mb: 2 }}
            />

            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Confirmar contraseña</Typography>
            <TextField
                fullWidth
                type={verConfirmar ? 'text' : 'password'}
                placeholder="Confirme su contraseña"
                value={confirmar}
                onChange={(e) => { setConfirmar(e.target.value); setErrores((x) => ({ ...x, confirmar: '' })); }}
                error={!!errores.confirmar}
                helperText={errores.confirmar}
                slotProps={{
                    input: {
                        startAdornment: <InputAdornment position="start"><LockIcon /></InputAdornment>,
                        endAdornment: ojo(verConfirmar, () => setVerConfirmar((s) => !s)),
                    }
                }}
            />

            <Button fullWidth variant="contained" size="large" onClick={actualizar} sx={{ mt: 3, py: 1.2 }}>
                Actualizar contraseña
            </Button>
        </AuthLayout>
    );
}