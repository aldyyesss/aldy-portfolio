# Disable Vercel Image Optimization

## Goal

Restore image rendering on `scientivan.dev` after Vercel Image Optimization reached its usage limit.

## Evidence

On 17 July 2026, the production image optimizer endpoint returned HTTP 402 with `x-vercel-error: OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED`. The original image URL, `/images/dien.jpg`, returned HTTP 200.

## Chosen approach

Set `images.unoptimized` to `true` in `next.config.ts`.

This applies to every `next/image` component, so the browser requests each original image directly instead of `/_next/image`. No image paths, content, or components change.

## Trade-offs

Images will no longer receive Vercel's automatic resizing and format optimization. They will render reliably from the deployed static assets and avoid the optimizer quota.

## Verification

1. Run the frontend production build.
2. Confirm the build emits image URLs that point directly to `/images/...`, rather than `/_next/image`.
3. After deployment, request a representative image on `scientivan.dev` and confirm HTTP 200.
