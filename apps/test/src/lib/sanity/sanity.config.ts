import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { schema } from './schemaTypes';
import { presentationTool } from 'sanity/presentation';

const projectId = typeof process !== 'undefined' ? process.env.PUBLIC_SANITY_PROJECT_ID! : '';
const dataset = typeof process !== 'undefined' ? process.env.PUBLIC_SANITY_DATASET! : '';

export default defineConfig({
  name: 'default',
  title: 'sanity-sveltekit',

  projectId,
  dataset,

  basePath: '/studio',
  plugins: [
    structureTool(),
    presentationTool({
      previewUrl: {
        origin: 'http://localhost:3333',
        previewMode: {
          enable: '/preview/enable',
          disable: '/preview/disable'
        }
      }
    })
  ],

  schema
});
