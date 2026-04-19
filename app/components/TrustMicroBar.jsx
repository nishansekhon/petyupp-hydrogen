export function TrustMicroBar() {
  return (
    <div
      className="trust-micro-bar fixed top-0 left-0 right-0 z-[101] w-full bg-[#f0fdf4] text-green-800 flex items-center justify-center gap-4 px-4 text-xs font-medium h-7"
    >
      <span className="hidden sm:inline">★ 4.8 rating</span>
      <span className="hidden sm:inline" aria-hidden="true">·</span>
      <span>2,000+ happy dogs</span>
      <span aria-hidden="true">·</span>
      <span>Free shipping $49+</span>
    </div>
  );
}
