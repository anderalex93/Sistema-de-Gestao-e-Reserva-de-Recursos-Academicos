import Link from '@mui/material/Link';
import { Link as RouterLink } from 'react-router';

import { LegalDocument, type LegalSection } from '@/components/legal/LegalDocument';
import { paths } from '@/router/paths';

const sections: readonly LegalSection[] = [
  {
    title: 'Quem trata os seus dados',
    body: (
      <p>
        O EduSpace é o sistema de reserva de salas de estudo, laboratórios, auditórios e
        equipamentos do campus da UMJ, desenvolvido no Projeto Integrador I. Quem decide sobre o uso
        dos dados é a administração do campus, que opera o sistema.
      </p>
    ),
  },
  {
    title: 'Quais dados guardamos e por quê',
    body: (
      <ul>
        <li>
          <strong>Nome e e-mail:</strong> identificar quem reserva e permitir que a administração
          avise você sobre mudanças na sua reserva.
        </li>
        <li>
          <strong>Matrícula (opcional):</strong> confirmar o vínculo com a instituição, quando você
          informa.
        </li>
        <li>
          <strong>Senha:</strong> guardada só como código irreversível (hash). Ninguém, nem a
          administração, consegue ver a sua senha.
        </li>
        <li>
          <strong>Reservas:</strong> espaço, horário, finalidade e número de participantes, para
          organizar o uso dos espaços e evitar conflitos.
        </li>
        <li>
          <strong>Data do aceite deste aviso:</strong> comprovar que você foi informado.
        </li>
      </ul>
    ),
  },
  {
    title: 'Base legal',
    body: (
      <p>
        Tratamos esses dados para prestar o serviço de reservas que você pediu ao criar a conta (Lei
        13.709/2018, Art. 7º, V). Não tratamos dados sensíveis e não usamos os dados para
        publicidade.
      </p>
    ),
  },
  {
    title: 'Quem vê os seus dados',
    body: (
      <ul>
        <li>Outras pessoas veem só que um horário está ocupado, nunca quem reservou.</li>
        <li>
          O comprovante público mostra apenas o seu primeiro nome, para conferência na entrada do
          espaço.
        </li>
        <li>
          A administração do campus vê nome, e-mail e reservas para gerir os espaços e, se precisar
          cancelar uma reserva, informar o motivo.
        </li>
        <li>
          O sistema roda em provedores de hospedagem em nuvem, que podem guardar os dados fora do
          Brasil, sob contrato e com as garantias exigidas pela lei (Arts. 33 a 36).
        </li>
      </ul>
    ),
  },
  {
    title: 'Por quanto tempo',
    body: (
      <ul>
        <li>A conta fica guardada enquanto você usar o sistema ou até você pedir a exclusão.</li>
        <li>
          As reservas ficam guardadas por até 2 anos depois da data, para histórico e estatística de
          uso dos espaços, e depois deixam de identificar você.
        </li>
      </ul>
    ),
  },
  {
    title: 'Cookies e armazenamento no navegador',
    body: (
      <p>
        Guardamos no seu navegador só o código da sua sessão, necessário para você continuar
        conectado. Não usamos cookies de publicidade. Se passarmos a medir o uso do sistema com o
        Google Analytics, ele só funcionará depois que você aceitar no aviso de cookies, e você
        poderá mudar a escolha a qualquer momento.
      </p>
    ),
  },
  {
    title: 'Seus direitos',
    body: (
      <>
        <p>Você pode, a qualquer momento e sem custo (Art. 18):</p>
        <ul>
          <li>
            ver e baixar todos os seus dados em <strong>Minha conta</strong>, botão "Baixar meus
            dados";
          </li>
          <li>corrigir dados errados, pedindo à administração do campus;</li>
          <li>
            excluir a sua conta em <strong>Minha conta</strong>. O nome, o e-mail e a matrícula são
            apagados, as reservas futuras são canceladas e as antigas ficam no histórico do espaço
            sem identificar você.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: 'Segurança',
    body: (
      <p>
        A comunicação é criptografada (HTTPS), a senha é guardada como hash, cada pessoa só acessa
        as próprias reservas e as tentativas de login são limitadas. Se acontecer um incidente que
        coloque os seus dados em risco, avisaremos você e a Agência Nacional de Proteção de Dados
        (ANPD).
      </p>
    ),
  },
  {
    title: 'Contato',
    body: (
      <p>
        Dúvidas ou pedidos sobre os seus dados: fale com a administração do campus da UMJ. Você
        também pode registrar reclamação na ANPD (gov.br/anpd). Veja também os{' '}
        <Link component={RouterLink} to={paths.terms}>
          Termos de Uso
        </Link>
        .
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Aviso de Privacidade"
      description="Quais dados o EduSpace guarda, para quê, por quanto tempo e como você controla."
      updatedAt="13/10/2026"
      sections={sections}
    />
  );
}
