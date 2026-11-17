import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, Alert,
} from '@mui/material';
import KeyIcon from '@mui/icons-material/Key';

// Aviso de credenciales enviadas al correo (alta de cuenta o restablecer contraseña).
// credenciales = { usuario, password } | null
export default function CredencialesDialog({ credenciales, titulo, descripcion, onClose }) {
  return (
    <Dialog open={!!credenciales} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 700 }}>
        <KeyIcon color="primary" /> {titulo}
      </DialogTitle>
      <DialogContent dividers>
        {descripcion && <Typography variant="body2" sx={{ mb: 2 }}>{descripcion}</Typography>}
        <Box sx={{ bgcolor: '#F3F6FA', borderRadius: 2, p: 2, mb: 2 }}>
          <Typography variant="body2">Usuario: <strong>{credenciales?.usuario.username}</strong></Typography>
          <Typography variant="body2">Contraseña: <strong>{credenciales?.password}</strong></Typography>
          <Typography variant="body2">Correo: <strong>{credenciales?.usuario.email || 'Sin correo registrado'}</strong></Typography>
        </Box>
        <Alert severity="success" icon={false} sx={{ bgcolor: '#E4F4EE', color: 'text.primary' }}>
          <Typography variant="body2">
            Se enviaron el usuario y la contraseña a su correo. Puede cambiar su contraseña
            desde "¿Olvidaste tu contraseña?" en el inicio de sesión.
          </Typography>
          <Typography variant="caption" color="text.secondary">(Envio simulado: lo hara el backend.)</Typography>
        </Alert>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button variant="contained" onClick={onClose}>Entendido</Button>
      </DialogActions>
    </Dialog>
  );
}
