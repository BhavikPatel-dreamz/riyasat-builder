// @ts-nocheck
// Hero/Image carousel — parent (core/image-carousel) + child slide
// (core/image-carousel-item) using InnerBlocks. Authored against the kit's
// shared @wordpress runtime so registerBlockType() hits the editor's registry.
// Called from ../index.ts inside registerBlocks().
import { useState, useEffect } from 'gutenberg-block-kit/wp/element';
import { registerBlockType } from 'gutenberg-block-kit/wp/blocks';
import {
  useBlockProps,
  InnerBlocks,
  InspectorControls,
  MediaUpload,
  MediaUploadCheck,
} from 'gutenberg-block-kit/wp/block-editor';
import { PanelBody, ToggleControl, Button } from 'gutenberg-block-kit/wp/components';
import { useSelect } from 'gutenberg-block-kit/wp/data';
import { ActionBuilder } from 'gutenberg-block-kit/actions';
import {
  IMAGE_CAROUSEL_BLOCK,
  IMAGE_CAROUSEL_ITEM_BLOCK,
  RIYASAT_CATEGORY,
} from '../constants';

function CarouselIcon() {
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
        d="M4 5h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm0 2v9h16V7H4z"
      />
      <circle cx="9" cy="19.5" r="1.1" fill="currentColor" />
      <circle cx="12" cy="19.5" r="1.1" fill="currentColor" />
      <circle cx="15" cy="19.5" r="1.1" fill="currentColor" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Child: core/image-carousel-item — one slide (image + tap action)
// ---------------------------------------------------------------------------
function registerCarouselItem() {
  registerBlockType(IMAGE_CAROUSEL_ITEM_BLOCK, {
    apiVersion: 3,
    title: 'Carousel Slide',
    description: 'A single image slide with optional tap action.',
    category: RIYASAT_CATEGORY,
    parent: [IMAGE_CAROUSEL_BLOCK],
    icon: 'format-image',
    supports: { html: false, reusable: false },
    attributes: {
      imageUrl: { type: 'string', default: '' },
      action: { type: 'object', default: {} },
    },

    edit: ({ attributes, setAttributes }) => {
      const { imageUrl, action } = attributes;
      const blockProps = useBlockProps({
        className: 'riyasat-image-carousel-item-editor',
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

            <PanelBody title="Action" initialOpen={true}>
              <ActionBuilder
                label="Tap action"
                value={action}
                onChange={(next) => setAttributes({ action: next })}
              />
            </PanelBody>
          </InspectorControls>

          <div {...blockProps}>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt=""
                className="riyasat-image-carousel-item-editor__image"
                style={{
                  width: '100%',
                  minHeight: '280px',
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
                      className="riyasat-image-carousel-item-editor__placeholder"
                      onClick={open}
                      style={{
                        width: '100%',
                        minHeight: '280px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#fff',
                        background: '#2a2a4a',
                        border: 'none',
                      }}
                    >
                      Click to add slide image
                    </button>
                  )}
                />
              </MediaUploadCheck>
            )}
          </div>
        </>
      );
    },

    save: ({ attributes }) => {
      const { imageUrl, action } = attributes;
      const blockProps = useBlockProps.save({
        className: 'riyasat-image-carousel__slide',
        'data-action': JSON.stringify(action ?? {}),
      });
      if (!imageUrl) return <div {...blockProps} />;
      return (
        <div {...blockProps}>
          <img src={imageUrl} alt="" />
        </div>
      );
    },
  });
}

// ---------------------------------------------------------------------------
// Parent: core/image-carousel — holds slides + pagination toggle
// ---------------------------------------------------------------------------
function registerCarouselParent() {
  registerBlockType(IMAGE_CAROUSEL_BLOCK, {
    apiVersion: 3,
    title: 'Hero Carousel',
    description: 'Full-width image carousel with pagination dots.',
    category: RIYASAT_CATEGORY,
    icon: CarouselIcon,
    keywords: ['carousel', 'hero', 'slider', 'images'],
    supports: { html: false, align: ['wide', 'full'] },
    attributes: {
      showPagination: { type: 'boolean', default: true },
    },

    edit: ({ attributes, setAttributes, clientId }) => {
      const { showPagination } = attributes;
      const blockProps = useBlockProps({ className: 'riyasat-image-carousel-editor' });
      const [activeIndex, setActiveIndex] = useState(0);
      const slideCount = useSelect(
        (select) => select('core/block-editor').getBlockCount(clientId),
        [clientId],
      );

      useEffect(() => {
        if (slideCount <= 0) {
          setActiveIndex(0);
          return;
        }
        if (activeIndex > slideCount - 1) setActiveIndex(slideCount - 1);
      }, [activeIndex, slideCount]);

      return (
        <>
          <InspectorControls>
            <PanelBody title="Carousel settings" initialOpen={true}>
              <ToggleControl
                label="Show pagination"
                checked={showPagination}
                onChange={(value) => setAttributes({ showPagination: value })}
              />
            </PanelBody>
          </InspectorControls>

          <div {...blockProps}>
            <div className="riyasat-image-carousel">
              <div className="riyasat-image-carousel__track">
                <InnerBlocks
                  allowedBlocks={[IMAGE_CAROUSEL_ITEM_BLOCK]}
                  template={[
                    [IMAGE_CAROUSEL_ITEM_BLOCK, {}],
                    [IMAGE_CAROUSEL_ITEM_BLOCK, {}],
                  ]}
                  templateLock={false}
                  renderAppender={InnerBlocks.ButtonBlockAppender}
                />
              </div>

              {showPagination && slideCount > 1 ? (
                <div className="riyasat-image-carousel__pagination">
                  {Array.from({ length: slideCount }).map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`riyasat-image-carousel__dot${
                        index === activeIndex ? ' is-active' : ''
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                      onClick={() => setActiveIndex(index)}
                      style={{
                        width: index === activeIndex ? '24px' : '10px',
                        height: '10px',
                        borderRadius: '999px',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        background:
                          index === activeIndex
                            ? '#ffffff'
                            : 'rgba(255,255,255,0.5)',
                      }}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </>
      );
    },

    save: ({ attributes }) => {
      const { showPagination } = attributes;
      const blockProps = useBlockProps.save({
        className: 'riyasat-image-carousel',
        'data-show-pagination': showPagination ? 'true' : 'false',
      });
      return (
        <div {...blockProps}>
          <div className="riyasat-image-carousel__track">
            <InnerBlocks.Content />
          </div>
          {showPagination ? (
            <div className="riyasat-image-carousel__pagination" aria-hidden="true" />
          ) : null}
        </div>
      );
    },
  });
}

/**
 * Register the carousel parent + slide child. Child must register first so the
 * parent's InnerBlocks template can reference it.
 */
export function registerImageCarousel() {
  registerCarouselItem();
  registerCarouselParent();
}
