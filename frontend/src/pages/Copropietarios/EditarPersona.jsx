import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import PersonaForm from './PersonaForm';
import { COPROPIETARIOS_MOCK } from '../../constants/copropietariosMock';

export default function EditarPersona() {
  const navigate = useNavigate();
  const { id } = useParams();
  const persona = COPROPIETARIOS_MOCK.find((p) => p.id === Number(id));

  const guardar = (datos) => {
    // MOCK: aqui se llamara al backend para actualizar. Por ahora navega al detalle.
    console.log('Actualizar persona:', datos);
    navigate(`/copropietarios/${id}`);
  };

  if (!persona) {
    return (
      <DashboardLayout>
        <p>Persona no encontrada.</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PersonaForm
        titulo="Editar datos"
        subtitulo="Actualiza la informacion personal y de contacto"
        valorInicial={persona}
        textoBoton="Guardar cambios"
        onGuardar={guardar}
        onCancelar={() => navigate(`/copropietarios/${id}`)}
      />
    </DashboardLayout>
  );
}
