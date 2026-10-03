// The edit: which scene plays when. Boundaries are anchored to lyric lines and snapped
// to the beat grid for 《犯罪学》(CRIMINOLOGY).
import type { TimelineEntry } from './engine/engine';
import type { SceneClass } from './engine/scene';
import type { Lyrics } from './engine/lyrics';
import type { AudioData } from './engine/audio';

const modules = import.meta.glob<{ default: SceneClass }>('./scenes/*.ts');
const scene = (name: string) => () => {
  const m = modules[`./scenes/${name}.ts`];
  return m ? m() : Promise.reject(new Error(`scene module not found: scenes/${name}.ts`));
};

export function makeTimeline(ly: Lyrics, au: AudioData): TimelineEntry[] {
  const E = (id: string, file: string, start: number, end: number, extra: Partial<TimelineEntry> = {}): TimelineEntry =>
    ({ id, load: scene(file), start, end, ...extra });

  return [
    E('dossier', 'crim_dossier', 0.0, 4.0),
    E('uv', 'crim_uv', 4.0, 8.0),
    E('ballistics', 'crim_ballistics', 8.0, 12.5),
    E('locard', 'crim_locard', 12.5, 17.0),
    E('profiler', 'crim_profiler', 17.0, 24.5),
    E('title', 'crim_title', 24.5, 28.5),
    E('archive', 'crim_archive', 28.5, au.duration || 34.0),
  ];
}
