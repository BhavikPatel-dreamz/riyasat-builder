// @ts-nocheck
// Client Stories — parent (core/client-stories) + child testimonial card
// (core/client-stories-item) using InnerBlocks. Authored against the kit's
// shared @wordpress runtime; registered from ../index.ts.
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
  ToggleControl,
  Button,
} from 'gutenberg-block-kit/wp/components';
import { useState } from 'gutenberg-block-kit/wp/element';
import { ActionBuilder } from 'gutenberg-block-kit/actions';
import { contentTabStyle, ImagePicker, useChildBlocks, useSliderPagination, SliderPaginationDots } from '../inspector-shared';
import {
  CLIENT_STORIES_BLOCK,
  CLIENT_STORIES_ITEM_BLOCK,
  RIYASAT_CATEGORY,
} from '../constants';

const DEFAULT_BACKGROUND = '#f5f5f5';

function ClientStoriesIcon() {
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
        d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"
      />
    </svg>
  );
}

function renderStars(rating) {
  const count = Math.max(0, Math.min(5, parseInt(rating, 10) || 0));
  return '★'.repeat(count);
}

// ---------------------------------------------------------------------------
// Child: core/client-stories-item — one testimonial card
// ---------------------------------------------------------------------------
function registerClientStoriesItem() {
  registerBlockType(CLIENT_STORIES_ITEM_BLOCK, {
    apiVersion: 3,
    title: 'Client Story',
    description: 'A single testimonial: review, rating, image, reviewer and CTA.',
    category: RIYASAT_CATEGORY,
    parent: [CLIENT_STORIES_BLOCK],
    icon: 'format-quote',
    supports: { html: false, reusable: false },
    attributes: {
      review: { type: 'string', default: '' },
      rating: { type: 'string', default: '' },
      imageUrl: { type: 'string', default: '' },
      reviewerName: { type: 'string', default: '' },
      city: { type: 'string', default: '' },
      buttonText: { type: 'string', default: '' },
      action: { type: 'object', default: {} },
    },

    edit: ({ attributes, setAttributes }) => {
      const { review, rating, imageUrl, reviewerName, city, buttonText, action } =
        attributes;
      const blockProps = useBlockProps({
        className: 'riyasat-client-stories-item-editor',
      });

      return (
        <>
          <InspectorControls group="content">
            <div style={contentTabStyle}>
              <PanelBody title="Story" initialOpen={true}>
                <ImagePicker
                  imageUrl={imageUrl}
                  onSelect={(url) => setAttributes({ imageUrl: url })}
                  onClear={() => setAttributes({ imageUrl: '' })}
                />
                <TextControl
                  label="Review"
                  value={review}
                  onChange={(value) => setAttributes({ review: value })}
                />
                <TextControl
                  label="Rating"
                  value={rating}
                  onChange={(value) => setAttributes({ rating: value })}
                />
                <TextControl
                  label="Reviewer name"
                  value={reviewerName}
                  onChange={(value) => setAttributes({ reviewerName: value })}
                />
                <TextControl
                  label="City"
                  value={city}
                  onChange={(value) => setAttributes({ city: value })}
                />
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
            </div>
          </InspectorControls>

          <div {...blockProps}>
            {rating ? (
              <div className="riyasat-client-stories-item-editor__rating">
                {renderStars(rating)}
                <span className="riyasat-client-stories-item-editor__rating-value">
                  {rating}
                </span>
              </div>
            ) : null}
            <textarea
              className="riyasat-client-stories-item-editor__field riyasat-client-stories-item-editor__field--review"
              value={review}
              placeholder="Review…"
              rows={3}
              onChange={(event) => setAttributes({ review: event.target.value })}
            />
            {imageUrl ? (
              <img
                src={imageUrl}
                alt=""
                className="riyasat-client-stories-item-editor__image"
              />
            ) : null}
            <input
              type="text"
              className="riyasat-client-stories-item-editor__field"
              value={reviewerName}
              placeholder="Reviewer name…"
              onChange={(event) => setAttributes({ reviewerName: event.target.value })}
            />
            <input
              type="text"
              className="riyasat-client-stories-item-editor__field"
              value={city}
              placeholder="City…"
              onChange={(event) => setAttributes({ city: event.target.value })}
            />
            {buttonText ? (
              <span className="riyasat-client-stories-item-editor__button">
                {buttonText}
              </span>
            ) : null}
          </div>
        </>
      );
    },

    save: ({ attributes }) => {
      const { review, rating, imageUrl, reviewerName, city, buttonText, action } =
        attributes;
      const blockProps = useBlockProps.save({
        className: 'riyasat-client-stories__item',
        'data-action': JSON.stringify(action ?? {}),
        'data-rating': rating,
      });
      return (
        <div {...blockProps}>
          {rating ? (
            <span className="riyasat-client-stories__rating">{rating}</span>
          ) : null}
          {review ? (
            <p className="riyasat-client-stories__review">{review}</p>
          ) : null}
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              className="riyasat-client-stories__image"
            />
          ) : null}
          {reviewerName ? (
            <span className="riyasat-client-stories__reviewer">{reviewerName}</span>
          ) : null}
          {city ? (
            <span className="riyasat-client-stories__city">{city}</span>
          ) : null}
          {buttonText ? (
            <span className="riyasat-client-stories__button">{buttonText}</span>
          ) : null}
        </div>
      );
    },
  });
}

// ---------------------------------------------------------------------------
// Parent: core/client-stories — heading + horizontal row of testimonial cards
// ---------------------------------------------------------------------------
function registerClientStoriesParent() {
  registerBlockType(CLIENT_STORIES_BLOCK, {
    apiVersion: 3,
    title: 'Client Stories',
    description: 'A titled, horizontally scrolling row of customer testimonials.',
    category: RIYASAT_CATEGORY,
    icon: ClientStoriesIcon,
    keywords: ['client', 'stories', 'testimonials', 'reviews', 'customers'],
    supports: { html: false, align: ['wide', 'full'] },
    attributes: {
      title: { type: 'string', default: '' },
      subTitle: { type: 'string', default: '' },
      backgroundColor: { type: 'string', default: DEFAULT_BACKGROUND },
      showPagination: { type: 'boolean', default: true },
      action: { type: 'object', default: {} },
    },

    edit: ({ attributes, setAttributes, clientId }) => {
      const { title, subTitle, backgroundColor, showPagination, action } =
        attributes;
      const blockProps = useBlockProps({ className: 'riyasat-client-stories-editor' });
      const [activeIndex, setActiveIndex] = useState(0);
      const { childBlocks, childCount, insertBlock, removeBlock, updateBlockAttributes } =
        useChildBlocks(clientId);
      const { trackRef, slideCount, goToSlide } = useSliderPagination(clientId, activeIndex, setActiveIndex);

      return (
        <>
          <InspectorControls group="content">
            <div style={contentTabStyle}>
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
              {childBlocks.map((block, index) => {
                const {
                  review,
                  rating,
                  imageUrl,
                  reviewerName,
                  city,
                  buttonText,
                  action: storyAction,
                } = block.attributes;
                return (
                  <PanelBody
                    key={block.clientId}
                    title={`Story ${index + 1}`}
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
                      label="Review"
                      value={review}
                      onChange={(value) =>
                        updateBlockAttributes(block.clientId, { review: value })
                      }
                    />
                    <TextControl
                      label="Rating"
                      value={rating}
                      onChange={(value) =>
                        updateBlockAttributes(block.clientId, { rating: value })
                      }
                    />
                    <TextControl
                      label="Reviewer name"
                      value={reviewerName}
                      onChange={(value) =>
                        updateBlockAttributes(block.clientId, { reviewerName: value })
                      }
                    />
                    <TextControl
                      label="City"
                      value={city}
                      onChange={(value) =>
                        updateBlockAttributes(block.clientId, { city: value })
                      }
                    />
                    <TextControl
                      label="Button text"
                      value={buttonText}
                      onChange={(value) =>
                        updateBlockAttributes(block.clientId, { buttonText: value })
                      }
                    />
                    <ActionBuilder
                      label="Button action"
                      value={storyAction}
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
                        Remove story
                      </Button>
                    ) : null}
                  </PanelBody>
                );
              })}
              <Button
                variant="primary"
                onClick={() =>
                  insertBlock(createBlock(CLIENT_STORIES_ITEM_BLOCK, {}), childCount, clientId)
                }
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Add story
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

          <div {...blockProps}>
            <div
              className="riyasat-client-stories"
              style={{ background: backgroundColor }}
            >
              {(subTitle || title) && (
                <div className="riyasat-client-stories__heading">
                  {subTitle ? (
                    <p className="riyasat-client-stories__subtitle">{subTitle}</p>
                  ) : null}
                  {title ? (
                    <h3 className="riyasat-client-stories__title">{title}</h3>
                  ) : null}
                </div>
              )}

              <div className="riyasat-client-stories__track" ref={trackRef}>
                <InnerBlocks
                  allowedBlocks={[CLIENT_STORIES_ITEM_BLOCK]}
                  template={[
                    [CLIENT_STORIES_ITEM_BLOCK, {}],
                    [CLIENT_STORIES_ITEM_BLOCK, {}],
                    [CLIENT_STORIES_ITEM_BLOCK, {}],
                  ]}
                  templateLock={false}
                  renderAppender={false}
                  orientation="horizontal"
                />
              </div>

              {showPagination ? (
                <SliderPaginationDots
                  count={slideCount}
                  activeIndex={activeIndex}
                  onSelect={goToSlide}
                  className="riyasat-client-stories__pagination"
                  dotClassName="riyasat-client-stories__dot"
                  ariaLabelPrefix="Go to story"
                />
              ) : null}
            </div>
          </div>
        </>
      );
    },

    save: ({ attributes }) => {
      const { title, subTitle, backgroundColor, showPagination, action } =
        attributes;
      const blockProps = useBlockProps.save({
        className: 'riyasat-client-stories',
        'data-background-color': backgroundColor,
        'data-show-pagination': showPagination ? 'true' : 'false',
        'data-action': JSON.stringify(action ?? {}),
        style: { background: backgroundColor },
      });
      return (
        <div {...blockProps}>
          <div className="riyasat-client-stories__heading">
            {subTitle ? (
              <p className="riyasat-client-stories__subtitle">{subTitle}</p>
            ) : null}
            {title ? (
              <h3 className="riyasat-client-stories__title">{title}</h3>
            ) : null}
          </div>
          <div className="riyasat-client-stories__track">
            <InnerBlocks.Content />
          </div>
          {showPagination ? (
            <div className="riyasat-client-stories__pagination" aria-hidden="true" />
          ) : null}
        </div>
      );
    },
  });
}

/**
 * Register the client-stories parent + testimonial child. Child registers first
 * so the parent's InnerBlocks template can reference it.
 */
export function registerClientStories() {
  registerClientStoriesItem();
  registerClientStoriesParent();
}
