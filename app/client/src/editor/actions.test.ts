import { describe, it, expect } from 'vitest';
import { unlockSectionsInProjectData } from './actions';

// SECDEL-01. These lock the migration's two load-bearing properties:
//   1. it clears the legacy lock flags on mj-section only
//   2. it DELETES the keys (never writes `true`) -- `draggable` on an mjml component is a target
//      selector string, so a boolean would widen the drop constraint and allow invalid MJML
//   3. it converges (idempotent), so assertRoundTrip does not stay permanently red
describe('unlockSectionsInProjectData', () => {
  const legacyDraft = () => ({
    pages: [
      {
        frames: [
          {
            component: {
              type: 'mjml',
              components: [
                {
                  type: 'mj-body',
                  components: [
                    {
                      type: 'mj-section',
                      removable: false,
                      draggable: false,
                      components: [
                        { type: 'mj-column', components: [{ type: 'mj-text', removable: false }] },
                      ],
                    },
                    { tagName: 'mj-section', removable: false },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  });

  it('deletes the lock flags on mj-section rather than setting them true', () => {
    const data = legacyDraft();
    const unlocked = unlockSectionsInProjectData(data);

    const body = data.pages[0].frames[0].component.components[0];
    const section = body.components[0] as Record<string, unknown>;

    expect(unlocked).toBe(2);
    expect('removable' in section).toBe(false);
    expect('draggable' in section).toBe(false);
  });

  it('matches sections declared by tagName as well as by type', () => {
    const data = legacyDraft();
    unlockSectionsInProjectData(data);

    const body = data.pages[0].frames[0].component.components[0];
    const byTagName = body.components[1] as Record<string, unknown>;

    expect('removable' in byTagName).toBe(false);
  });

  it('leaves non-section components untouched', () => {
    const data = legacyDraft();
    unlockSectionsInProjectData(data);

    const body = data.pages[0].frames[0].component.components[0];
    const section = body.components[0] as { components: { components: Record<string, unknown>[] }[] };
    const text = section.components[0].components[0];

    // Inner-content locking is out of scope -- only sections are unlocked.
    expect(text['removable']).toBe(false);
  });

  it('is idempotent — a second pass unlocks nothing and changes nothing', () => {
    const data = legacyDraft();
    unlockSectionsInProjectData(data);
    const afterFirst = JSON.stringify(data);

    const secondPass = unlockSectionsInProjectData(data);

    expect(secondPass).toBe(0);
    expect(JSON.stringify(data)).toBe(afterFirst);
  });

  it('tolerates null and primitive values in the tree', () => {
    expect(() => unlockSectionsInProjectData({ a: null, b: 1, c: 'x', d: [null, 2] })).not.toThrow();
    expect(unlockSectionsInProjectData(null)).toBe(0);
  });
});
