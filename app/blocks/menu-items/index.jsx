// @ts-nocheck
// Drawer Menu — parent (core/menu-items) + item (core/menu-item) +
// sub-item (core/menu-sub-item) using nested InnerBlocks.
import { registerBlockType, createBlock } from 'gutenberg-block-kit/wp/blocks';
import {
  useBlockProps,
  InnerBlocks,
  InspectorControls,
  PanelColorSettings,
  MediaUpload,
  MediaUploadCheck,
} from 'gutenberg-block-kit/wp/block-editor';
import {
  PanelBody,
  TextControl,
  Button,
} from 'gutenberg-block-kit/wp/components';
import { ActionBuilder } from 'gutenberg-block-kit/actions';
import {
  MENU_ITEMS_BLOCK,
  MENU_ITEM_BLOCK,
  MENU_SUB_ITEM_BLOCK,
  RIYASAT_CATEGORY,
} from '../constants';
import {
  contentTabStyle,
  ImagePicker,
  useChildBlocks,
} from '../inspector-shared';

const DEFAULT_BACKGROUND = '#FFFFFF';

function DrawerMenuIcon() {
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
        d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"
      />
    </svg>
  );
}

function IconField({ icon, onSelect, onClear }) {
  return (
    <ImagePicker
      imageUrl={icon}
      addLabel="Add icon"
      changeLabel="Change icon"
      onSelect={(media) => onSelect(media?.url ?? '')}
      onClear={onClear}
    />
  );
}

function CanvasIcon({ icon, onSelect }) {
  return (
    <MediaUploadCheck>
      <MediaUpload
        onSelect={(media) => onSelect(media?.url ?? '')}
        allowedTypes={['image']}
        render={({ open }) =>
          icon ? (
            <img
              src={icon}
              alt=""
              className="riyasat-menu-item-editor__icon"
              onClick={open}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') open();
              }}
              role="button"
              tabIndex={0}
            />
          ) : (
            <button
              type="button"
              className="riyasat-menu-item-editor__icon-placeholder"
              onClick={open}
            >
              Icon
            </button>
          )
        }
      />
    </MediaUploadCheck>
  );
}

function SubItemAppender() {
  return (
    <div className="riyasat-menu-item-editor__add-sub">
      <InnerBlocks.ButtonBlockAppender />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Child: core/menu-sub-item
// ---------------------------------------------------------------------------
function registerMenuSubItem() {
  registerBlockType(MENU_SUB_ITEM_BLOCK, {
    apiVersion: 3,
    title: 'Menu Sub Item',
    description: 'A nested drawer menu row with icon, label and tap action.',
    category: RIYASAT_CATEGORY,
    parent: [MENU_ITEM_BLOCK],
    icon: 'minus',
    supports: { html: false, reusable: false },
    attributes: {
      icon: { type: 'string', default: '' },
      label: { type: 'string', default: '' },
      action: { type: 'object', default: {} },
    },

    edit: ({ attributes, setAttributes }) => {
      const { icon, label, action } = attributes;
      const blockProps = useBlockProps({
        className: 'riyasat-menu-sub-item-editor',
      });

      return (
        <>
          <InspectorControls group="content">
            <div style={contentTabStyle}>
              <PanelBody title="Sub item" initialOpen={true}>
                <IconField
                  icon={icon}
                  onSelect={(url) => setAttributes({ icon: url })}
                  onClear={() => setAttributes({ icon: '' })}
                />
                <TextControl
                  label="Label"
                  value={label}
                  onChange={(value) => setAttributes({ label: value })}
                />
                <ActionBuilder
                  label="Tap action"
                  value={action ?? {}}
                  onChange={(next) => setAttributes({ action: next })}
                />
              </PanelBody>
            </div>
          </InspectorControls>

          <div {...blockProps}>
            <div className="riyasat-menu-sub-item-editor__branch" aria-hidden />
            <CanvasIcon
              icon={icon}
              onSelect={(url) => setAttributes({ icon: url })}
            />
            <input
              type="text"
              className="riyasat-menu-sub-item-editor__label"
              value={label}
              placeholder="Sub item label…"
              onChange={(event) => setAttributes({ label: event.target.value })}
            />
          </div>
        </>
      );
    },

    save: ({ attributes }) => {
      const { icon, label, action } = attributes;
      const blockProps = useBlockProps.save({
        className: 'riyasat-menu-items__sub-item',
        'data-action': JSON.stringify(action ?? {}),
        'data-icon': icon || '',
      });
      return (
        <div {...blockProps}>
          {icon ? (
            <img
              src={icon}
              alt=""
              className="riyasat-menu-items__sub-item-icon"
            />
          ) : null}
          {label ? (
            <span className="riyasat-menu-items__sub-item-label">{label}</span>
          ) : null}
        </div>
      );
    },
  });
}

// ---------------------------------------------------------------------------
// Child: core/menu-item
// ---------------------------------------------------------------------------
function registerMenuItem() {
  registerBlockType(MENU_ITEM_BLOCK, {
    apiVersion: 3,
    title: 'Menu Item',
    description: 'A drawer menu row that can hold optional sub-items.',
    category: RIYASAT_CATEGORY,
    parent: [MENU_ITEMS_BLOCK],
    icon: 'menu',
    supports: { html: false, reusable: false },
    attributes: {
      icon: { type: 'string', default: '' },
      label: { type: 'string', default: '' },
      action: { type: 'object', default: {} },
    },

    edit: ({ attributes, setAttributes, clientId }) => {
      const { icon, label, action } = attributes;
      const {
        childBlocks,
        childCount,
        insertBlock,
        removeBlock,
        updateBlockAttributes,
      } = useChildBlocks(clientId);
      const blockProps = useBlockProps({
        className: 'riyasat-menu-item-editor',
      });

      return (
        <>
          <InspectorControls group="content">
            <div style={contentTabStyle}>
              <PanelBody title="Menu item" initialOpen={true}>
                <IconField
                  icon={icon}
                  onSelect={(url) => setAttributes({ icon: url })}
                  onClear={() => setAttributes({ icon: '' })}
                />
                <TextControl
                  label="Label"
                  value={label}
                  onChange={(value) => setAttributes({ label: value })}
                />
                <ActionBuilder
                  label="Tap action"
                  value={action ?? {}}
                  onChange={(next) => setAttributes({ action: next })}
                />
              </PanelBody>

              {childBlocks.map((block, index) => {
                const {
                  icon: subIcon,
                  label: subLabel,
                  action: subAction,
                } = block.attributes;
                return (
                  <PanelBody
                    key={block.clientId}
                    title={`Sub item ${index + 1}${subLabel ? `: ${subLabel}` : ''}`}
                    initialOpen={false}
                  >
                    <IconField
                      icon={subIcon}
                      onSelect={(url) =>
                        updateBlockAttributes(block.clientId, { icon: url })
                      }
                      onClear={() =>
                        updateBlockAttributes(block.clientId, { icon: '' })
                      }
                    />
                    <TextControl
                      label="Label"
                      value={subLabel}
                      onChange={(value) =>
                        updateBlockAttributes(block.clientId, { label: value })
                      }
                    />
                    <ActionBuilder
                      label="Tap action"
                      value={subAction ?? {}}
                      onChange={(next) =>
                        updateBlockAttributes(block.clientId, { action: next })
                      }
                    />
                    <Button
                      onClick={() => removeBlock(block.clientId)}
                      variant="link"
                      isDestructive
                      style={{ marginTop: '8px' }}
                    >
                      Remove sub item
                    </Button>
                  </PanelBody>
                );
              })}

              <Button
                variant="secondary"
                onClick={() =>
                  insertBlock(
                    createBlock(MENU_SUB_ITEM_BLOCK, { label: 'Sub item' }),
                    childCount,
                    clientId,
                  )
                }
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Add sub item
              </Button>
            </div>
          </InspectorControls>

          <div {...blockProps}>
            <div className="riyasat-menu-item-editor__row">
              <CanvasIcon
                icon={icon}
                onSelect={(url) => setAttributes({ icon: url })}
              />
              <input
                type="text"
                className="riyasat-menu-item-editor__label"
                value={label}
                placeholder="Menu label…"
                onChange={(event) =>
                  setAttributes({ label: event.target.value })
                }
              />
            </div>
            <div className="riyasat-menu-item-editor__subs">
              <InnerBlocks
                allowedBlocks={[MENU_SUB_ITEM_BLOCK]}
                template={[]}
                templateLock={false}
                renderAppender={SubItemAppender}
              />
            </div>
          </div>
        </>
      );
    },

    save: ({ attributes }) => {
      const { icon, label, action } = attributes;
      const blockProps = useBlockProps.save({
        className: 'riyasat-menu-items__item',
        'data-action': JSON.stringify(action ?? {}),
        'data-icon': icon || '',
      });
      return (
        <div {...blockProps}>
          {icon ? (
            <img
              src={icon}
              alt=""
              className="riyasat-menu-items__item-icon"
            />
          ) : null}
          {label ? (
            <span className="riyasat-menu-items__item-label">{label}</span>
          ) : null}
          <InnerBlocks.Content />
        </div>
      );
    },
  });
}

// ---------------------------------------------------------------------------
// Parent: core/menu-items
// ---------------------------------------------------------------------------
function registerMenuItemsParent() {
  registerBlockType(MENU_ITEMS_BLOCK, {
    apiVersion: 3,
    title: 'Drawer Menu',
    description:
      'Mobile drawer navigation with icons, labels and nested sub items.',
    category: RIYASAT_CATEGORY,
    icon: DrawerMenuIcon,
    keywords: ['menu', 'drawer', 'nav', 'sidebar'],
    supports: { html: false, align: ['wide', 'full'] },
    attributes: {
      backgroundColor: { type: 'string', default: DEFAULT_BACKGROUND },
    },

    edit: ({ attributes, setAttributes, clientId }) => {
      const { backgroundColor } = attributes;
      const {
        childBlocks,
        childCount,
        insertBlock,
        removeBlock,
        updateBlockAttributes,
      } = useChildBlocks(clientId);
      const blockProps = useBlockProps({
        className: 'riyasat-menu-items-editor',
        style: { background: backgroundColor },
      });

      return (
        <>
          <InspectorControls group="content">
            <div style={contentTabStyle}>
              {childBlocks.map((block) => {
                const {
                  icon,
                  label,
                  action,
                } = block.attributes;
                return (
                  <PanelBody
                    key={block.clientId}
                    title={`Item: ${label || 'Untitled'}`}
                    initialOpen={false}
                  >
                    <IconField
                      icon={icon}
                      onSelect={(url) =>
                        updateBlockAttributes(block.clientId, { icon: url })
                      }
                      onClear={() =>
                        updateBlockAttributes(block.clientId, { icon: '' })
                      }
                    />
                    <TextControl
                      label="Label"
                      value={label}
                      onChange={(value) =>
                        updateBlockAttributes(block.clientId, { label: value })
                      }
                    />
                    <ActionBuilder
                      label="Tap action"
                      value={action ?? {}}
                      onChange={(next) =>
                        updateBlockAttributes(block.clientId, { action: next })
                      }
                    />
                    {childCount > 1 ? (
                      <Button
                        onClick={() => removeBlock(block.clientId)}
                        variant="link"
                        isDestructive
                        style={{ marginTop: '8px' }}
                      >
                        Remove menu item
                      </Button>
                    ) : null}
                  </PanelBody>
                );
              })}
              <Button
                variant="primary"
                onClick={() =>
                  insertBlock(
                    createBlock(MENU_ITEM_BLOCK, { label: 'Menu item' }),
                    childCount,
                    clientId,
                  )
                }
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Add menu item
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
                      setAttributes({
                        backgroundColor: value || DEFAULT_BACKGROUND,
                      }),
                  },
                ]}
              />
            </PanelBody>
          </InspectorControls>

          <div {...blockProps}>
            <InnerBlocks
              allowedBlocks={[MENU_ITEM_BLOCK]}
              template={[
                [MENU_ITEM_BLOCK, { label: 'All Products' }],
                [
                  MENU_ITEM_BLOCK,
                  { label: 'Yagnas' },
                  [[MENU_SUB_ITEM_BLOCK, { label: 'Yagnas Sub' }]],
                ],
                [
                  MENU_ITEM_BLOCK,
                  { label: 'Courses' },
                  [[MENU_SUB_ITEM_BLOCK, { label: 'Courses Sub' }]],
                ],
              ]}
              templateLock={false}
              renderAppender={false}
            />
          </div>
        </>
      );
    },

    save: ({ attributes }) => {
      const { backgroundColor } = attributes;
      const blockProps = useBlockProps.save({
        className: 'riyasat-menu-items',
        'data-background-color': backgroundColor,
        style: { background: backgroundColor },
      });
      return (
        <div {...blockProps}>
          <InnerBlocks.Content />
        </div>
      );
    },
  });
}

export function registerMenuItems() {
  registerMenuSubItem();
  registerMenuItem();
  registerMenuItemsParent();
}
