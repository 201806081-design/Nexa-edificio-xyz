import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import PersonaForm from './PersonaForm';

export default function RegistrarPersona() {
  const navigate = useNavigate();

  const guardar = (datos) => {
    // MOCK: aqui se llamara al backend para guardar. Por ahora solo navega.
    console.log('Registrar persona:', datos);
    navigate('/copropietarios');
  };

  return (
    <DashboardLayout>
      <PersonaForm
        titulo="Registrar persona"
        subtitulo="Ingresa los datos del propietario o inquilino"
        textoBoton="Guardar registro"
        onGuardar={guardar}
        onCancelar={() => navigate('/copropietarios')}
      />
    </DashboardLayout>
  );
}
