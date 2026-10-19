import { useState } from 'react';
import {
    Box, Typography, TextField, Button, Link, Alert, InputAdornment,
} from '@mui/material';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';

// MOCK: correos registrados. Con backend, esto lo valida el servidor.
const CORREOS_REGISTRADOS = [
    'admin@edificioxyz.com',
    'carlos@edificioxyz.com',
    'ana@edificioxyz.com',
];

const esFormatoValido = (correo) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);

export default function RecuperarContrasena() {
    const navigate = useNavigate();
    const [correo, setCorreo] = useState('');
    const [error, setError] = useState('');

    const enviar = () => {
        if (!esFormatoValido(correo)) {
            setError('Ingrese un correo valido');
            return;
        }
        if (!CORREOS_REGISTRADOS.includes(correo.trim().toLowerCase())) {
            setError('El correo no esta registrado');
            return;
        }
        setError('');
        // MOCK: aqui el backend enviaria el enlace de recuperacion.
        navigate('/recuperar-contrasena/enviado');
    };

    return (
        <AuthLayout>
            <Typography variant="h1" sx={{ fontSize: '2rem', mb: 0.5 }}>Recuperar contraseña</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Ingrese el correo asociado a tu cuenta
            </Typography>

            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Correo electronico</Typography>
            <TextField
                fullWidth
                type="email"
                placeholder="Ingrese su correo electronico"
                value={correo}
                onChange={(e) => { setCorreo(e.target.value); setError(''); }}
                error={!!error}
                helperText={error}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><MailOutlineIcon /></InputAdornment> } }}
            />

            {error && (
                <Alert severity="error" sx={{ mt: 1.5 }}>Revisa el correo ingresado antes de continuar</Alert>
            )}

            <Button fullWidth variant="contained" size="large" onClick={enviar} sx={{ mt: 3, py: 1.2 }}>
                Enviar enlace de recuperacion
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Link component="button" type="button" underline="hover"
                    onClick={() => navigate('/login')}
                    sx={{ color: 'primary.main', fontWeight: 600, fontSize: '0.9rem' }}>
                    Volver a inicio de sesion
                </Link>
            </Box>
        </AuthLayout>
    );
}