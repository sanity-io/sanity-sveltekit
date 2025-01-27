// Visual Editing
export { default as VisualEditing } from './visual-editing/VisualEditing.svelte';

// Live Content API
export { default as LiveLoader } from './live/LiveLoader.svelte';
export { handleLiveLoader, type HandleLiveLoaderConfig } from './live/handleLiveLoader';
export { sanityFetch } from './live/sanityFetch';

// Query Loader
export { default as QueryLoader } from './query/QueryLoader.svelte';
export { handleQueryLoader, type HandleQueryLoaderConfig } from './query/handleQueryLoader';
export {
  loadQuery,
  setServerClient,
  unstable__serverClient,
  useLiveMode,
  useQuery
} from './query/store/createQueryStore';

// Context
export { environment, setEnvironment, type DraftEnvironment } from './context/environment';
export { perspective, setPerspective, type DraftPerspective } from './context/perspective';
export { isPreviewing, setPreviewing } from './context/preview';

// Preview
export { default as PreviewMode } from './preview/PreviewMode.svelte';
export { handlePreviewMode, type HandlePreviewModeConfig } from './preview/handlePreviewMode';

// Optimistic
export { useOptimistic } from './optimistic/useOptimistic';
export { optimisticActor } from './optimistic/optimisticActor';

// Types
export type { SanityLocals, VisualEditingProps } from './types';
