import { Box } from '@mui/material';
import { keyframes } from '@emotion/react';

// Ilustracion del Edificio XYZ: 3 pisos x 3 deptos (101 a 303), igual que edificioMock.
// Las ventanas se encienden de forma escalonada y las nubes se desplazan lento.

const encender = keyframes`
  0%, 100% { fill: #C5E0F2; }
  45%, 70% { fill: #FFD98A; }
`;

const flotar = keyframes`
  0%   { transform: translateX(-20px); }
  50%  { transform: translateX(20px); }
  100% { transform: translateX(-20px); }
`;

const PISOS = [3, 2, 1];
const COLUMNAS = [0, 1, 2];

export default function EdificioAnimado() {
  return (
    <Box
      component="svg"
      viewBox="0 0 240 200"
      role="img"
      aria-label="Edificio XYZ"
      sx={{
        width: { xs: 180, md: 240 },
        height: 'auto',
        '& .ventana': { animation: `${encender} 6s ease-in-out infinite` },
        '& .nube': { animation: `${flotar} 14s ease-in-out infinite` },
        '@media (prefers-reduced-motion: reduce)': {
          '& .ventana, & .nube': { animation: 'none' },
        },
      }}
    >
      {/* Nubes */}
      <g className="nube" fill="rgba(255,255,255,0.35)">
        <ellipse cx="40" cy="38" rx="22" ry="8" />
        <ellipse cx="54" cy="32" rx="14" ry="8" />
      </g>
      <g className="nube" fill="rgba(255,255,255,0.25)" style={{ animationDelay: '-7s' }}>
        <ellipse cx="200" cy="58" rx="18" ry="6" />
        <ellipse cx="210" cy="53" rx="11" ry="6" />
      </g>

      {/* Cuerpo del edificio */}
      <rect x="70" y="40" width="100" height="150" rx="4" fill="#FFFFFF" />
      <rect x="64" y="32" width="112" height="12" rx="3" fill="#132B3E" />
      <rect x="112" y="18" width="16" height="14" fill="#132B3E" />

      {/* Ventanas: piso 3 arriba, piso 1 abajo */}
      {PISOS.map((piso, fila) =>
        COLUMNAS.map((col) => (
          <rect
            key={`${piso}0${col + 1}`}
            className="ventana"
            x={82 + col * 28}
            y={56 + fila * 34}
            width="20"
            height="22"
            rx="2"
            fill="#C5E0F2"
            style={{ animationDelay: `${(fila * 3 + col) * 0.6}s` }}
          />
        )),
      )}

      {/* Puerta y suelo */}
      <rect x="108" y="160" width="24" height="30" rx="2" fill="#1F5F8B" />
      <rect x="40" y="190" width="160" height="4" rx="2" fill="rgba(255,255,255,0.5)" />
    </Box>
  );
}
