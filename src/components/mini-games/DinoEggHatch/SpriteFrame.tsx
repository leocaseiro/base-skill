/**
 * Renders one frame of a horizontal sprite strip via CSS background-position.
 *
 * The strip PNG contains `totalFrames` frames laid out in a single row; we
 * scale it to (totalFrames * displayWidth) x displayHeight and shift it left
 * by (frameIndex * displayWidth) to expose only the desired frame.
 *
 * Used by `DinoEggHatch` for both the egg sequence and the animal hatch
 * animation.
 */

interface SpriteFrameProps {
  /** Public URL of the strip PNG. */
  src: string;
  /** Total frames in the strip. */
  totalFrames: number;
  /** Which frame to display (0..totalFrames-1). */
  frameIndex: number;
  /** Display width of one frame, in pixels. */
  displayWidth: number;
  /** Display height of one frame, in pixels. */
  displayHeight: number;
  /** Optional additional class names (e.g. animations). */
  className?: string;
  /** Accessible label for screen readers. */
  alt?: string;
}

export const SpriteFrame = ({
  src,
  totalFrames,
  frameIndex,
  displayWidth,
  displayHeight,
  className,
  alt,
}: SpriteFrameProps) => (
  <div
    role="img"
    aria-label={alt}
    className={['select-none', className].filter(Boolean).join(' ')}
    style={{
      width: displayWidth,
      height: displayHeight,
      backgroundImage: `url(${src})`,
      backgroundRepeat: 'no-repeat',
      backgroundSize: `${totalFrames * displayWidth}px ${displayHeight}px`,
      backgroundPosition: `-${frameIndex * displayWidth}px 0`,
    }}
  />
);
