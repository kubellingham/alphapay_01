export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <span
      className="grid flex-none place-items-center rounded-[10px] bg-primary"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        width={Math.round(size * 0.56)}
        height={Math.round(size * 0.56)}
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M5 9h11l-3-3M19 15H8l3 3"
          stroke="var(--primary-fg)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
