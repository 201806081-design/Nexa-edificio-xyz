import HomeIcon from '@mui/icons-material/Home';
import GroupIcon from '@mui/icons-material/Group';
import ShieldIcon from '@mui/icons-material/Shield';
import PeopleIcon from '@mui/icons-material/People';
import DomainIcon from '@mui/icons-material/Domain';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import DescriptionIcon from '@mui/icons-material/Description';
import PaymentIcon from '@mui/icons-material/Payment';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import BarChartIcon from '@mui/icons-material/BarChart';
import ScheduleIcon from '@mui/icons-material/Schedule';
import WorkIcon from '@mui/icons-material/Work';
import BadgeIcon from '@mui/icons-material/Badge';
import PaidIcon from '@mui/icons-material/Paid';
import CampaignIcon from '@mui/icons-material/Campaign';
import EditIcon from '@mui/icons-material/Edit';
import SendIcon from '@mui/icons-material/Send';
import DraftsIcon from '@mui/icons-material/Drafts';

// Iconos del menu lateral y de los accesos de Inicio (claves de PANTALLAS en constants/permisos.js)
export const ICONO_PANTALLA = {
  inicio: <HomeIcon />,
  usuarios: <GroupIcon />,
  permisos: <ShieldIcon />,
  copropietarios: <PeopleIcon />,
  unidades: <DomainIcon />,
  'finanzas.resumen': <DescriptionIcon />,
  'finanzas.dashboard': <BarChartIcon />,
  'finanzas.expensas': <DescriptionIcon />,
  'finanzas.pagos': <PaymentIcon />,
  'finanzas.estadoCuenta': <ReceiptLongIcon />,
  'finanzas.ingresosGastos': <BarChartIcon />,
  'finanzas.mora': <ScheduleIcon />,
  'personal.empleados': <BadgeIcon />,
  'personal.planilla': <PaidIcon />,
  'personal.historialPagos': <ScheduleIcon />,
  'comunicados.elaborar': <EditIcon />,
  'comunicados.enviados': <SendIcon />,
  'comunicados.borradores': <DraftsIcon />,
};

// Iconos de las opciones con submenu
export const ICONO_GRUPO = {
  Finanzas: <AccountBalanceWalletIcon />,
  Personal: <WorkIcon />,
  Comunicados: <CampaignIcon />,
};
