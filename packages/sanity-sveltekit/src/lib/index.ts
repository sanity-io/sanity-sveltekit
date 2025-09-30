// Visual Editing
export { default as VisualEditing } from './visual-editing/VisualEditing.svelte';
export * from './visual-editing/createDataAttribute';

// Live Content API
export { default as LiveLoader } from './live/LiveLoader.svelte';
export { handleLiveLoader, type HandleLiveLoaderConfig } from './live/handleLiveLoader';
export { sanityFetch } from './live/sanityFetch';

// Query Loader
export { default as QueryLoader } from './query/QueryLoader.svelte';
export { handleQueryLoader, type HandleQueryLoaderConfig } from './query/handleQueryLoader';
export { loadQuery, setServerClient, useLiveMode, useQuery } from './query/store/createQueryStore';

// Context
export { getEnvironment, setEnvironment, type DraftEnvironment } from './context/environment';
export { getPerspective, setPerspective, type DraftPerspective } from './context/perspective';
export { getIsPreviewing, setIsPreviewing } from './context/previewing';
export { getLoader, setLoader, type LoaderType } from './context/loader';

// Preview
export { default as PreviewMode } from './preview/PreviewMode.svelte';
export { handlePreviewMode, type HandlePreviewModeConfig } from './preview/handlePreviewMode';

// Optimistic
export { useOptimistic } from './optimistic/useOptimistic';
export { optimisticActor } from './optimistic/optimisticActor';

// Types
export type { SanityLocals, VisualEditingProps } from './types';

// Studio
export { default as SanityStudio } from './studio/SanityStudio.svelte';

// Client
export * from './client';

// Groq
export * from './groq';
