import {
  actor,
  listeners,
  type EmptyActor,
  type MutatorActor
} from '@sanity/visual-editing/optimistic';
import { readable, type Readable } from 'svelte/store';

// Annotated explicitly so declaration emit doesn't depend on naming xstate's
// inferred actor types, which aren't portable
export const optimisticActor: Readable<MutatorActor | EmptyActor> = readable(actor, (set) => {
  const listener = () => {
    set(actor);
  };

  listeners.add(listener);

  return () => {
    actor.stop();
    listeners.delete(listener);
  };
});
