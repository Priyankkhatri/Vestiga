interface BrandMarkProps {
  alt?: string;
  className?: string;
  decorative?: boolean;
  imageClassName?: string;
}

interface BrandLockupProps {
  className?: string;
  imageClassName?: string;
  markClassName?: string;
  textClassName?: string;
}

function cx(...parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export function BrandMark({
  alt = 'Vestiga logo',
  className,
  decorative = false,
  imageClassName,
}: BrandMarkProps) {
  return (
    <div className={cx('shrink-0 overflow-hidden', className)}>
      <img
        src="/brand-logo.png"
        alt={decorative ? '' : alt}
        aria-hidden={decorative || undefined}
        className={cx('h-full w-full object-contain', imageClassName)}
      />
    </div>
  );
}

export function BrandLockup({
  className,
  imageClassName,
  markClassName,
  textClassName,
}: BrandLockupProps) {
  return (
    <div className={cx('flex items-center gap-2.5', className)}>
      <BrandMark
        decorative
        className={cx('h-8 w-8', markClassName)}
        imageClassName={imageClassName}
      />
      <span className={cx('text-lg font-bold tracking-tight', textClassName)}>
        Vestiga
      </span>
    </div>
  );
}
