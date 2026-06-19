// @ts-nocheck
// Shop by Occasion — parent (core/occasion) + tab (core/occasion-tab) +
// item (core/occasion-tab-item) using nested InnerBlocks.
import { createContext, useContext, useState, useEffect, useCallback } from 'gutenberg-block-kit/wp/element';
import { registerBlockType, createBlock } from 'gutenberg-block-kit/wp/blocks';
import {
  useBlockProps,
  InnerBlocks,
  InspectorControls,
  PanelColorSettings,
} from 'gutenberg-block-kit/wp/block-editor';
import {
  PanelBody,
  TextControl,
  ToggleControl,
  Button,
} from 'gutenberg-block-kit/wp/components';
import { useSelect, useDispatch } from 'gutenberg-block-kit/wp/data';
import { ActionBuilder } from 'gutenberg-block-kit/actions';
import {
  OCCASION_BLOCK,
  OCCASION_TAB_BLOCK,
  OCCASION_TAB_ITEM_BLOCK,
  RIYASAT_CATEGORY,
} from '../constants';
import { contentTabStyle, ImagePicker, useChildBlocks, useTrackPagination, SliderPaginationDots, stopPaginationEvent } from '../inspector-shared';

const DEFAULT_BACKGROUND = '#f5f5f5';
const OccasionActiveTabContext = createContext(0);
const OccasionPaginationContext = createContext({
  activeItemIndex: 0,
  setActiveItemIndex: () => {},
});

function OccasionIcon() {
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
        d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z"
      />
    </svg>
  );
}

function useTabIndex(clientId) {
  return useSelect(
    (select) => {
      const blockEditor = select('core/block-editor');
      const parentId = blockEditor.getBlockRootClientId(clientId);
      if (!parentId) return 0;
      const siblings = blockEditor.getBlockOrder(parentId);
      const index = siblings.indexOf(clientId);
      return index >= 0 ? index : 0;
    },
    [clientId],
  );
}

// ---------------------------------------------------------------------------
// Child: core/occasion-tab-item
// ---------------------------------------------------------------------------
function registerOccasionTabItem() {
  registerBlockType(OCCASION_TAB_ITEM_BLOCK, {
    apiVersion: 3,
    title: 'Occasion Item',
    description: 'An occasion image tile with label and optional tap action.',
    category: RIYASAT_CATEGORY,
    parent: [OCCASION_TAB_BLOCK],
    icon: 'format-image',
    supports: { html: false, reusable: false },
    attributes: {
      imageUrl: { type: 'string', default: '' },
      label: { type: 'string', default: '' },
      action: { type: 'object', default: {} },
    },

    edit: ({ attributes, setAttributes }) => {
      const { imageUrl, label, action } = attributes;
      const blockProps = useBlockProps({
        className: 'riyasat-occasion-tab-item-editor',
      });

      return (
        <>
          <InspectorControls group="content">
            <div style={contentTabStyle}>
              <PanelBody title="Item" initialOpen={true}>
                <ImagePicker
                  imageUrl={imageUrl}
                  onSelect={(url) => setAttributes({ imageUrl: url })}
                  onClear={() => setAttributes({ imageUrl: '' })}
                />
                <TextControl
                  label="Label"
                  value={label}
                  onChange={(value) => setAttributes({ label: value })}
                />
                <ActionBuilder
                  label="Tap action"
                  value={action}
                  onChange={(next) => setAttributes({ action: next })}
                />
              </PanelBody>
            </div>
          </InspectorControls>

          <div {...blockProps}>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt=""
                className="riyasat-occasion-tab-item-editor__image"
              />
            ) : (
              <div className="riyasat-occasion-tab-item-editor__placeholder">Add image</div>
            )}
            <input
              type="text"
              className="riyasat-occasion-tab-item-editor__label"
              value={label}
              placeholder="Label…"
              onChange={(event) => setAttributes({ label: event.target.value })}
            />
          </div>
        </>
      );
    },

    save: ({ attributes }) => {
      const { imageUrl, label, action } = attributes;
      const blockProps = useBlockProps.save({
        className: 'riyasat-occasion-tab-item',
        'data-action': JSON.stringify(action ?? {}),
      });
      return (
        <div {...blockProps}>
          {imageUrl ? (
            <img src={imageUrl} alt="" className="riyasat-occasion-tab-item__image" />
          ) : null}
          {label ? (
            <span className="riyasat-occasion-tab-item__label">{label}</span>
          ) : null}
        </div>
      );
    },
  });
}

// ---------------------------------------------------------------------------
// Child: core/occasion-tab
// ---------------------------------------------------------------------------
function registerOccasionTab() {
  registerBlockType(OCCASION_TAB_BLOCK, {
    apiVersion: 3,
    title: 'Occasion Tab',
    description: 'A tab grouping occasion image tiles.',
    category: RIYASAT_CATEGORY,
    parent: [OCCASION_BLOCK],
    icon: 'category',
    supports: { html: false, reusable: false },
    attributes: {
      title: { type: 'string', default: '' },
    },

    edit: ({ attributes, setAttributes, clientId }) => {
      const { title } = attributes;
      const activeTabIndex = useContext(OccasionActiveTabContext);
      const { activeItemIndex } = useContext(OccasionPaginationContext);
      const tabIndex = useTabIndex(clientId);
      const isActive = tabIndex === activeTabIndex;
      const { childBlocks, childCount, insertBlock, removeBlock, updateBlockAttributes } =
        useChildBlocks(clientId);
      const { trackRef } = useTrackPagination(isActive ? activeItemIndex : -1);
      const blockProps = useBlockProps({
        className: `riyasat-occasion-tab-editor${isActive ? ' is-active' : ''}`,
        style: isActive ? undefined : { display: 'none' },
      });

      return (
        <>
          <InspectorControls group="content">
            <div style={contentTabStyle}>
              <PanelBody title="Tab" initialOpen={true}>
                <TextControl
                  label="Title"
                  value={title}
                  onChange={(value) => setAttributes({ title: value })}
                />
              </PanelBody>
              {childBlocks.map((block, index) => {
                const { imageUrl, label, action } = block.attributes;
                return (
                  <PanelBody
                    key={block.clientId}
                    title={`Item ${index + 1}`}
                    initialOpen={false}
                  >
                    <ImagePicker
                      imageUrl={imageUrl}
                      onSelect={(url) =>
                        updateBlockAttributes(block.clientId, { imageUrl: url })
                      }
                      onClear={() => updateBlockAttributes(block.clientId, { imageUrl: '' })}
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
                      value={action}
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
                        Remove item
                      </Button>
                    ) : null}
                  </PanelBody>
                );
              })}
              <Button
                variant="primary"
                onClick={() =>
                  insertBlock(
                    createBlock(OCCASION_TAB_ITEM_BLOCK, {}),
                    childCount,
                    clientId,
                  )
                }
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Add item
              </Button>
            </div>
          </InspectorControls>

          <div {...blockProps}>
            <div className="riyasat-occasion-tab__track" ref={trackRef}>
              <InnerBlocks
                allowedBlocks={[OCCASION_TAB_ITEM_BLOCK]}
                template={[
                  [OCCASION_TAB_ITEM_BLOCK, {}],
                  [OCCASION_TAB_ITEM_BLOCK, {}],
                ]}
                templateLock={false}
                renderAppender={false}
                orientation="horizontal"
              />
            </div>
          </div>
        </>
      );
    },

    save: ({ attributes }) => {
      const { title } = attributes;
      const blockProps = useBlockProps.save({
        className: 'riyasat-occasion-tab',
        'data-title': title || '',
      });
      return (
        <div {...blockProps}>
          {title ? <span className="riyasat-occasion-tab__title">{title}</span> : null}
          <div className="riyasat-occasion-tab__track">
            <InnerBlocks.Content />
          </div>
        </div>
      );
    },
  });
}

// ---------------------------------------------------------------------------
// Parent: core/occasion
// ---------------------------------------------------------------------------
function registerOccasionParent() {
  registerBlockType(OCCASION_BLOCK, {
    apiVersion: 3,
    title: 'Shop by Occasion',
    description: 'Tabbed occasion gallery with image tiles and pagination.',
    category: RIYASAT_CATEGORY,
    icon: OccasionIcon,
    keywords: ['occasion', 'shop', 'tabs', 'category'],
    supports: { html: false, align: ['wide', 'full'] },
    attributes: {
      showPagination: { type: 'boolean', default: true },
      title: { type: 'string', default: '' },
      subTitle: { type: 'string', default: '' },
      backgroundColor: { type: 'string', default: DEFAULT_BACKGROUND },
      action: { type: 'object', default: {} },
    },

    edit: ({ attributes, setAttributes, clientId }) => {
      const { showPagination, title, subTitle, backgroundColor, action } = attributes;
      const blockProps = useBlockProps({ className: 'riyasat-occasion-editor' });
      const [activeTabIndex, setActiveTabIndex] = useState(0);
      const [activeItemIndex, setActiveItemIndex] = useState(0);
      const { childBlocks, childCount, insertBlock, removeBlock, updateBlockAttributes } =
        useChildBlocks(clientId);
      const activeTabClientId = childBlocks[activeTabIndex]?.clientId;
      const { selectBlock } = useDispatch('core/block-editor');
      const { activeItemCount, activeTabItemIds, selectedBlockClientId } = useSelect(
        (select) => {
          const editor = select('core/block-editor');
          return {
            activeItemCount: activeTabClientId
              ? editor.getBlockCount(activeTabClientId)
              : 0,
            activeTabItemIds: activeTabClientId
              ? editor.getBlockOrder(activeTabClientId)
              : [],
            selectedBlockClientId: editor.getSelectedBlockClientId(),
          };
        },
        [activeTabClientId],
      );

      useEffect(() => {
        setActiveItemIndex(0);
      }, [activeTabIndex]);

      useEffect(() => {
        if (childCount <= 0) {
          setActiveTabIndex(0);
          return;
        }
        if (activeTabIndex > childCount - 1) setActiveTabIndex(childCount - 1);
      }, [activeTabIndex, childCount]);

      useEffect(() => {
        if (activeItemCount <= 0) {
          setActiveItemIndex(0);
          return;
        }
        if (activeItemIndex > activeItemCount - 1) {
          setActiveItemIndex(activeItemCount - 1);
        }
      }, [activeItemCount, activeItemIndex]);

      useEffect(() => {
        if (!selectedBlockClientId || !activeTabItemIds.includes(selectedBlockClientId)) {
          return;
        }
        const nextIndex = activeTabItemIds.indexOf(selectedBlockClientId);
        if (nextIndex >= 0) {
          setActiveItemIndex(nextIndex);
        }
      }, [activeTabItemIds, selectedBlockClientId]);

      const goToItem = useCallback(
        (index, event) => {
          if (event) {
            stopPaginationEvent(event);
          }
          if (index < 0 || index >= activeTabItemIds.length) return;
          setActiveItemIndex(index);
          selectBlock(activeTabItemIds[index]);
        },
        [activeTabItemIds, selectBlock],
      );

      return (
        <>
          <InspectorControls group="content">
            <div style={contentTabStyle}>
              <PanelBody title="Heading" initialOpen={true}>
                <TextControl
                  label="Main Title"
                  value={title}
                  onChange={(value) => setAttributes({ title: value })}
                />
                <TextControl
                  label="Sub Title"
                  value={subTitle}
                  onChange={(value) => setAttributes({ subTitle: value })}
                />
              </PanelBody>
              {childBlocks.map((block, index) => {
                const tabTitle = block.attributes.title;
                return (
                  <PanelBody
                    key={block.clientId}
                    title={`Tab ${index + 1}${tabTitle ? `: ${tabTitle}` : ''}`}
                    initialOpen={false}
                  >
                    <TextControl
                      label="Title"
                      value={tabTitle}
                      onChange={(value) =>
                        updateBlockAttributes(block.clientId, { title: value })
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
                    createBlock(
                      OCCASION_TAB_BLOCK,
                      {},
                      [
                        [OCCASION_TAB_ITEM_BLOCK, {}],
                        [OCCASION_TAB_ITEM_BLOCK, {}],
                      ],
                    ),
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
              <ToggleControl
                label="Show pagination"
                checked={showPagination}
                onChange={(value) => setAttributes({ showPagination: value })}
              />
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
                value={action}
                onChange={(next) => setAttributes({ action: next })}
              />
            </PanelBody>
          </InspectorControls>

          <OccasionActiveTabContext.Provider value={activeTabIndex}>
            <OccasionPaginationContext.Provider
              value={{ activeItemIndex, setActiveItemIndex }}
            >
            <div {...blockProps}>
              <div
                className="riyasat-occasion"
                style={{ background: backgroundColor }}
              >
                {(subTitle || title) && (
                  <div className="riyasat-occasion__heading">
                  {title ? (
                      <h3 className="riyasat-occasion__title">{title}</h3>
                    ) : null}
                    {subTitle ? (
                      <p className="riyasat-occasion__subtitle">{subTitle}</p>
                    ) : null}
                  </div>
                )}

                {childCount > 0 ? (
                  <div className="riyasat-occasion__tab-bar" role="tablist">
                    {childBlocks.map((block, index) => (
                      <button
                        key={block.clientId}
                        type="button"
                        role="tab"
                        className={`riyasat-occasion__tab-btn${
                          index === activeTabIndex ? ' is-active' : ''
                        }`}
                        aria-selected={index === activeTabIndex}
                        onClick={() => setActiveTabIndex(index)}
                      >
                        {block.attributes.title || `Tab ${index + 1}`}
                      </button>
                    ))}
                  </div>
                ) : null}

                <div className="riyasat-occasion__panels">
                  <InnerBlocks
                    allowedBlocks={[OCCASION_TAB_BLOCK]}
                    template={[
                      [
                        OCCASION_TAB_BLOCK,
                        { title: 'MEN' },
                        [
                          [OCCASION_TAB_ITEM_BLOCK, { label: 'Wedding' }],
                          [OCCASION_TAB_ITEM_BLOCK, { label: 'Reception' }],
                        ],
                      ],
                      [
                        OCCASION_TAB_BLOCK,
                        { title: 'WOMEN' },
                        [
                          [OCCASION_TAB_ITEM_BLOCK, { label: 'Wedding' }],
                          [OCCASION_TAB_ITEM_BLOCK, { label: 'Reception' }],
                        ],
                      ],
                    ]}
                    templateLock={false}
                    renderAppender={false}
                  />
                </div>

                {showPagination ? (
                  <SliderPaginationDots
                    count={activeItemCount}
                    activeIndex={activeItemIndex}
                    onSelect={goToItem}
                    className="riyasat-occasion__pagination"
                    dotClassName="riyasat-occasion__dot"
                    ariaLabelPrefix="Go to item"
                  />
                ) : null}
              </div>
            </div>
            </OccasionPaginationContext.Provider>
          </OccasionActiveTabContext.Provider>
        </>
      );
    },

    save: ({ attributes }) => {
      const { showPagination, title, subTitle, backgroundColor, action } = attributes;
      const blockProps = useBlockProps.save({
        className: 'riyasat-occasion',
        'data-show-pagination': showPagination ? 'true' : 'false',
        'data-background-color': backgroundColor,
        'data-action': JSON.stringify(action ?? {}),
        style: { background: backgroundColor },
      });
      return (
        <div {...blockProps}>
          {(subTitle || title) && (
            <div className="riyasat-occasion__heading">
              {title ? <h3 className="riyasat-occasion__title">{title}</h3> : null}
              {subTitle ? (
                <p className="riyasat-occasion__subtitle">{subTitle}</p>
              ) : null}
            </div>
          )}
          <div className="riyasat-occasion__panels">
            <InnerBlocks.Content />
          </div>
          {showPagination ? (
            <div className="riyasat-occasion__pagination" aria-hidden="true" />
          ) : null}
        </div>
      );
    },
  });
}

export function registerOccasion() {
  registerOccasionTabItem();
  registerOccasionTab();
  registerOccasionParent();
}
