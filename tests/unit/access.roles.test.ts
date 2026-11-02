import { describe, expect, it } from 'vitest';
import { accessDecision, type AccessContext } from '../../src/app/access';
import { homeOf, matchRoute, ROLE_LABEL, type Role } from '../../src/app/router';

const ctx: AccessContext = {
  consultorProjectIds: ['P-A', 'P-B', 'P-C', 'P-D'],
  deliveryExists: () => true,
};

const HASHES: Record<Role, string[]> = {
  consultor: [
    '#/consultor',
    '#/consultor/proyectos/P-B/evidencia',
    '#/consultor/proyectos/P-B/diagnostico',
    '#/consultor/proyectos/P-B/revision',
    '#/consultor/proyectos/P-B/estrategia',
    '#/consultor/proyectos/P-B/informe',
  ],
  lider: ['#/lider', '#/lider/entregas', '#/lider/entregas/dx/P-B', '#/lider/entregas/st/P-C', '#/lider/entregas/dx/P-B/informe'],
  contacto: ['#/contacto', '#/contacto/encuesta'],
};
const ROLES = Object.keys(HASHES) as Role[];

describe('control por rol: cualquier ruta de otro rol redirige al inicio del rol activo (FR-003)', () => {
  for (const active of ROLES) {
    for (const owner of ROLES.filter((r) => r !== active)) {
      for (const hash of HASHES[owner]) {
        it(`${ROLE_LABEL[active]} no puede abrir ${hash}`, () => {
          expect(matchRoute(hash)?.role).toBe(owner); // la tabla de pruebas es correcta
          const r = accessDecision(hash, active, ctx);
          expect(r).toEqual({
            kind: 'redirect',
            to: homeOf(active),
            notice: `Esa vista pertenece al rol ${ROLE_LABEL[owner]}. Estás como ${ROLE_LABEL[active]}.`,
          });
        });
      }
    }
  }
  it('cada rol sí puede abrir sus propias rutas', () => {
    for (const role of ROLES) {
      for (const hash of HASHES[role]) expect(accessDecision(hash, role, ctx).kind).toBe('allow');
    }
  });
});
