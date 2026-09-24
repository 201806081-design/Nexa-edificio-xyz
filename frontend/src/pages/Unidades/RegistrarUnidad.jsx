import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import UnidadForm from './UnidadForm';
import { UNIDADES_MOCK } from '../../constants/unidadesMock';

// Arma el objeto de unidad segun su tipo a partir de los datos del formulario
function construirUnidad(form) {
    const base = {
        id: Date.now(),
        tipo: form.tipo,
        identificador: form.identificador.trim(),
        personaId: form.personaId === '' ? null : form.personaId,
    };
    if (form.tipo === 'Departamento') {
        return { ...base, piso: Number(form.piso), tipoDepartamento: form.tipoDepartamento };
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
        UNIDADES_MOCK.push(construirUnidad(form));
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