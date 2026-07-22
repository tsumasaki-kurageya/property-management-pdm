import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        sourceFile: z.string().optional(),
        sourceVersion: z.string().optional(),
        contentStatus: z.enum(['原本', '原本から自動生成', '本文として再構成']).optional(),
        generated: z.boolean().optional(),
      }),
    }),
  }),
};
