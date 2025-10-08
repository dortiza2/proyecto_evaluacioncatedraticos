import type { MDXComponents } from 'mdx/types';
import defaultComponents from 'fumadocs-ui/mdx';
import { Steps, Step } from 'fumadocs-ui/components/steps';
import { Card, Cards } from 'fumadocs-ui/components/card';

export function useMDXComponents(components: MDXComponents = {}): MDXComponents {
  return {
    ...defaultComponents,
    Steps,
    Step,
    Card,
    Cards,
    ...components,
  };
}
