import Link from '@mui/material/Link';
import { Link as RouterLink } from 'react-router';

import { LegalDocument, type LegalSection } from '@/components/legal/LegalDocument';
import { paths } from '@/router/paths';

const sections: readonly LegalSection[] = [
  {
    title: 'Quem pode usar',
    body: (
      <p>
        Alunos, professores e funcionários da UMJ. Cada conta é pessoal: não empreste a sua senha
        nem reserve em nome de outra pessoa.
      </p>
    ),
  },
  {
    title: 'Como funcionam as reservas',
    body: (
      <ul>
        <li>Reservas começam e terminam em horas cheias ou meias horas, no horário do campus.</li>
        <li>
          Há limites de duração, de antecedência e de reservas ativas por perfil. Os valores atuais
          aparecem na tela de reserva.
        </li>
        <li>O comprovante tem um código que pode ser conferido na entrada do espaço.</li>
      </ul>
    ),
  },
  {
    title: 'Cancelamento',
    body: (
      <ul>
        <li>
          Você pode cancelar a sua reserva até 30 minutos antes do início, em Minhas reservas.
        </li>
        <li>
          A administração pode cancelar qualquer reserva em caso de manutenção, evento institucional
          ou mau uso, sempre informando o motivo, que aparece no seu histórico.
        </li>
        <li>Se não for usar o espaço, cancele: o horário fica livre para outra pessoa.</li>
      </ul>
    ),
  },
  {
    title: 'Uso dos espaços e equipamentos',
    body: (
      <ul>
        <li>Respeite o horário reservado e a capacidade do espaço.</li>
        <li>Deixe o espaço organizado e os equipamentos como encontrou.</li>
        <li>Avise a administração sobre qualquer dano ou defeito.</li>
        <li>Quem reservou responde pelo uso do espaço durante o horário da reserva.</li>
      </ul>
    ),
  },
  {
    title: 'Suspensão',
    body: (
      <p>
        Mau uso, reservas feitas para não usar ou uso da conta de outra pessoa podem levar à
        desativação da conta pela administração. O histórico de reservas continua guardado.
      </p>
    ),
  },
  {
    title: 'Privacidade',
    body: (
      <p>
        O tratamento dos seus dados segue o{' '}
        <Link component={RouterLink} to={paths.privacy}>
          Aviso de Privacidade
        </Link>
        .
      </p>
    ),
  },
  {
    title: 'Mudanças nestes termos',
    body: (
      <p>
        Se as regras mudarem, a data desta versão é atualizada. Mudanças importantes serão avisadas
        no sistema.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalDocument
      title="Termos de Uso"
      description="As regras para reservar e usar os espaços e equipamentos do campus."
      updatedAt="13/10/2026"
      sections={sections}
    />
  );
}
