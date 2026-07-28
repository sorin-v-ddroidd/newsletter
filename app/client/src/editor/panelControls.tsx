import { useState, type ReactNode } from 'react';
import type { Property, PropertySelect, Trait } from 'grapesjs';
import {
  AlignCenter,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  AlignJustify,
  AlignLeft,
  AlignRight,
  AlignStartHorizontal,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { BLOCK_DEFAULTS } from './blocks/BLOCK_DEFAULTS';
import {
  getMessageWidth,
  setMessageWidth,
  MESSAGE_WIDTH_MIN,
  MESSAGE_WIDTH_MAX,
  MESSAGE_WIDTH_DEFAULT,
} from './actions';

// EDIT-08: the approved brand palette (single source of truth = BLOCK_DEFAULTS). The color
// control offers only these swatches — never a free-form hex or OS color picker.
const BRAND_SWATCHES: readonly { label: string; value: string }[] = [
  { label: 'Background', value: BLOCK_DEFAULTS.backgroundColor },
  { label: 'Accent', value: BLOCK_DEFAULTS.accentColor },
  { label: 'Text', value: BLOCK_DEFAULTS.textColor },
];

// Shared compact select styling for SelectField + any raw <select> in this module.
export const selectClass =
  'h-8 w-full rounded-md border border-input bg-background px-2.5 text-[13px] text-foreground ' +
  'outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40';

const TEXT_ALIGN_ICONS: Record<string, typeof AlignLeft> = {
  left: AlignLeft,
  center: AlignCenter,
  right: AlignRight,
  justify: AlignJustify,
};

const VERTICAL_ALIGN_ICONS: Record<string, typeof AlignStartHorizontal> = {
  top: AlignStartHorizontal,
  middle: AlignCenterHorizontal,
  bottom: AlignEndHorizontal,
};

/**
 * @description Resolves the lucide icon for a segmented alignment toggle option.
 * Returns null when the propId/optionId combination has no known icon mapping.
 */
export const resolveAlignIcon = (propId: string, optionId: string): typeof AlignLeft | null => {
  if (propId === 'align' || propId === 'text-align') {
    return TEXT_ALIGN_ICONS[optionId] ?? null;
  }
  if (propId === 'vertical-align') {
    return VERTICAL_ALIGN_ICONS[optionId] ?? null;
  }
  return null;
};

/**
 * @description Figma-style segmented icon toggle row for a select/radio Property
 * (e.g. text-align, vertical-align). Writes via prop.upValue on click.
 */
export const SegmentedIconGroup = ({ prop }: { prop: Property }) => {
  const selectProp = prop as PropertySelect;
  const propId = prop.getId();
  const value = String(prop.getValue() ?? '');

  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border bg-background p-0.5">
      {selectProp.getOptions().map((option) => {
        const optionId = selectProp.getOptionId(option);
        const optionLabel = selectProp.getOptionLabel(option);
        const Icon = resolveAlignIcon(propId, optionId);
        const isActive = optionId === value;
        return (
          <button
            key={optionId}
            type="button"
            aria-pressed={isActive}
            aria-label={optionLabel}
            onClick={() => { prop.upValue(optionId); }}
            className={cn(
              'grid h-7 min-w-7 cursor-pointer place-items-center rounded-md text-muted-foreground transition-colors',
              'hover:text-foreground',
              isActive && 'bg-accent text-foreground',
            )}
          >
            {Icon ? <Icon className="size-4" /> : <span className="px-1 text-[11px]">{optionLabel}</span>}
          </button>
        );
      })}
    </div>
  );
};

/**
 * @description Constrained brand-color control (EDIT-08). Renders one clickable swatch per
 * approved BLOCK_DEFAULTS color — no OS color picker, no free-form hex input. Works for any
 * color Property (background/container-background/color/border-color): writes the chosen hex
 * via prop.upValue and highlights the swatch matching the current value (case-insensitive).
 */
export const SwatchRow = ({ prop }: { prop: Property }) => {
  const label = prop.getLabel();
  const value = String(prop.getValue() ?? '').trim().toLowerCase();

  return (
    <div className="flex items-center gap-1.5" role="group" aria-label={`${label} — brand colors`}>
      {BRAND_SWATCHES.map((swatch) => {
        const isActive = value === swatch.value.toLowerCase();
        return (
          <button
            key={swatch.value}
            type="button"
            aria-pressed={isActive}
            aria-label={`${label}: ${swatch.label}`}
            title={`${swatch.label} (${swatch.value})`}
            onClick={() => { prop.upValue(swatch.value); }}
            // Dynamic brand hex cannot be a static Tailwind class — inline background is the
            // one unavoidable inline style (swatch preview); all layout stays in utilities.
            style={{ backgroundColor: swatch.value }}
            className={cn(
              'size-7 flex-none cursor-pointer rounded-md border border-input transition-shadow',
              isActive && 'ring-2 ring-ring ring-offset-1 ring-offset-background',
            )}
          />
        );
      })}
    </div>
  );
};

/**
 * @description Compact input with an in-field prefix glyph (letter or icon) and no
 * stacked label — designed to sit inside a two-column grid (e.g. width/height).
 */
export const PairedField = ({
  prop,
  glyph,
  displayValue,
}: {
  prop: Property;
  glyph: ReactNode;
  displayValue?: string;
}) => {
  const liveValue = String(prop.getValue() ?? '');
  // Presentation-only fallback (260713-mxb): when the live Property value is empty and a
  // displayValue is supplied (e.g. the composed padding shorthand derived from longhands),
  // show it so the field is readable/editable. The default remains the separate placeholder.
  const value = liveValue === '' && displayValue !== undefined ? displayValue : liveValue;

  return (
    <div className="relative flex items-center">
      <span className="pointer-events-none absolute left-2.5 text-[11px] text-muted-foreground">
        {glyph}
      </span>
      <Input
        value={value}
        placeholder={prop.getDefaultValue()}
        onChange={(ev) => { prop.upValue(ev.target.value); }}
        className="h-8 bg-background pl-6 text-[13px]"
      />
    </div>
  );
};

/**
 * @description Compact labelled <select> control for remaining select-type props
 * (Typography, appearance) not handled by SegmentedIconGroup.
 */
export const SelectField = ({ prop }: { prop: Property }) => {
  const selectProp = prop as PropertySelect;
  const label = prop.getLabel();
  const value = String(prop.getValue() ?? '');

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <select
        className={selectClass}
        value={value}
        onChange={(ev) => { prop.upValue(ev.target.value); }}
      >
        <option value="">—</option>
        {selectProp.getOptions().map((option) => (
          <option key={selectProp.getOptionId(option)} value={selectProp.getOptionId(option)}>
            {selectProp.getOptionLabel(option)}
          </option>
        ))}
      </select>
    </label>
  );
};

/**
 * @description Compact labelled text control for remaining text-type props not
 * handled by PairedField/SwatchRow.
 */
export const TextField = ({ prop }: { prop: Property }) => {
  const label = prop.getLabel();
  const value = String(prop.getValue() ?? '');

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <Input
        value={value}
        placeholder={prop.getDefaultValue()}
        onChange={(ev) => { prop.upValue(ev.target.value); }}
        className="h-8 bg-background text-[13px]"
      />
    </label>
  );
};

/**
 * @description Trait input (moved from RightPanel): checkbox → checkbox, select →
 * <select>, default → text. Writes via trait.setValue.
 */
export const TraitField = ({ trait }: { trait: Trait }) => {
  const type = trait.getType();
  const label = String(trait.getLabel() ?? trait.getName());

  const renderInput = () => {
    if (type === 'checkbox') {
      return (
        <input
          type="checkbox"
          checked={Boolean(trait.getValue({ useType: true }))}
          onChange={(ev) => { trait.setValue(ev.target.checked); }}
          className="size-4 accent-primary"
        />
      );
    }

    if (type === 'select') {
      return (
        <select
          className={selectClass}
          value={String(trait.getValue() ?? '')}
          onChange={(ev) => { trait.setValue(ev.target.value); }}
        >
          <option value="">—</option>
          {trait.getOptions().map((option) => (
            <option key={trait.getOptionId(option)} value={trait.getOptionId(option)}>
              {trait.getOptionLabel(option)}
            </option>
          ))}
        </select>
      );
    }

    return (
      <Input
        value={String(trait.getValue() ?? '')}
        onChange={(ev) => { trait.setValue(ev.target.value); }}
        className="h-8 bg-background text-[13px]"
      />
    );
  };

  return (
    <label className={cn('flex gap-2', type === 'checkbox' ? 'items-center' : 'flex-col')}>
      <span className={cn('text-[11px] text-muted-foreground', type === 'checkbox' && 'order-2')}>{label}</span>
      {renderInput()}
    </label>
  );
};

/**
 * @description Shared clamped message-width control (WIDTH-01): a range slider + numeric input,
 * both clamped to [min,max] before onChange. Controlled — the parent owns the number. This is the
 * ONE width behavior reused by the TopBar Global Settings surface and the RightPanel mj-body branch.
 */
export const WidthRangeField = ({
  value,
  onChange,
  min = MESSAGE_WIDTH_MIN,
  max = MESSAGE_WIDTH_MAX,
}: {
  value: number;
  onChange: (px: number) => void;
  min?: number;
  max?: number;
}) => {
  const clamp = (n: number): number => Math.min(max, Math.max(min, n));
  const commit = (raw: string): void => {
    const n = Number.parseInt(raw, 10);
    if (Number.isFinite(n)) {
      onChange(clamp(n));
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        aria-label="Message width"
        onChange={(ev) => { onChange(clamp(Number(ev.target.value))); }}
        className="h-1.5 flex-1 cursor-pointer accent-primary"
      />
      <div className="relative flex items-center">
        <Input
          type="number"
          min={min}
          max={max}
          value={value}
          aria-label="Message width in pixels"
          onChange={(ev) => { commit(ev.target.value); }}
          className="h-8 w-20 bg-background pr-6 text-[13px]"
        />
        <span className="pointer-events-none absolute right-2 text-[11px] text-muted-foreground">px</span>
      </div>
    </div>
  );
};

/**
 * @description Connects WidthRangeField to the single source of truth (mj-body style.width) via
 * the action layer. Used by BOTH the TopBar Global Settings surface and the RightPanel mj-body
 * branch, so there is exactly one width behavior. Reads window.__ddroiddEditor — the same editor
 * access the TopBar action handlers use.
 */
export const MessageWidthControl = () => {
  const editor = window.__ddroiddEditor;
  const [width, setWidth] = useState<number>(() => (editor ? getMessageWidth(editor) : MESSAGE_WIDTH_DEFAULT));

  if (!editor) {
    return null;
  }

  const handleChange = (px: number): void => {
    setMessageWidth(editor, px);
    setWidth(getMessageWidth(editor));
  };

  return (
    <label className="flex flex-col gap-2">
      <span className="text-[11px] text-muted-foreground">Message width</span>
      <WidthRangeField value={width} onChange={handleChange} />
    </label>
  );
};
