import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import UnidadForm from './UnidadForm';
import { UNIDADES_MOCK, datosDepto } from '../../constants/unidadesMock';
import { sincronizarPersonas, vincularAnexo, actualizarDepto } from '../../constants/edificioMock';
import { sincronizarDepartamentosActivos } from '../../constants/expensasMock';

// Arma el objeto de unidad segun su tipo a partir de los datos del formulario
function construirUnidad(form) {
    const base = {
        id: Date.now(),
        tipo: form.tipo,
        identificador: form.identificador.trim(),
    };
    // Las personas y el depto se asignan despues (actualizarDepto / vincularAnexo)
    if (form.tipo === 'Departamento') {
        return {
            ...base, piso: Number(form.piso), categoria: form.categoria,
            propietarioId: null, inquilinoId: null, propietarioViveAhi: false, pagaPropietario: false,
        };
    }
    if (form.tipo === 'Parqueo') {
        return { ...base, nivel: form.nivel, techado: form.techado === 'Si', deptoId: null, enUso: false };
    }
    return { ...base, nivel: form.nivel, deptoId: null, enUso: false }; // Baulera
}

export default function RegistrarUnidad() {
    const navigate = useNavigate();

    const guardar = (form) => {
        // MOCK: se agrega a la lista. Con backend, aqui iria el POST.
        const unidad = construirUnidad(form);
        UNIDADES_MOCK.push(unidad);
        if (unidad.tipo === 'Departamento') actualizarDepto(unidad, datosDepto(form));
        else vincularAnexo(unidad, form.deptoId || null, form.enUso);
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