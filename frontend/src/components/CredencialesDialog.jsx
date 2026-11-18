import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress,
} from '@mui/material';
import KeyIcon from '@mui/icons-material/Key';

const OCULTO = '••••••';

// Resultado del envio del correo (ver hooks/useEnvioCredenciales)
function EstadoEnvio({ envio, correo }) {
  if (envio?.estado === 'enviando') {
    return (
      <Alert severity="info" icon={<CircularProgress size={18} />}>
        Enviando el usuario y la contraseña a {correo}...
      </Alert>
    );
  }
  if (envio?.estado === 'enviado') {
    return (
      <Alert severity="success">
        Se enviaron el usuario y la contraseña a <strong>{correo}</strong>.
      </Alert>
    );
  }
  if (envio?.estado === 'sin-correo') {
    return (
      <Alert severity="warning">
        No tiene correo registrado: registra su correo para poder enviarle sus datos.
      </Alert>
    );
  }
  return (
    <Alert severity="warning">
      Los datos se guardaron, pero el correo no se envio. {envio?.mensaje}
    </Alert>
  );
}

// Aviso de credenciales (alta de cuenta o restablecer contraseña).
// El usuario y la contraseña solo se ven si credenciales.mostrarDatos es true (al crear la cuenta);
// en cualquier otro caso quedan ocultos: solo los conoce el dueño de la cuenta.
export default function CredencialesDialog({ credenciales, onClose }) {
  const ver = !!credenciales?.mostrarDatos;

  return (
    <Dialog open={!!credenciales} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 700 }}>
        <KeyIcon color="primary" /> {credenciales?.titulo}
      </DialogTitle>
      <DialogContent dividers>
        {credenciales?.descripcion && <Typography variant="body2" sx={{ mb: 2 }}>{credenciales.descripcion}</Typography>}
        <Box sx={{ bgcolor: '#F3F6FA', borderRadius: 2, p: 2, mb: 2 }}>
          <Typography variant="body2">Usuario: <strong>{ver ? credenciales?.usuario.username : OCULTO}</strong></Typography>
          <Typography variant="body2">Contraseña: <strong>{ver ? credenciales?.password : OCULTO}</strong></Typography>
          <Typography variant="body2">Correo: <strong>{credenciales?.usuario.email || 'Sin correo registrado'}</strong></Typography>
        </Box>
        {ver && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Es la unica vez que se muestran estos datos.
          </Typography>
        )}
        <EstadoEnvio envio={credenciales?.envio} correo={credenciales?.usuario.email} />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button variant="contained" onClick={onClose}>Entendido</Button>
      </DialogActions>
    </Dialog>
  );
}
