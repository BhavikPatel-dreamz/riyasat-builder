// @ts-nocheck
// Product scroller — a single block (no InnerBlocks) bound to a Shopify
// collection. The storefront/mobile app renders the collection's products; the
// block only stores the collection ref + presentation. Authored against the
// kit's shared @wordpress runtime; registered from ../index.ts.
import { registerBlockType } from 'gutenberg-block-kit/wp/blocks';
import {
  useBlockProps,
  InspectorControls,
  PanelColorSettings,
} from 'gutenberg-block-kit/wp/block-editor';
import { PanelBody, TextControl, Button } from 'gutenberg-block-kit/wp/components';
import { ActionBuilder } from 'gutenberg-block-kit/actions';
import { PRODUCT_SCROLLER_BLOCK, RIYASAT_CATEGORY } from '../constants';

const DEFAULT_BACKGROUND = '#f5f5f5';

function ProductScrollerIcon() {
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
        d="M3 5h5v14H3V5zm6 0h6v14H9V5zm7 0h5v14h-5V5z"
      />
    </svg>
  );
}

// App Bridge v4 collection picker. Returns { collectionId, handle, title } or
// null if cancelled / unavailable.
async function pickCollection() {
  const picker =
    typeof window !== 'undefined' ? window.shopify?.resourcePicker : null;
  if (!picker) return null;
  const selection = await picker({ type: 'collection', multiple: false });
  const collection = selection?.[0];
  if (!collection) return null;
  return {
    collectionId: collection.id,
    handle: collection.handle,
    title: collection.title,
  };
}

export function registerProductScroller() {
  registerBlockType(PRODUCT_SCROLLER_BLOCK, {
    apiVersion: 3,
    title: 'Product Scroller',
    description:
      'Horizontally scrolling products from a Shopify collection, with a heading and CTA.',
    category: RIYASAT_CATEGORY,
    icon: ProductScrollerIcon,
    keywords: ['products', 'collection', 'scroller', 'best sellers'],
    supports: { html: false, align: ['wide', 'full'] },
    attributes: {
      title: { type: 'string', default: '' },
      subTitle: { type: 'string', default: '' },
      backgroundColor: { type: 'string', default: DEFAULT_BACKGROUND },
      buttonText: { type: 'string', default: '' },
      collection: { type: 'object', default: {} },
      action: { type: 'object', default: {} },
    },

    edit: ({ attributes, setAttributes }) => {
      const { title, subTitle, backgroundColor, buttonText, collection, action } =
        attributes;
      const blockProps = useBlockProps({
        className: 'riyasat-product-scroller-editor',
      });
      const hasCollection = collection && collection.collectionId;

      async function onPickCollection() {
        const picked = await pickCollection();
        if (picked) setAttributes({ collection: picked });
      }

      return (
        <>
          <InspectorControls>
            <PanelBody title="Heading" initialOpen={true}>
              <TextControl
                label="Title"
                value={title}
                onChange={(value) => setAttributes({ title: value })}
              />
              <TextControl
                label="Subtitle"
                value={subTitle}
                onChange={(value) => setAttributes({ subTitle: value })}
              />
            </PanelBody>

            <PanelBody title="Collection" initialOpen={true}>
              {hasCollection ? (
                <p style={{ margin: '0 0 8px' }}>
                  Selected: <strong>{collection.title}</strong>
                  <br />
                  <span style={{ color: '#666', fontSize: '12px' }}>
                    {collection.handle}
                  </span>
                </p>
              ) : (
                <p style={{ margin: '0 0 8px', color: '#666' }}>
                  No collection selected.
                </p>
              )}
              <Button
                variant="secondary"
                onClick={onPickCollection}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {hasCollection ? 'Change Collection' : 'Select Collection'}
              </Button>
              {hasCollection ? (
                <Button
                  variant="link"
                  isDestructive
                  onClick={() => setAttributes({ collection: {} })}
                  style={{ marginTop: '4px' }}
                >
                  Clear Collection
                </Button>
              ) : null}
            </PanelBody>

            <PanelBody title="Button" initialOpen={false}>
              <TextControl
                label="Button text"
                value={buttonText}
                onChange={(value) => setAttributes({ buttonText: value })}
              />
              <ActionBuilder
                label="Button action"
                value={action}
                onChange={(next) => setAttributes({ action: next })}
              />
            </PanelBody>

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
          </InspectorControls>

          <div {...blockProps}>
            <div
              className="riyasat-product-scroller"
              style={{
                background: backgroundColor,
                padding: '24px',
                borderRadius: '8px',
              }}
            >
              <div className="riyasat-product-scroller__heading">
                {subTitle ? (
                  <p
                    className="riyasat-product-scroller__subtitle"
                    style={{ margin: '0 0 4px', color: '#888', fontSize: '13px' }}
                  >
                    {subTitle}
                  </p>
                ) : null}
                {title ? (
                  <h3
                    className="riyasat-product-scroller__title"
                    style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}
                  >
                    {title}
                  </h3>
                ) : null}
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '16px',
                  overflowX: 'auto',
                  margin: '16px 0',
                }}
              >
                {/* Editor placeholder — real products render on the storefront/app. */}
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    style={{
                      width: '140px',
                      flexShrink: 0,
                      background: '#fff',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1px solid rgba(0,0,0,0.08)',
                    }}
                  >
                    <div style={{ height: '160px', background: '#e9e9ef' }} />
                    <div style={{ padding: '8px' }}>
                      <div
                        style={{
                          height: '10px',
                          background: '#e0e0e6',
                          borderRadius: '4px',
                          marginBottom: '6px',
                        }}
                      />
                      <div
                        style={{
                          height: '10px',
                          width: '60%',
                          background: '#e0e0e6',
                          borderRadius: '4px',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {hasCollection ? (
                <p
                  style={{
                    margin: '0 0 12px',
                    fontSize: '12px',
                    color: '#666',
                    textAlign: 'center',
                  }}
                >
                  Products from <strong>{collection.title}</strong>
                </p>
              ) : (
                <p
                  style={{
                    margin: '0 0 12px',
                    fontSize: '12px',
                    color: '#b00',
                    textAlign: 'center',
                  }}
                >
                  Select a collection in the sidebar →
                </p>
              )}

              {buttonText ? (
                <div style={{ textAlign: 'center' }}>
                  <span
                    className="riyasat-product-scroller__button"
                    style={{
                      display: 'inline-block',
                      padding: '12px 28px',
                      border: '1px solid #1a1a2e',
                      borderRadius: '6px',
                      fontWeight: 600,
                      fontSize: '13px',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {buttonText}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </>
      );
    },

    save: ({ attributes }) => {
      const { title, subTitle, backgroundColor, buttonText, collection, action } =
        attributes;
      const blockProps = useBlockProps.save({
        className: 'riyasat-product-scroller',
        'data-background-color': backgroundColor,
        'data-collection': JSON.stringify(collection ?? {}),
        'data-action': JSON.stringify(action ?? {}),
        style: { background: backgroundColor },
      });
      return (
        <div {...blockProps}>
          <div className="riyasat-product-scroller__heading">
            {subTitle ? (
              <p className="riyasat-product-scroller__subtitle">{subTitle}</p>
            ) : null}
            {title ? (
              <h3 className="riyasat-product-scroller__title">{title}</h3>
            ) : null}
          </div>
          {buttonText ? (
            <span className="riyasat-product-scroller__button">{buttonText}</span>
          ) : null}
        </div>
      );
    },
  });
}
