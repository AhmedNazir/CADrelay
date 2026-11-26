import type { CanvasComponent, WireSegment } from '../store/canvasStore';

export interface ProjectFile {
  version: string;
  name: string;
  components: CanvasComponent[];
  wires: WireSegment[];
  savedAt: string;
}

export function saveProjectJSON(name: string, components: CanvasComponent[], wires: WireSegment[]) {
  const data: ProjectFile = {
    version: '1.2.0',
    name,
    components,
    wires,
    savedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name.replace(/\s+/g, '_')}.cdr`;
  a.click();
  URL.revokeObjectURL(url);
}

export function loadProjectJSON(): Promise<ProjectFile> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.cdr,.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return reject(new Error('No file selected'));
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string) as ProjectFile;
          if (!data.components || !data.wires) throw new Error('Invalid format');
          resolve(data);
        } catch {
          reject(new Error('Invalid project file format'));
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });
}

export function exportToPNG(stage: any, filename = 'cadrelay-circuit.png') {
  if (!stage) return;
  const dataUrl = stage.toDataURL({ pixelRatio: 2 });
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
