import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { schema } from './schemaTypes';
import { presentationTool } from 'sanity/presentation';

const projectId = typeof process !== 'undefined' ? process.env.PUBLIC_SANITY_PROJECT_ID! : '';
const dataset = typeof process !== 'undefined' ? process.env.PUBLIC_SANITY_DATASET! : '';
const origin = typeof process !== 'undefined' ? process.env.PUBLIC_SANITY_APP_URL! : '';

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
        origin,
        previewMode: {
          enable: '/preview/enable',
          disable: '/preview/disable'
        }
      }
    })
  ],

  schema
});
