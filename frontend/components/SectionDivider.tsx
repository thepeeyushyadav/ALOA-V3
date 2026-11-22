export default function SectionDivider() {
  return (
    <div
      className="absolute bottom-0 left-0 w-full"
      style={{ zIndex: 3 }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="w-full h-[60px] md:h-[120px] block"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Diagonal cut from light hero into dark About — angled polygon */}
        <polygon points="0,0 0,120 1440,120 1440,80 920,80 680,0" fill="#0F0F0F" />
      </svg>
    </div>
  );
}
