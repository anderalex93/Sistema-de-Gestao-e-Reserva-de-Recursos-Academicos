import { config } from '@/config';
import { seoPageFor } from '@/seo/public-seo';

/**
 * Descrição e canonical das páginas públicas (#48), renderizados pelo React 19 no <head>.
 * Página pública sem entrada de SEO (o comprovante) fica fora dos buscadores: mostra o
 * primeiro nome de quem reservou.
 */
export function PublicPageMeta({ pathname }: { pathname: string }) {
  const page = seoPageFor(pathname);
  if (!page) return <meta name="robots" content="noindex" />;
  return (
    <>
      <meta name="description" content={page.description} />
      {config.siteUrl && (
        <link rel="canonical" href={`${config.siteUrl}${page.path === '/' ? '/' : page.path}`} />
      )}
    </>
  );
}
