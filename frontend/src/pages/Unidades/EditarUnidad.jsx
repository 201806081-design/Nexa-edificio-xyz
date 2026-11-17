import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import UnidadForm from './UnidadForm';
import { UNIDADES_MOCK } from '../../constants/unidadesMock';
import { sincronizarPersonas, cambiarOcupante } from '../../constants/edificioMock';
import { sincronizarDepartamentosActivos } from '../../constants/expensasMock';

// Aplica los cambios del formulario sobre la unidad existente
function aplicarCambios(unidad, form) {
    unidad.tipo = form.tipo;
    unidad.identificador = form.identificador.trim();
    cambiarOcupante(unidad, form.personaId || null); // registra el historial si cambia la persona
    // Limpia campos que no aplican al tipo y setea los que si
    delete unidad.piso; delete unidad.categoria; delete unidad.nivel; delete unidad.techado;
    if (form.tipo === 'Departamento') {
        unidad.piso = Number(form.piso);
        unidad.categoria = form.categoria;
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