import { useState } from 'react';
import {
  Box, TextField, Button, Typography,
  InputAdornment, IconButton, Alert,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

// Anula el fondo azul/amarillo que Chrome pone al autocompletar
const sinAutofill = {
  '& input:-webkit-autofill': {
    WebkitBoxShadow: '0 0 0 100px #FFFFFF inset',
    WebkitTextFillColor: '#132B3E',
    transition: 'background-color 9999s ease-in-out 0s',
  },
};

export default function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ usuario: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((err) => ({ ...err, [name]: '' }));
    setApiError('');
  };

  const validate = () => {
    const next = {};
    if (!form.usuario.trim()) next.usuario = 'Este campo es obligatorio';
    if (!form.password) next.password = 'Este campo es obligatorio';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await login(form.usuario, form.password);
      navigate('/dashboard');
    } catch {
      setApiError('Usuario o contraseña incorrecto');
    } finally {
      setLoading(false);
    }
  };

  const usuarioError = !!errors.usuario || !!apiError;
  const passwordError = !!errors.password || !!apiError;

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%', maxWidth: 400 }}>
      <Typography variant="h1" sx={{ fontSize: '2rem', mb: 0.5 }}>
        Bienvenido
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Inicia sesion para acceder al sistema
      </Typography>

      <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>Usuario</Typography>
      <TextField
        fullWidth
        name="usuario"
        placeholder="Ingrese su usuario"
        value={form.usuario}
        onChange={handleChange}
        error={usuarioError}
        helperText={errors.usuario}
        sx={{ mb: 2, ...sinAutofill }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start"><PersonIcon /></InputAdornment>
            ),
          },
        }}
      />

      <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>Contraseña</Typography>
      <TextField
        fullWidth
        name="password"
        type={showPassword ? 'text' : 'password'}
        placeholder="Ingrese su contraseña"
        value={form.password}
        onChange={handleChange}
        error={passwordError}
        helperText={errors.password}
        sx={sinAutofill}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start"><LockIcon /></InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword((s) => !s)} edge="end" aria-label="mostrar contraseña">
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      {apiError && (
        <Alert severity="error" sx={{ mt: 1.5, py: 0 }}>{apiError}</Alert>
      )}

      <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ mt: 3, py: 1.2 }}>
        {loading ? 'Ingresando…' : 'Iniciar sesion'}
      </Button>
    </Box>
  );
}
