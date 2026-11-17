import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import UnidadForm from './UnidadForm';
import { UNIDADES_MOCK } from '../../constants/unidadesMock';
import { sincronizarPersonas, cambiarOcupante } from '../../constants/edificioMock';
import { sincronizarDepartamentosActivos } from '../../constants/expensasMock';

// Arma el objeto de unidad segun su tipo a partir de los datos del formulario
function construirUnidad(form) {
    const base = {
        id: Date.now(),
        tipo: form.tipo,
        identificador: form.identificador.trim(),
        personaId: null, // se asigna con cambiarOcupante (registra el historial)
    };
    if (form.tipo === 'Departamento') {
        return { ...base, piso: Number(form.piso), categoria: form.categoria };
    }
    if (form.tipo === 'Parqueo') {
        return { ...base, nivel: form.nivel, techado: form.techado === 'Si' };
    }
    return { ...base, nivel: form.nivel }; // Baulera
}

export default function RegistrarUnidad() {
    const navigate = useNavigate();

    const guardar = (form) => {
        // MOCK: se agrega a la lista. Con backend, aqui iria el POST.
        const unidad = construirUnidad(form);
        UNIDADES_MOCK.push(unidad);
        cambiarOcupante(unidad, form.personaId || null);
        sincronizarPersonas(); // la persona asociada ve su nueva unidad
        sincronizarDepartamentosActivos(); // el depto nuevo aparece en Finanzas y Comunicados
        navigate('/unidades', { state: { mensaje: 'Unidad registrada correctamente' } });
    };

    return (
        <DashboardLayout>
            <UnidadForm
                titulo="Registrar unidad"
                subtitulo="Ingresa los datos de la unidad del edificio"
                textoBoton="Guardar unidad"
                onGuardar={guardar}
                onCancelar={() => navigate('/unidades')}
            />
        </DashboardLayout>
    );
}