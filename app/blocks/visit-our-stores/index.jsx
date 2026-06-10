// @ts-nocheck
// Visit our stores — parent (core/visit-our-stores) + child store card
// (core/visit-our-stores-item) using InnerBlocks. Authored against the kit's
// shared @wordpress runtime; registered from ../index.ts.
import { registerBlockType } from 'gutenberg-block-kit/wp/blocks';
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
  TextareaControl,
  Button,
} from 'gutenberg-block-kit/wp/components';
import { ActionBuilder } from 'gutenberg-block-kit/actions';
import {
  VISIT_OUR_STORES_BLOCK,
  VISIT_OUR_STORES_ITEM_BLOCK,
  RIYASAT_CATEGORY,
} from '../constants';

const DEFAULT_BACKGROUND = '#f5f5f5';

function VisitOurStoresIcon() {
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
        d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Child: core/visit-our-stores-item — one store (image + name + address + map)
// ---------------------------------------------------------------------------
function registerVisitOurStoresItem() {
  registerBlockType(VISIT_OUR_STORES_ITEM_BLOCK, {
    apiVersion: 3,
    title: 'Store',
    description: 'A single store: image, name, address and a Google Maps link.',
    category: RIYASAT_CATEGORY,
    parent: [VISIT_OUR_STORES_BLOCK],
    icon: 'store',
    supports: { html: false, reusable: false },
    attributes: {
      imageUrl: { type: 'string', default: '' },
      storeName: { type: 'string', default: '' },
      address: { type: 'string', default: '' },
      mapLink: { type: 'string', default: '' },
    },

    edit: ({ attributes, setAttributes }) => {
      const { imageUrl, storeName, address, mapLink } = attributes;
      const blockProps = useBlockProps({
        className: 'riyasat-visit-our-stores-item-editor',
      });

      return (
        <>
          <InspectorControls>
            <PanelBody title="Image" initialOpen={true}>
              <MediaUploadCheck>
                <MediaUpload
                  onSelect={(media) => setAttributes({ imageUrl: media?.url ?? '' })}
                  allowedTypes={['image']}
                  render={({ open }) => (
                    <div>
                      {imageUrl ? (
                        <div
                          onClick={open}
                          style={{
                            marginBottom: '8px',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            border: '1px solid #ddd',
                          }}
                        >
                          <img
                            src={imageUrl}
                            alt=""
                            style={{
                              width: '100%',
                              height: '80px',
                              objectFit: 'cover',
                              display: 'block',
                            }}
                          />
                        </div>
                      ) : null}
                      <Button
                        onClick={open}
                        variant="secondary"
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        {imageUrl ? 'Change Image' : 'Add Image'}
                      </Button>
                      {imageUrl ? (
                        <Button
                          onClick={() => setAttributes({ imageUrl: '' })}
                          variant="link"
                          isDestructive
                          style={{ marginTop: '4px' }}
                        >
                          Remove Image
                        </Button>
                      ) : null}
                    </div>
                  )}
                />
              </MediaUploadCheck>
            </PanelBody>

            <PanelBody title="Store details" initialOpen={true}>
              <TextControl
                label="Store name"
                value={storeName}
                onChange={(value) => setAttributes({ storeName: value })}
              />
              <TextareaControl
                label="Address"
                value={address}
                rows={3}
                onChange={(value) => setAttributes({ address: value })}
              />
              <TextControl
                label="Google Maps link"
                type="url"
                placeholder="https://maps.google.com/…"
                value={mapLink}
                onChange={(value) => setAttributes({ mapLink: value })}
              />
            </PanelBody>
          </InspectorControls>

          <div
            {...blockProps}
            style={{
              width: '240px',
              flexShrink: 0,
              background: '#fff',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid rgba(0,0,0,0.08)',
            }}
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt=""
                style={{
                  width: '100%',
                  height: '160px',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            ) : (
              <MediaUploadCheck>
                <MediaUpload
                  onSelect={(media) => setAttributes({ imageUrl: media?.url ?? '' })}
                  allowedTypes={['image']}
                  render={({ open }) => (
                    <button
                      type="button"
                      onClick={open}
                      style={{
                        width: '100%',
                        height: '160px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#fff',
                        background: '#2a2a4a',
                        border: 'none',
                      }}
                    >
                      Add image
                    </button>
                  )}
                />
              </MediaUploadCheck>
            )}
            <div style={{ padding: '12px' }}>
              <TextControl
                label=""
                value={storeName}
                placeholder="Store name…"
                onChange={(value) => setAttributes({ storeName: value })}
              />
              <TextareaControl
                label=""
                value={address}
                rows={2}
                placeholder="Address…"
                onChange={(value) => setAttributes({ address: value })}
              />
              <TextControl
                label=""
                type="url"
                value={mapLink}
                placeholder="Google Maps link…"
                onChange={(value) => setAttributes({ mapLink: value })}
              />
            </div>
          </div>
        </>
      );
    },

    save: ({ attributes }) => {
      const { imageUrl, storeName, address, mapLink } = attributes;
      const blockProps = useBlockProps.save({
        className: 'riyasat-visit-our-stores__item',
        'data-map-link': mapLink || '',
      });
      return (
        <div {...blockProps}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              className="riyasat-visit-our-stores__image"
            />
          ) : null}
          {storeName ? (
            <h4 className="riyasat-visit-our-stores__name">{storeName}</h4>
          ) : null}
          {address ? (
            <p className="riyasat-visit-our-stores__address">{address}</p>
          ) : null}
          {mapLink ? (
            <a
              className="riyasat-visit-our-stores__map"
              href={mapLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on map
            </a>
          ) : null}
        </div>
      );
    },
  });
}

// ---------------------------------------------------------------------------
// Parent: core/visit-our-stores — heading + row of store cards
// ---------------------------------------------------------------------------
function registerVisitOurStoresParent() {
  registerBlockType(VISIT_OUR_STORES_BLOCK, {
    apiVersion: 3,
    title: 'Visit Our Stores',
    description: 'A titled row of store cards on a colored background.',
    category: RIYASAT_CATEGORY,
    icon: VisitOurStoresIcon,
    keywords: ['stores', 'locations', 'map', 'address'],
    supports: { html: false, align: ['wide', 'full'] },
    attributes: {
      title: { type: 'string', default: '' },
      subTitle: { type: 'string', default: '' },
      backgroundColor: { type: 'string', default: DEFAULT_BACKGROUND },
      action: { type: 'object', default: {} },
    },

    edit: ({ attributes, setAttributes }) => {
      const { title, subTitle, backgroundColor, action } = attributes;
      const blockProps = useBlockProps({
        className: 'riyasat-visit-our-stores-editor',
      });

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

            <PanelBody title="Section action" initialOpen={false}>
              <ActionBuilder
                label="Action"
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
              className="riyasat-visit-our-stores"
              style={{
                background: backgroundColor,
                padding: '24px',
                borderRadius: '8px',
              }}
            >
              <div className="riyasat-visit-our-stores__heading">
                {subTitle ? (
                  <p
                    className="riyasat-visit-our-stores__subtitle"
                    style={{ margin: '0 0 4px', color: '#888', fontSize: '13px' }}
                  >
                    {subTitle}
                  </p>
                ) : null}
                {title ? (
                  <h3
                    className="riyasat-visit-our-stores__title"
                    style={{ margin: '0 0 16px', fontSize: '22px', fontWeight: 700 }}
                  >
                    {title}
                  </h3>
                ) : null}
              </div>

              <div
                className="riyasat-visit-our-stores__track"
                style={{ display: 'flex', gap: '16px', overflowX: 'auto' }}
              >
                <InnerBlocks
                  allowedBlocks={[VISIT_OUR_STORES_ITEM_BLOCK]}
                  template={[
                    [VISIT_OUR_STORES_ITEM_BLOCK, {}],
                    [VISIT_OUR_STORES_ITEM_BLOCK, {}],
                  ]}
                  templateLock={false}
                  renderAppender={InnerBlocks.ButtonBlockAppender}
                  orientation="horizontal"
                />
              </div>
            </div>
          </div>
        </>
      );
    },

    save: ({ attributes }) => {
      const { title, subTitle, backgroundColor, action } = attributes;
      const blockProps = useBlockProps.save({
        className: 'riyasat-visit-our-stores',
        'data-background-color': backgroundColor,
        'data-action': JSON.stringify(action ?? {}),
        style: { background: backgroundColor },
      });
      return (
        <div {...blockProps}>
          <div className="riyasat-visit-our-stores__heading">
            {subTitle ? (
              <p className="riyasat-visit-our-stores__subtitle">{subTitle}</p>
            ) : null}
            {title ? (
              <h3 className="riyasat-visit-our-stores__title">{title}</h3>
            ) : null}
          </div>
          <div className="riyasat-visit-our-stores__track">
            <InnerBlocks.Content />
          </div>
        </div>
      );
    },
  });
}

/**
 * Register the visit-our-stores parent + store child. Child registers first so
 * the parent's InnerBlocks template can reference it.
 */
export function registerVisitOurStores() {
  registerVisitOurStoresItem();
  registerVisitOurStoresParent();
}
