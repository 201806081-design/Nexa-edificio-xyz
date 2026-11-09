import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import PersonaForm from './PersonaForm';
import { COPROPIETARIOS_MOCK } from '../../constants/copropietariosMock';
import { asignarDepto } from '../../constants/edificioMock';

export default function RegistrarPersona() {
  const navigate = useNavigate();

  const guardar = (datos) => {
    // MOCK: se agrega a la lista. Con backend, aqui iria el POST.
    const nuevo = { ...datos, id: Date.now() };
    COPROPIETARIOS_MOCK.push(nuevo);
    asignarDepto(nuevo.id, datos.unidad); // la unidad queda asociada a la persona
    navigate(`/copropietarios/${nuevo.id}`, {
      state: { mensaje: `${datos.tipo} registrado correctamente` },
    });
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