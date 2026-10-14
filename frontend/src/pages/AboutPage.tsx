import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router';

import { DetailList } from '@/components/DetailList';
import { PageHeader } from '@/components/PageHeader';
import { institution, team, teamPhoto } from '@/content/public-content';
import { paths } from '@/router/paths';

export default function AboutPage() {
  return (
    <>
      <PageHeader
        title="Sobre o EduSpace"
        overline="Projeto Integrador I"
        description="Quem fez, para quê e em que disciplina."
      />
      <Stack spacing={4}>
        <Box component="section" aria-labelledby="sobre-projeto">
          <Typography id="sobre-projeto" variant="h2" sx={{ mb: 1.5 }}>
            O projeto
          </Typography>
          <Typography sx={{ maxWidth: '65ch', mb: 1.5 }}>
            O EduSpace nasceu para acabar com a sala ociosa e com o conflito de horário. Cada sala
            de estudo, laboratório, auditório e equipamento do campus pode ser reservado pelo
            celular, com regras claras e um comprovante que qualquer pessoa confere na entrada.
          </Typography>
          <Typography sx={{ maxWidth: '65ch' }}>
            Antes, a reserva dependia de recado, planilha ou de chegar primeiro. Agora a grade
            mostra o que está livre e o sistema não deixa duas pessoas reservarem o mesmo horário.{' '}
            <Link component={RouterLink} to={paths.help}>
              Veja como funciona na Ajuda
            </Link>
            .
          </Typography>
        </Box>

        <Box component="section" aria-labelledby="sobre-equipe">
          <Typography id="sobre-equipe" variant="h2" sx={{ mb: 1.5 }}>
            Equipe
          </Typography>
          {teamPhoto && (
            <Box
              component="img"
              src={teamPhoto.src}
              alt={teamPhoto.alt}
              width={teamPhoto.width}
              height={teamPhoto.height}
              loading="lazy"
              sx={{ display: 'block', width: '100%', height: 'auto', mb: 2.5 }}
            />
          )}
          <DetailList items={team.map((member) => ({ label: member.papel, value: member.nome }))} />
        </Box>

        <Box component="section" aria-labelledby="sobre-disciplina">
          <Typography id="sobre-disciplina" variant="h2" sx={{ mb: 1.5 }}>
            Disciplina e instituição
          </Typography>
          <Typography sx={{ maxWidth: '65ch' }}>
            Projeto da disciplina Projeto Integrador I do{' '}
            <Link href={institution.url} target="_blank" rel="noopener">
              {institution.nome}
            </Link>{' '}
            ({institution.sigla}), em {institution.cidade}, {institution.estado}, em 2026.
          </Typography>
        </Box>
      </Stack>
    </>
  );
}
