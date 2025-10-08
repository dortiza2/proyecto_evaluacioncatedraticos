import { map } from '@/.map';
import { createMDXSource } from 'fumadocs-mdx';
import { loader } from 'fumadocs-core/source';

export const { getPage, getPages, pageTree } = loader({
  baseUrl: '/docs',
  // El contenido MDX está bajo "content/docs" relativo al proyecto apps/web
  rootDir: 'content/docs',
  source: createMDXSource(map),
});