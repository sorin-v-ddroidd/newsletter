import type { ReactNode } from 'react';
import type { Property, Sector } from 'grapesjs';
import { StylesProvider, TraitsProvider } from '@grapesjs/react';
import { ChevronDown } from 'lucide-react';
import { composePaddingShorthand, EMAIL_SAFE_STYLE_PROPS } from './editorConfig';
import { useSelectedComponent } from './hooks/useSelectedComponent';
import {
  PairedField,
  SegmentedIconGroup,
  SelectField,
  SwatchRow,
  TextField,
  TraitField,
} from './panelControls';

// EDIT-06 leak guard (defense-in-depth): hides + warns on any Outlook-unsafe sector name
// that slips past the styleManager allowlist (grapesjs-mjml injects its own sectors). The
// PRIMARY gate is the per-property allowlist below (isEmailSafeProp) — a sector-name
// blocklist alone can't stop a benign-named sector (e.g. "Dimension") exposing unsafe props.
const FORBIDDEN_SECTOR_PATTERN = /flex|position|box-shadow|grid/i;

const isForbiddenSector = (sector: Sector): boolean => {
  const name = sector.getName();
  if (FORBIDDEN_SECTOR_PATTERN.test(name)) {
    console.warn('[ddroidd] Forbidden email-unsafe style sector detected (hidden):', name);
    return true;
  }
  return false;
};

// EDIT-06 primary gate: only render style props on the email-safe allowlist. Anything
// grapesjs-mjml injects outside it (width, height, margin, border, border-radius…) is
// silently dropped, so Outlook-unsafe controls never reach a non-dev.
const isEmailSafeProp = (prop: Property): boolean => EMAIL_SAFE_STYLE_PROPS.has(prop.getId());

// Flat Figma-style section header: bold ~13px title, hairline top border (except first),
// no uppercase/tracking. Renders nothing when there is no content to show.
const Section = ({ title, first, children }: { title: string; first?: boolean; children: ReactNode }) => {
  return (
    <div className={cnFirst(first)}>
      <div className="flex items-center justify-between px-3.5 pt-3.5 pb-2">
        <span className="text-[13px] font-semibold text-foreground">{title}</span>
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-3 px-3.5 pb-4">{children}</div>
    </div>
  );
};

const cnFirst = (first?: boolean): string => (first ? '' : 'border-t');

// ~300px selection-aware right panel, restyled as curated Figma-style sections
// (Content, Alignment, Layout, Appearance, Fill, Stroke, Typography) driven by live
// GrapesJS Property/Trait objects. Presentation-layer only — the email-safe allowlist,
// forbidden-sector warn, and visibility/composite filters below are unchanged from the
// prior generic sector→accordion layout (EDIT-06).
export const RightPanel = () => {
  const selected = useSelectedComponent();
  const selectedName = selected ? String(selected.getName() ?? selected.get('tagName') ?? 'Element') : null;

  // Presentation-only padding display fallback (260713-mxb): grapesjs-mjml's style-default
  // merges LONGHAND paddings (padding-top/right/bottom/left) onto the model, but the panel
  // reads only the shorthand `padding` Property, which is then empty even though real padding
  // exists. Derive the composed shorthand ONLY when all four longhands are present; read-only
  // (selected.getStyle()) — no addStyle/addAttributes/upValue here, so this never mutates the
  // model on selection/render and the Phase-1 round-trip stays byte-identical.
  const paddingDisplay = (() => {
    if (!selected) {
      return undefined;
    }
    const style = selected.getStyle();
    const top = style['padding-top'];
    const right = style['padding-right'];
    const bottom = style['padding-bottom'];
    const left = style['padding-left'];
    if (
      typeof top !== 'string' || typeof right !== 'string' ||
      typeof bottom !== 'string' || typeof left !== 'string'
    ) {
      return undefined;
    }
    return composePaddingShorthand(top, right, bottom, left);
  })();

  const renderHeader = () => {
    return (
      <div className="flex items-center gap-2 border-b px-3.5 py-3">
        {selectedName ? (
          <>
            <span className="text-[13px] font-semibold text-foreground">{selectedName}</span>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </>
        ) : (
          <span className="text-xs font-medium text-muted-foreground">Properties</span>
        )}
      </div>
    );
  };

  return (
    <aside className="flex w-[300px] flex-none flex-col overflow-y-auto border-l bg-card">
      {renderHeader()}
      <TraitsProvider>
        {({ traits }) => (
          <StylesProvider>
            {({ sectors }) => {
              const safeSectors = sectors.filter((sector) => !isForbiddenSector(sector));
              if (traits.length === 0 && sectors.length === 0) {
                return (
                  <p className="px-4 py-10 text-center text-[13px] text-muted-foreground">
                    Select an element on the canvas to edit its properties.
                  </p>
                );
              }

              const propMap = new Map<string, Property>();
              safeSectors.forEach((sector) => {
                sector
                  .getProperties()
                  .filter((prop) => prop.isVisible())
                  .filter((prop) => prop.getType() !== 'composite' && prop.getType() !== 'stack')
                  .filter(isEmailSafeProp)
                  .forEach((prop) => { propMap.set(prop.getId(), prop); });
              });
              const getProp = (id: string): Property | undefined => propMap.get(id);

              const align = getProp('align');
              const textAlign = getProp('text-align');
              const verticalAlign = getProp('vertical-align');
              const width = getProp('width');
              const height = getProp('height');
              const borderRadius = getProp('border-radius');
              const padding = getProp('padding');
              const innerPadding = getProp('inner-padding');
              const backgroundColor = getProp('background-color');
              const containerBackgroundColor = getProp('container-background-color');
              const border = getProp('border');
              const borderWidth = getProp('border-width');
              const borderStyle = getProp('border-style');
              const borderColor = getProp('border-color');
              const fontFamily = getProp('font-family');
              const fontSize = getProp('font-size');
              const fontWeight = getProp('font-weight');
              const fontStyle = getProp('font-style');
              const color = getProp('color');
              const lineHeight = getProp('line-height');
              const letterSpacing = getProp('letter-spacing');
              const textDecoration = getProp('text-decoration');
              const textTransform = getProp('text-transform');
              // mj-section-only attributes (260710-et7). Scoped to section because only
              // mj-section lists them in STYLABLE_BY_TYPE, so getProp returns them for no
              // other selection — the group self-hides via the null-guard below.
              const backgroundUrl = getProp('background-url');
              const backgroundPosition = getProp('background-position');
              const backgroundSize = getProp('background-size');
              const backgroundRepeat = getProp('background-repeat');
              const fullWidth = getProp('full-width');
              const direction = getProp('direction');

              const renderContent = () => {
                if (traits.length === 0) {
                  return null;
                }
                return (
                  <Section title="Content" first>
                    {traits.map((trait) => (
                      <TraitField key={trait.getName()} trait={trait} />
                    ))}
                  </Section>
                );
              };

              const renderAlignment = () => {
                if (!align && !textAlign && !verticalAlign) {
                  return null;
                }
                return (
                  <Section title="Alignment" first={traits.length === 0}>
                    {align && <SegmentedIconGroup prop={align} />}
                    {textAlign && <SegmentedIconGroup prop={textAlign} />}
                    {verticalAlign && <SegmentedIconGroup prop={verticalAlign} />}
                  </Section>
                );
              };

              const renderLayout = () => {
                if (!width && !height) {
                  return null;
                }
                return (
                  <Section title="Layout">
                    <div className="grid grid-cols-2 gap-2">
                      {width && <PairedField prop={width} glyph="W" />}
                      {height && <PairedField prop={height} glyph="H" />}
                    </div>
                  </Section>
                );
              };

              const renderAppearance = () => {
                if (!borderRadius && !padding && !innerPadding) {
                  return null;
                }
                return (
                  <Section title="Appearance">
                    {padding && innerPadding ? (
                      <div className="grid grid-cols-2 gap-2">
                        <PairedField prop={padding} glyph="P" displayValue={paddingDisplay} />
                        <PairedField prop={innerPadding} glyph="IP" />
                      </div>
                    ) : (
                      <>
                        {padding && <PairedField prop={padding} glyph="P" displayValue={paddingDisplay} />}
                        {innerPadding && <PairedField prop={innerPadding} glyph="IP" />}
                      </>
                    )}
                    {borderRadius && <PairedField prop={borderRadius} glyph="R" />}
                  </Section>
                );
              };

              const renderFill = () => {
                if (!backgroundColor && !containerBackgroundColor) {
                  return null;
                }
                return (
                  <Section title="Fill">
                    {backgroundColor && <SwatchRow prop={backgroundColor} />}
                    {containerBackgroundColor && <SwatchRow prop={containerBackgroundColor} />}
                  </Section>
                );
              };

              const renderStroke = () => {
                if (!border && !borderWidth && !borderStyle && !borderColor) {
                  return null;
                }
                return (
                  <Section title="Stroke">
                    {borderColor && <SwatchRow prop={borderColor} />}
                    {border && <TextField prop={border} />}
                    {borderWidth && <PairedField prop={borderWidth} glyph="W" />}
                    {borderStyle && <SelectField prop={borderStyle} />}
                  </Section>
                );
              };

              const renderSection = () => {
                if (
                  !backgroundUrl && !backgroundPosition && !backgroundSize &&
                  !backgroundRepeat && !fullWidth && !direction
                ) {
                  return null;
                }
                return (
                  <Section title="Section">
                    {backgroundUrl && <TextField prop={backgroundUrl} />}
                    {backgroundPosition && <TextField prop={backgroundPosition} />}
                    {backgroundSize && <TextField prop={backgroundSize} />}
                    {backgroundRepeat && <SelectField prop={backgroundRepeat} />}
                    {fullWidth && <SelectField prop={fullWidth} />}
                    {direction && <SelectField prop={direction} />}
                  </Section>
                );
              };

              const renderTypography = () => {
                if (
                  !fontFamily && !fontSize && !fontWeight && !fontStyle && !color &&
                  !lineHeight && !letterSpacing && !textDecoration && !textTransform
                ) {
                  return null;
                }
                return (
                  <Section title="Typography">
                    {fontFamily && <SelectField prop={fontFamily} />}
                    {(fontSize || lineHeight) && (
                      <div className="grid grid-cols-2 gap-2">
                        {fontSize && <PairedField prop={fontSize} glyph="Sz" />}
                        {lineHeight && <PairedField prop={lineHeight} glyph="Lh" />}
                      </div>
                    )}
                    {letterSpacing && <PairedField prop={letterSpacing} glyph="Ls" />}
                    {fontWeight && <SelectField prop={fontWeight} />}
                    {fontStyle && <SelectField prop={fontStyle} />}
                    {textDecoration && <SelectField prop={textDecoration} />}
                    {textTransform && <SelectField prop={textTransform} />}
                    {color && <SwatchRow prop={color} />}
                  </Section>
                );
              };

              return (
                <div className="flex flex-col">
                  {renderContent()}
                  {renderAlignment()}
                  {renderLayout()}
                  {renderAppearance()}
                  {renderFill()}
                  {renderSection()}
                  {renderStroke()}
                  {renderTypography()}
                </div>
              );
            }}
          </StylesProvider>
        )}
      </TraitsProvider>
    </aside>
  );
};
