import { useState } from 'react';
import {
  Typography, Paper, Tabs, Tab, Table, TableBody, TableRow, TableCell,
  Checkbox, Button, Box,
} from '@mui/material';
import DashboardLayout from '../../layouts/DashboardLayout';
import { ROLES, MODULOS, PERMISOS_POR_ROL } from '../../constants/permisos';

const LISTA_ROLES = Object.values(ROLES);

// Texto que se muestra segun el nivel de permiso
function textoPermiso(nivel) {
  if (nivel === 'total') return 'Permitir acceso';
  if (nivel === 'consulta') return 'Solo consulta';
  return 'Sin acceso';
}

export default function Permisos() {
  const [tab, setTab] = useState(0);
  const rolActual = LISTA_ROLES[tab];
  const permisos = PERMISOS_POR_ROL[rolActual];

  return (
    <DashboardLayout>
      <Typography variant="h1" sx={{ fontSize: '2rem', mb: 0.5 }}>
        Permisos por rol
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Define las funcionalidades disponibles para cada rol.
      </Typography>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="fullWidth">
          {LISTA_ROLES.map((r) => (
            <Tab key={r} label={r} />
          ))}
        </Tabs>

        <Box sx={{ p: 3 }}>
          <Typography variant="h3" sx={{ fontSize: '1.1rem', fontWeight: 600, mb: 0.5 }}>
            Funcionalidades permitidas
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Selecciona las funcionalidades disponibles para este rol.
          </Typography>

          <Table>
            <TableBody>
              {MODULOS.map((modulo) => {
                const nivel = permisos[modulo];
                return (
                  <TableRow key={modulo}>
                    <TableCell sx={{ fontWeight: 500 }}>{modulo}</TableCell>
                    <TableCell align="right" sx={{ width: 200 }}>
                      <Checkbox checked={nivel !== 'ninguno'} disabled />
                      <Typography component="span" variant="body2" color="text.secondary">
                        {textoPermiso(nivel)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
            <Button variant="outlined">Cancelar</Button>
            <Button variant="contained">Guardar permisos</Button>
          </Box>
        </Box>
      </Paper>
    </DashboardLayout>
  );
}
