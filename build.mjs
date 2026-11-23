import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
for (const name of await readdir('.')) {
  if (name.endsWith('.html') || ['styles.css', 'main.js', '_headers', '_redirects', 'fonts', 'media'].includes(name)) {
    await cp(name, join('dist', name), { recursive: true });
  }
}
