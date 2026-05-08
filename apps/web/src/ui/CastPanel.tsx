import type { AdvisorMeta } from '@meclis/shared';

export function CastPanel(props: {
  advisors: AdvisorMeta[];
  activeIds: Set<string>;
}) {
  return (
    <div className="border-b border-marble-700/60 px-5 pb-5 pt-6">
      <div className="laurel-rule mb-3">
        <span>The Speakers</span>
      </div>

      {props.advisors.length === 0 ? (
        <div className="parchment rounded-sm px-3 py-3 font-serif text-sm italic">
          No speaker scrolls were found in the chamber. Place markdown packs in{' '}
          <code className="font-mono not-italic text-terracotta-700">
            ~/.claude/skills/meclis/advisors/
          </code>
          .
        </div>
      ) : (
        <ul className="space-y-2.5">
          {props.advisors.map((a) => {
            const active = props.activeIds.has(a.id);
            return (
              <li
                key={a.id}
                className={[
                  'stone rounded-sm px-3.5 py-3 transition-all',
                  active ? 'stone--active' : '',
                ].join(' ')}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={
                      active ? 'ember' : 'ember ember--idle'
                    }
                    aria-hidden="true"
                  />
                  <span className="font-display text-base tracking-[0.18em] text-marble-50">
                    {a.displayName.toUpperCase()}
                  </span>
                </div>
                {a.brief && (
                  <div className="mt-1.5 line-clamp-2 font-serif text-[12.5px] leading-snug text-marble-50/95 [font-style:italic]">
                    {a.brief}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-4 text-right font-serif text-[11px] italic tracking-wider text-marble-200/80">
        {props.advisors.length} speaker
        {props.advisors.length === 1 ? '' : 's'} present
      </div>
    </div>
  );
}
