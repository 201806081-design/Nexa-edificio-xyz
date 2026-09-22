import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import PersonaForm from './PersonaForm';
import { COPROPIETARIOS_MOCK } from '../../constants/copropietariosMock';

export default function EditarPersona() {
  const navigate = useNavigate();
  const { id } = useParams();
  const persona = COPROPIETARIOS_MOCK.find((p) => p.id === Number(id));

  const guardar = (datos) => {
    // MOCK: se actualiza el registro. Con backend, aqui iria el PUT.
    Object.assign(persona, datos);
    navigate(`/copropietarios/${id}`, {
      state: { mensaje: 'Datos actualizados correctamente' },
    });
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
        tipoEditable={false}
        onGuardar={guardar}
        onCancelar={() => navigate(`/copropietarios/${id}`)}
      />
    </DashboardLayout>
  );
}