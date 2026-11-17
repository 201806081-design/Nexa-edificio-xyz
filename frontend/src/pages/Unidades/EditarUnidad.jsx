import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import UnidadForm from './UnidadForm';
import { UNIDADES_MOCK, datosDepto } from '../../constants/unidadesMock';
import { sincronizarPersonas, cambiarOcupante, actualizarDepto } from '../../constants/edificioMock';
import { sincronizarDepartamentosActivos } from '../../constants/expensasMock';

const CAMPOS_DEPTO = ['propietarioId', 'inquilinoId', 'propietarioViveAhi', 'pagaPropietario'];
const CAMPOS_OTROS = ['nivel', 'techado', 'personaId'];

// Aplica los cambios del formulario sobre la unidad existente
function aplicarCambios(unidad, form) {
    // Primero se liberan las personas del tipo anterior (registra el historial del depto)
    if (unidad.tipo === 'Departamento' && form.tipo !== 'Departamento') {
        actualizarDepto(unidad, { propietarioId: null, inquilinoId: null });
    }
    if (unidad.tipo !== 'Departamento') cambiarOcupante(unidad, null);

    unidad.identificador = form.identificador.trim();
    // Limpia los campos que no aplican al tipo nuevo y setea los que si
    const sobran = form.tipo === 'Departamento' ? CAMPOS_OTROS : [...CAMPOS_DEPTO, 'piso', 'categoria'];
    sobran.forEach((campo) => delete unidad[campo]);
    unidad.tipo = form.tipo;
    if (form.tipo === 'Departamento') {
        unidad.piso = Number(form.piso);
        unidad.categoria = form.categoria;
        actualizarDepto(unidad, datosDepto(form)); // registra el historial si cambia quien vive
    } else {
        unidad.nivel = form.nivel;
        if (form.tipo === 'Parqueo') unidad.techado = form.techado === 'Si';
        cambiarOcupante(unidad, form.personaId || null);
    }
}

export default function EditarUnidad() {
    const navigate = useNavigate();
    const { id } = useParams();
    const unidad = UNIDADES_MOCK.find((u) => u.id === Number(id));

    const guardar = (form) => {
        // MOCK: se actualiza el registro. Con backend, aqui iria el PUT.
        aplicarCambios(unidad, form);
        sincronizarPersonas(); // refleja el cambio en Copropietarios
        sincronizarDepartamentosActivos(); // y en Finanzas y Comunicados
        navigate(`/unidades/${id}`, { state: { mensaje: 'Datos actualizados correctamente' } });
    };

    if (!unidad) {
        return (
            <DashboardLayout>
                <p>Unidad no encontrada.</p>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <UnidadForm
                titulo="Editar unidad"
                subtitulo="Actualiza los datos de la unidad"
                valorInicial={unidad}
                textoBoton="Guardar cambios"
                onGuardar={guardar}
                onCancelar={() => navigate(`/unidades/${id}`)}
            />
        </DashboardLayout>
    );
}