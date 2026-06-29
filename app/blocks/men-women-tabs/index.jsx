// @ts-nocheck
// Men/Women Tabs — parent (core/men-women-tabs) + tab item
// (core/men-women-tab-item) using horizontal InnerBlocks.
import { registerBlockType, createBlock } from 'gutenberg-block-kit/wp/blocks';
import {
  useBlockProps,
  InnerBlocks,
  InspectorControls,
  PanelColorSettings,
} from 'gutenberg-block-kit/wp/block-editor';
import { PanelBody, TextControl, Button } from 'gutenberg-block-kit/wp/components';
import { ActionBuilder } from 'gutenberg-block-kit/actions';
import { contentTabStyle, useChildBlocks } from '../inspector-shared';
import {
  MEN_WOMEN_TABS_BLOCK,
  MEN_WOMEN_TAB_ITEM_BLOCK,
  RIYASAT_CATEGORY,
} from '../constants';

const DEFAULT_BACKGROUND = '#FFFFFF';
const DEFAULT_ACTIVE_TEXT = '#FFFFFF';
const DEFAULT_ACTIVE_BG = '#971A4C';
const DEFAULT_ACTIVE_BORDER = '#971A4C';
const DEFAULT_INACTIVE_TEXT = '#971A4C';
const DEFAULT_INACTIVE_BG = '#FFFFFF';
const DEFAULT_INACTIVE_BORDER = '#971A4C';

const TAB_TEMPLATE = [
  [
    MEN_WOMEN_TAB_ITEM_BLOCK,
    {
      buttonText: 'Men',
      buttonTextColor: DEFAULT_ACTIVE_TEXT,
      buttonBackgroundColor: DEFAULT_ACTIVE_BG,
      buttonBorderColor: DEFAULT_ACTIVE_BORDER,
      buttonAction: {},
    },
  ],
  [
    MEN_WOMEN_TAB_ITEM_BLOCK,
    {
      buttonText: 'Women',
      buttonTextColor: DEFAULT_INACTIVE_TEXT,
      buttonBackgroundColor: DEFAULT_INACTIVE_BG,
      buttonBorderColor: DEFAULT_INACTIVE_BORDER,
      buttonAction: {},
    },
  ],
];

function MenWomenTabsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M4 6h16v3H4V6zm0 5h7v3H4v-3zm9 0h7v3h-7v-3zM4 16h16v3H4v-3z"
      />
    </svg>
  );
}

function TabItemFields({ attributes, onChange }) {
  const {
    buttonText,
    buttonTextColor,
    buttonBackgroundColor,
    buttonBorderColor,
    buttonAction,
  } = attributes;

  return (
    <>
      <TextControl
        label="Button text"
        value={buttonText}
        onChange={(value) => onChange({ buttonText: value })}
      />
      <PanelColorSettings
        title="Button colors"
        colorSettings={[
          {
            label: 'Text color',
            value: buttonTextColor,
            onChange: (value) =>
              onChange({ buttonTextColor: value || DEFAULT_ACTIVE_TEXT }),
          },
          {
            label: 'Background color',
            value: buttonBackgroundColor,
            onChange: (value) =>
              onChange({ buttonBackgroundColor: value || DEFAULT_ACTIVE_BG }),
          },
          {
            label: 'Border color',
            value: buttonBorderColor,
            onChange: (value) =>
              onChange({ buttonBorderColor: value || DEFAULT_ACTIVE_BORDER }),
          },
        ]}
      />
      <ActionBuilder
        label="Button action"
        value={buttonAction ?? {}}
        onChange={(next) => onChange({ buttonAction: next })}
      />
    </>
  );
}

function TabItemPreview({ attributes }) {
  const {
    buttonText,
    buttonTextColor,
    buttonBackgroundColor,
    buttonBorderColor,
  } = attributes;

  return (
    <button
      type="button"
      className="riyasat-men-women-tab-item-editor__button"
      style={{
        color: buttonTextColor || DEFAULT_ACTIVE_TEXT,
        background: buttonBackgroundColor || DEFAULT_ACTIVE_BG,
        borderColor: buttonBorderColor || DEFAULT_ACTIVE_BORDER,
      }}
    >
      {buttonText || 'Tab'}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Child: core/men-women-tab-item
// ---------------------------------------------------------------------------
function registerMenWomenTabItem() {
  registerBlockType(MEN_WOMEN_TAB_ITEM_BLOCK, {
    apiVersion: 3,
    title: 'Men/Women Tab',
    description: 'A tab button with label, colors and tap action.',
    category: RIYASAT_CATEGORY,
    parent: [MEN_WOMEN_TABS_BLOCK],
    icon: 'button',
    supports: { html: false, reusable: false },
    attributes: {
      buttonText: { type: 'string', default: '' },
      buttonTextColor: { type: 'string', default: DEFAULT_ACTIVE_TEXT },
      buttonBackgroundColor: { type: 'string', default: DEFAULT_ACTIVE_BG },
      buttonBorderColor: { type: 'string', default: DEFAULT_ACTIVE_BORDER },
      buttonAction: { type: 'object', default: {} },
    },

    edit: ({ attributes, setAttributes }) => {
      const blockProps = useBlockProps({
        className: 'riyasat-men-women-tab-item-editor',
      });

      return (
        <>
          <InspectorControls group="content">
            <div style={contentTabStyle}>
              <PanelBody title="Tab button" initialOpen={true}>
                <TabItemFields
                  attributes={attributes}
                  onChange={(next) => setAttributes(next)}
                />
              </PanelBody>
            </div>
          </InspectorControls>

          <div {...blockProps}>
            <TabItemPreview attributes={attributes} />
          </div>
        </>
      );
    },

    save: ({ attributes }) => {
      const {
        buttonText,
        buttonTextColor,
        buttonBackgroundColor,
        buttonBorderColor,
        buttonAction,
      } = attributes;

      const blockProps = useBlockProps.save({
        className: 'riyasat-men-women-tabs__item',
        'data-button-text': buttonText || '',
        'data-button-text-color': buttonTextColor || '',
        'data-button-background-color': buttonBackgroundColor || '',
        'data-button-border-color': buttonBorderColor || '',
        'data-button-action': JSON.stringify(buttonAction ?? {}),
      });

      return (
        <div {...blockProps}>
          {buttonText ? (
            <span
              className="riyasat-men-women-tabs__button"
              style={{
                color: buttonTextColor || undefined,
                background: buttonBackgroundColor || undefined,
                borderColor: buttonBorderColor || undefined,
              }}
            >
              {buttonText}
            </span>
          ) : null}
        </div>
      );
    },
  });
}

// ---------------------------------------------------------------------------
// Parent: core/men-women-tabs
// ---------------------------------------------------------------------------
function registerMenWomenTabsParent() {
  registerBlockType(MEN_WOMEN_TABS_BLOCK, {
    apiVersion: 3,
    title: 'Men/Women Tabs',
    description: 'Segmented Men/Women tab buttons with per-tab colors and actions.',
    category: RIYASAT_CATEGORY,
    icon: MenWomenTabsIcon,
    keywords: ['men', 'women', 'tabs', 'segment', 'gender'],
    supports: { html: false, align: ['wide', 'full'] },
    attributes: {
      backgroundColor: { type: 'string', default: DEFAULT_BACKGROUND },
      action: { type: 'object', default: {} },
    },

    edit: ({ attributes, setAttributes, clientId }) => {
      const { backgroundColor, action } = attributes;
      const blockProps = useBlockProps({ className: 'riyasat-men-women-tabs-editor' });
      const { childBlocks, childCount, insertBlock, removeBlock, updateBlockAttributes } =
        useChildBlocks(clientId);

      return (
        <>
          <InspectorControls group="content">
            <div style={contentTabStyle}>
              {childBlocks.map((block, index) => {
                const { buttonText } = block.attributes;
                return (
                  <PanelBody
                    key={block.clientId}
                    title={`Tab ${index + 1}${buttonText ? `: ${buttonText}` : ''}`}
                    initialOpen={index === 0}
                  >
                    <TabItemFields
                      attributes={block.attributes}
                      onChange={(next) =>
                        updateBlockAttributes(block.clientId, next)
                      }
                    />
                    {childCount > 1 ? (
                      <Button
                        onClick={() => removeBlock(block.clientId)}
                        variant="link"
                        isDestructive
                        style={{ marginTop: '8px' }}
                      >
                        Remove tab
                      </Button>
                    ) : null}
                  </PanelBody>
                );
              })}
              <Button
                variant="primary"
                onClick={() =>
                  insertBlock(
                    createBlock(MEN_WOMEN_TAB_ITEM_BLOCK, {
                      buttonText: 'Tab',
                      buttonTextColor: DEFAULT_INACTIVE_TEXT,
                      buttonBackgroundColor: DEFAULT_INACTIVE_BG,
                      buttonBorderColor: DEFAULT_INACTIVE_BORDER,
                      buttonAction: {},
                    }),
                    childCount,
                    clientId,
                  )
                }
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Add tab
              </Button>
            </div>
          </InspectorControls>

          <InspectorControls>
            <PanelBody title="Settings" initialOpen={true}>
              <PanelColorSettings
                title="Colors"
                colorSettings={[
                  {
                    label: 'Background color',
                    value: backgroundColor,
                    onChange: (value) =>
                      setAttributes({ backgroundColor: value || DEFAULT_BACKGROUND }),
                  },
                ]}
              />
              <ActionBuilder
                label="Section action"
                value={action ?? {}}
                onChange={(next) => setAttributes({ action: next })}
              />
            </PanelBody>
          </InspectorControls>

          <div {...blockProps}>
            <div
              className="riyasat-men-women-tabs"
              style={{ background: backgroundColor }}
            >
              <div className="riyasat-men-women-tabs__track">
                <InnerBlocks
                  allowedBlocks={[MEN_WOMEN_TAB_ITEM_BLOCK]}
                  template={TAB_TEMPLATE}
                  templateLock={false}
                  orientation="horizontal"
                  renderAppender={InnerBlocks.ButtonBlockAppender}
                />
              </div>
            </div>
          </div>
        </>
      );
    },

    save: ({ attributes }) => {
      const { backgroundColor, action } = attributes;
      const blockProps = useBlockProps.save({
        className: 'riyasat-men-women-tabs',
        'data-action': JSON.stringify(action ?? {}),
        'data-background-color': backgroundColor || DEFAULT_BACKGROUND,
        style: { background: backgroundColor || DEFAULT_BACKGROUND },
      });

      return (
        <div {...blockProps}>
          <InnerBlocks.Content />
        </div>
      );
    },
  });
}

export function registerMenWomenTabs() {
  registerMenWomenTabItem();
  registerMenWomenTabsParent();
}
