import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import UnidadForm from './UnidadForm';
import { UNIDADES_MOCK } from '../../constants/unidadesMock';

// Aplica los cambios del formulario sobre la unidad existente
function aplicarCambios(unidad, form) {
    unidad.tipo = form.tipo;
    unidad.identificador = form.identificador.trim();
    unidad.personaId = form.personaId === '' ? null : form.personaId;
    // Limpia campos que no aplican al tipo y setea los que si
    delete unidad.piso; delete unidad.tipoDepartamento; delete unidad.nivel; delete unidad.techado;
    if (form.tipo === 'Departamento') {
        unidad.piso = Number(form.piso);
        unidad.tipoDepartamento = form.tipoDepartamento;
    } else {
        unidad.nivel = form.nivel;
        if (form.tipo === 'Parqueo') unidad.techado = form.techado === 'Si';
    }
}

export default function EditarUnidad() {
    const navigate = useNavigate();
    const { id } = useParams();
    const unidad = UNIDADES_MOCK.find((u) => u.id === Number(id));

    const guardar = (form) => {
        // MOCK: se actualiza el registro. Con backend, aqui iria el PUT.
        aplicarCambios(unidad, form);
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