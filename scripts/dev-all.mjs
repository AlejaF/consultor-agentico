// Arranca el servicio local y Vite juntos y los cierra a la vez. Sin dependencias extra.
// El servicio lee `server/.env` por su cuenta; este script no lo abre ni imprime nada de él.
import { spawn } from 'node:child_process';

const procs = [
  { name: 'servicio', cmd: 'npm', args: ['run', 'dev', '--prefix', 'server'] },
  { name: 'vite', cmd: 'npm', args: ['run', 'dev'] },
];

const children = procs.map(({ name, cmd, args }) => {
  // detached: cada proceso lidera su propio grupo, para poder cerrar también a sus hijos (npm → node).
  const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], shell: process.platform === 'win32', detached: process.platform !== 'win32' });
  const tag = (stream, out) => stream.on('data', (d) => out.write(String(d).replace(/^/gm, `[${name}] `)));
  tag(child.stdout, process.stdout);
  tag(child.stderr, process.stderr);
  child.on('exit', (code) => {
    console.log(`[${name}] terminó (código ${code ?? 'señal'}); cerrando el otro proceso.`);
    stopAll();
  });
  return child;
});

let stopping = false;
function stopAll() {
  if (stopping) return;
  stopping = true;
  for (const c of children) {
    try {
      if (process.platform === 'win32') c.kill('SIGTERM');
      else process.kill(-c.pid, 'SIGTERM'); // todo el grupo de procesos
    } catch {
      /* ya terminó */
    }
  }
  setTimeout(() => process.exit(0), 300);
}
process.on('SIGINT', stopAll);
process.on('SIGTERM', stopAll);
