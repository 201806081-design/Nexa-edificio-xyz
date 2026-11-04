// Hook global de notificaciones.
// - Devuelve la lista filtrada por el usuario logueado y el conteo sin leer.
// - Cada 10s refresca el estado (tick interno) para que, aunque mute el mock,
//   la campanita se actualice sin tener que recargar.
// - En cada tick dispara procesarProgramadosVencidos(), asi los comunicados
//   programados se envian a su hora exacta aunque nadie este mirando la pantalla
//   de comunicados (mientras haya al menos una pestania con la app abierta).

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from './useAuth';
import {
    notificacionesParaUsuario, noLeidasParaUsuario,
    marcarLeida as marcarLeidaMock, marcarTodasLeidas as marcarTodasLeidasMock,
} from '../constants/notificacionesMock';
import { procesarProgramadosVencidos } from '../constants/comunicadosMock';

const INTERVALO_MS = 10_000; // 10s

export function useNotificaciones() {
    const { user } = useAuth();
    const [tick, setTick] = useState(0);

    useEffect(() => {
        // Dispara programados vencidos al montar + cada 10s mientras la app este abierta.
        procesarProgramadosVencidos();
        const h = setInterval(() => {
            procesarProgramadosVencidos();
            setTick((t) => t + 1);
        }, INTERVALO_MS);
        return () => clearInterval(h);
    }, []);

    const notificaciones = useMemo(() => notificacionesParaUsuario(user), [user, tick]);
    const noLeidas = useMemo(() => noLeidasParaUsuario(user), [user, tick]);

    const marcarLeida = (id) => { marcarLeidaMock(id, user); setTick((t) => t + 1); };
    const marcarTodas = () => { marcarTodasLeidasMock(user); setTick((t) => t + 1); };
    const refrescar = () => setTick((t) => t + 1);

    return { notificaciones, noLeidas, marcarLeida, marcarTodas, refrescar, usuario: user };
}