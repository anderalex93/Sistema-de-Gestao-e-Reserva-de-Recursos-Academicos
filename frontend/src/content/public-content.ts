/**
 * Textos das páginas públicas (#47). Só dados, sem React: as páginas os exibem e o build os
 * usa nas metatags e no JSON-LD (#48). Revisados pela seção 9 do design system.
 */

export interface FaqItem {
  pergunta: string;
  resposta: string;
}

export interface TeamMember {
  nome: string;
  papel: string;
}

export interface Photo {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export const institution = {
  nome: 'Centro Universitário Mário Pontes Jucá',
  sigla: 'UMJ',
  cidade: 'Maceió',
  estado: 'AL',
  url: 'https://umj.edu.br',
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=Centro+Universit%C3%A1rio+M%C3%A1rio+Pontes+Juc%C3%A1+Macei%C3%B3',
} as const;

export const product = {
  nome: 'EduSpace',
  titulo: 'Reserve salas, laboratórios e equipamentos do campus em poucos toques.',
  subtitulo: 'Veja o que está livre, escolha o horário e receba o comprovante no celular.',
  descricao:
    'Reserva de salas de estudo, laboratórios, auditório e equipamentos do campus da UMJ, ' +
    'com grade de horários, comprovante com QR code e cancelamento pelo celular.',
} as const;

/** "Como funciona": a jornada do relatório, do login ao comprovante. */
export const steps = [
  { titulo: 'Entre com o e-mail da UMJ.', detalhe: 'A conta fica pronta na hora.' },
  { titulo: 'Filtre por bloco, tipo e horário.', detalhe: 'Só aparece o que está livre.' },
  {
    titulo: 'Escolha o horário na grade e confirme.',
    detalhe: 'O sistema não deixa duas pessoas reservarem o mesmo horário.',
  },
  {
    titulo: 'Apresente o comprovante na entrada.',
    detalhe: 'O QR code mostra a situação atual da reserva.',
  },
] as const;

/** As cinco perguntas da página inicial (#47). */
export const mainFaq: readonly FaqItem[] = [
  {
    pergunta: 'Quem pode reservar?',
    resposta:
      'Alunos, professores e a equipe da UMJ. A conta é criada com o e-mail institucional, ' +
      'em menos de um minuto.',
  },
  {
    pergunta: 'Até quando posso cancelar?',
    resposta:
      'Até 30 minutos antes do início, em Minhas reservas. O horário volta a ficar livre ' +
      'para outras pessoas na hora.',
  },
  {
    pergunta: 'Quanto tempo posso reservar?',
    resposta:
      'Até 4 horas por reserva, em blocos de 30 minutos, com até 14 dias de antecedência. ' +
      'Alunos podem ter até 3 reservas futuras ao mesmo tempo, e professores, até 10.',
  },
  {
    pergunta: 'Como apresento o comprovante?',
    resposta:
      'Mostre o comprovante no celular ou impresso. Quem confere lê o QR code e vê se a ' +
      'reserva está confirmada, sem precisar de login.',
  },
  {
    pergunta: 'Quem cadastra as salas e os equipamentos?',
    resposta:
      'A administração do campus. Ela mantém blocos, salas, laboratórios e equipamentos ' +
      'atualizados e pode desativar um espaço em manutenção.',
  },
];

/** Perguntas extras da Ajuda; a Ajuda mostra as principais e estas. */
export const helpFaq: readonly FaqItem[] = [
  ...mainFaq,
  {
    pergunta: 'Esqueci minha senha. E agora?',
    resposta:
      'A recuperação de senha por e-mail ainda não está disponível. Procure a administração ' +
      'do campus para redefinir o acesso.',
  },
  {
    pergunta: 'O horário que eu queria sumiu da grade.',
    resposta:
      'Outra pessoa reservou antes. A grade se atualiza sozinha a cada poucos segundos; ' +
      'escolha outro horário ou outro espaço.',
  },
  {
    pergunta: 'Posso reservar para um grupo?',
    resposta:
      'Sim. Informe o número de participantes no resumo da reserva, até a capacidade do espaço.',
  },
  {
    pergunta: 'Equipamentos também são reservados aqui?',
    resposta:
      'Sim. Projetores, kits de transmissão, caixas de som e notebooks aparecem junto com as ' +
      'salas. A retirada é no apoio audiovisual do Bloco D.',
  },
  {
    pergunta: 'Como vejo ou apago os meus dados?',
    resposta:
      'Em Minha conta você baixa tudo o que o EduSpace guarda sobre você e pode excluir a ' +
      'conta. Os detalhes estão no Aviso de Privacidade.',
  },
];

export const team: readonly TeamMember[] = [
  { nome: 'Anderson Alex', papel: 'Product Owner' },
  { nome: 'José Amaral', papel: 'Scrum Master' },
  { nome: 'Ramon Albuquerque', papel: 'Desenvolvimento full stack' },
];

/**
 * Foto real da equipe na página Sobre. O design system proíbe foto de banco de imagem: sem uma
 * foto real (em `public/`, com largura e altura), a página mostra só os nomes.
 */
export const teamPhoto: Photo | null = null;

/** Prazo de resposta prometido junto ao canal de suporte. */
export const supportResponseTime = 'Respondemos em até 1 dia útil.';
