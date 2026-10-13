import ChevronRightSharp from '@mui/icons-material/ChevronRightSharp';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router';

import { PageHeader } from '@/components/PageHeader';
import { paths } from '@/router/paths';
import { colors } from '@/theme/tokens';

const sections = [
  {
    title: 'Agenda do dia',
    description: 'Todas as reservas do dia por recurso, com cancelamento administrativo.',
    to: paths.adminAgenda,
  },
  {
    title: 'Usuários',
    description: 'Crie contas de alunos, professores e administradores e consulte quem tem acesso.',
    to: paths.adminUsers,
  },
  {
    title: 'Recursos',
    description: 'Cadastre, edite e desative salas, laboratórios, auditórios e equipamentos.',
    to: paths.adminResources,
  },
  {
    title: 'Blocos e características',
    description: 'Prédios do campus e os atributos usados nos filtros da busca.',
    to: paths.adminBuildings,
  },
] as const;

export default function AdminPage() {
  return (
    <>
      <PageHeader
        title="Administração"
        description="Contas, blocos, recursos e a agenda do campus."
      />
      <Box
        component="ul"
        sx={{ listStyle: 'none', m: 0, p: 0, borderTop: 1, borderColor: 'divider' }}
      >
        {sections.map((section) => (
          <Box component="li" key={section.to} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Box
              component={RouterLink}
              to={section.to}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                py: 2,
                color: 'text.primary',
                textDecoration: 'none',
                '&:hover h2': { color: colors.primary, textDecoration: 'underline' },
              }}
            >
              <Box>
                <Typography variant="h2" sx={{ fontSize: '1.25rem' }}>
                  {section.title}
                </Typography>
                <Typography color="text.secondary">{section.description}</Typography>
              </Box>
              <ChevronRightSharp aria-hidden />
            </Box>
          </Box>
        ))}
      </Box>
    </>
  );
}
