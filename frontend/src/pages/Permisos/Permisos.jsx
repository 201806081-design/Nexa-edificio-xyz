import { useState } from 'react';
import {
  Typography, Paper, Tabs, Tab, Checkbox, Button, Box, Tooltip, Alert, Snackbar, Divider,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import DashboardLayout from '../../layouts/DashboardLayout';
import { usePermisos } from '../../hooks/usePermisos';
import { ROLES, PANTALLAS, GRUPOS, esPermisoFijo } from '../../constants/permisos';

const LISTA_ROLES = Object.values(ROLES);

const motivoFijo = (rol, clave) => (clave === 'inicio'
  ? 'Siempre activo: es la pantalla de entrada al sistema'
  : `Siempre activo para ${rol}: si se quitara, nadie podria volver a dar permisos`);

const mismaLista = (a = [], b = []) => a.length === b.length && a.every((c) => b.includes(c));

export default function Permisos() {
  const { permisos, guardarRol } = usePermisos();
  const [tab, setTab] = useState(0);
  const rol = LISTA_ROLES[tab];

  // Borrador de cambios por rol (se edita aqui y se aplica al guardar)
  const [borrador, setBorrador] = useState(() => ({ ...permisos }));
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState(null); // { tipo, texto }

  const seleccion = borrador[rol] ?? [];
  const hayCambios = (r) => !mismaLista(borrador[r], permisos?.[r]);

  const marcar = (claves, activar) => {
    const editables = claves.filter((c) => !esPermisoFijo(rol, c));
    setBorrador((b) => {
      const actual = new Set(b[rol] ?? []);
      editables.forEach((c) => (activar ? actual.add(c) : actual.delete(c)));
      return { ...b, [rol]: [...actual] };
    });
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      const guardados = await guardarRol(rol, seleccion);
      setBorrador((b) => ({ ...b, [rol]: guardados }));
      setAviso({ tipo: 'success', texto: `Permisos de ${rol} guardados.` });
    } catch {
      setAviso({ tipo: 'error', texto: 'No se pudieron guardar los permisos. Intenta de nuevo.' });
    } finally {
      setGuardando(false);
    }
  };

  const descartar = () => setBorrador((b) => ({ ...b, [rol]: [...(permisos?.[rol] ?? [])] }));

  return (
    <DashboardLayout>
      <Typography variant="h1" sx={{ fontSize: '2rem', mb: 0.5 }}>
        Permisos por rol
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Elige que pantallas puede ver cada rol. Al guardar, el menu y los accesos de ese rol se actualizan.
      </Typography>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile>
          {LISTA_ROLES.map((r) => (
            <Tab key={r} label={hayCambios(r) ? `${r} •` : r} sx={{ flexGrow: 1 }} />
          ))}
        </Tabs>
        <Divider />

        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {rol === ROLES.RESIDENTE && (
            <Alert severity="info" sx={{ mb: 2 }}>
              En Estado de cuenta el residente solo ve su propio departamento.
            </Alert>
          )}

          {GRUPOS.map((grupo) => {
            const pantallas = PANTALLAS.filter((p) => p.grupo === grupo);
            const claves = pantallas.map((p) => p.clave);
            const marcadas = claves.filter((c) => seleccion.includes(c)).length;
            const todasFijas = claves.every((c) => esPermisoFijo(rol, c));
            return (
              <Box key={grupo} sx={{ mb: 2.5 }}>
                {/* Cabecera del grupo: marca o quita todas sus pantallas */}
                <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#F3F6FA', borderRadius: 2, pr: 2 }}>
                  <Checkbox
                    checked={marcadas === claves.length}
                    indeterminate={marcadas > 0 && marcadas < claves.length}
                    disabled={todasFijas}
                    onChange={(e) => marcar(claves, e.target.checked)}
                    slotProps={{ input: { 'aria-label': `Todas las pantallas de ${grupo}` } }}
                  />
                  <Typography sx={{ fontWeight: 700, flexGrow: 1 }}>{grupo}</Typography>
                  <Typography variant="body2" color="text.secondary">{marcadas} de {claves.length}</Typography>
                </Box>

                {pantallas.map((p) => {
                  const fijo = esPermisoFijo(rol, p.clave);
                  return (
                    <Box key={p.clave} sx={{ display: 'flex', alignItems: 'center', pl: { xs: 1, sm: 3 }, py: 0.25, borderBottom: '1px solid #EEF2F7' }}>
                      <Checkbox
                        checked={seleccion.includes(p.clave)}
                        disabled={fijo}
                        onChange={(e) => marcar([p.clave], e.target.checked)}
                        slotProps={{ input: { 'aria-label': p.nombre } }}
                      />
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.nombre}</Typography>
                        <Typography variant="caption" color="text.secondary">{p.descripcion}</Typography>
                      </Box>
                      {fijo && (
                        <Tooltip title={motivoFijo(rol, p.clave)}>
                          <LockIcon fontSize="small" sx={{ color: 'text.secondary', ml: 1 }} />
                        </Tooltip>
                      )}
                    </Box>
                  );
                })}
              </Box>
            );
          })}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3, flexWrap: 'wrap' }}>
            <Button variant="outlined" onClick={descartar} disabled={!hayCambios(rol) || guardando}>
              Descartar cambios
            </Button>
            <Button variant="contained" onClick={guardar} disabled={!hayCambios(rol) || guardando}>
              {guardando ? 'Guardando...' : `Guardar permisos de ${rol}`}
            </Button>
          </Box>
        </Box>
      </Paper>

      <Snackbar open={!!aviso} autoHideDuration={3500} onClose={() => setAviso(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        {aviso ? <Alert severity={aviso.tipo} onClose={() => setAviso(null)} sx={{ width: '100%' }}>{aviso.texto}</Alert> : undefined}
      </Snackbar>
    </DashboardLayout>
  );
}
