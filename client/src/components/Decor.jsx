// Background art for the coloured sections. Everything here is inline SVG drawn
// in code (no image files), so it can't go missing like a bad file path.
// All of it is decoration only: aria-hidden, no clicks, always behind the cards.

const ink = '#14122b'
const outline = { stroke: ink, strokeWidth: 4, strokeLinejoin: 'round', strokeLinecap: 'round' }

/* ---------------- kids: toys and cartoon characters ---------------- */

function Rocket({ className }) {
  return (
    <svg viewBox="0 0 120 170" className={className}>
      <g {...outline}>
        <path d="M44 118 Q60 166 76 118 Z" fill="#ffa62b" />
        <path d="M52 118 Q60 146 68 118 Z" fill="#ffd23f" stroke="none" />
        <path d="M38 88 L14 126 L40 118 Z" fill="#ff6b57" />
        <path d="M82 88 L106 126 L80 118 Z" fill="#ff6b57" />
        <path d="M60 6 C86 30 92 74 84 120 H36 C28 74 34 30 60 6 Z" fill="#fff" />
        <path d="M60 6 C71 16 77 28 79 40 H41 C43 28 49 16 60 6 Z" fill="#ff6b57" />
        <circle cx="60" cy="72" r="17" fill="#3d5afe" />
        <path d="M37 104 H83" fill="none" />
      </g>
      <circle cx="54" cy="69" r="2.5" fill="#fff" />
      <circle cx="66" cy="69" r="2.5" fill="#fff" />
      <path d="M53 76 Q60 83 67 76" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function Bear({ className }) {
  return (
    <svg viewBox="0 0 120 120" className={className}>
      <g {...outline}>
        <circle cx="30" cy="30" r="16" fill="#c98b5a" />
        <circle cx="90" cy="30" r="16" fill="#c98b5a" />
        <circle cx="60" cy="66" r="44" fill="#d9a066" />
        <ellipse cx="60" cy="82" rx="19" ry="14" fill="#f6e0c0" />
      </g>
      <circle cx="30" cy="30" r="7" fill="#f6e0c0" />
      <circle cx="90" cy="30" r="7" fill="#f6e0c0" />
      <circle cx="44" cy="58" r="5" fill={ink} />
      <circle cx="76" cy="58" r="5" fill={ink} />
      <circle cx="36" cy="72" r="6" fill="#ff6b57" opacity="0.5" />
      <circle cx="84" cy="72" r="6" fill="#ff6b57" opacity="0.5" />
      <ellipse cx="60" cy="76" rx="6" ry="4.5" fill={ink} />
      <path d="M60 80 V86 M52 88 Q60 95 68 88" fill="none" stroke={ink} strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  )
}

function StarBuddy({ className }) {
  return (
    <svg viewBox="0 0 100 100" className={className}>
      <polygon points="50,6 61,38 95,38 67,58 78,92 50,72 22,92 33,58 5,38 39,38" fill="#fff" {...outline} />
      <circle cx="42" cy="50" r="4" fill={ink} />
      <circle cx="58" cy="50" r="4" fill={ink} />
      <circle cx="36" cy="58" r="4.5" fill="#ff6b57" opacity="0.6" />
      <circle cx="64" cy="58" r="4.5" fill="#ff6b57" opacity="0.6" />
      <path d="M44 59 Q50 66 56 59" fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function Robot({ className }) {
  return (
    <svg viewBox="0 0 100 130" className={className}>
      <g {...outline}>
        <path d="M50 16 V8" fill="none" />
        <circle cx="50" cy="6" r="5" fill="#ff6b57" />
        <rect x="12" y="30" width="9" height="16" rx="3" fill="#3d5afe" />
        <rect x="79" y="30" width="9" height="16" rx="3" fill="#3d5afe" />
        <rect x="20" y="16" width="60" height="44" rx="12" fill="#b9f3dd" />
        <path d="M26 76 L10 94 M74 76 L90 94" fill="none" strokeWidth="7" />
        <rect x="26" y="64" width="48" height="38" rx="8" fill="#3d5afe" />
        <rect x="32" y="102" width="12" height="20" rx="4" fill="#ff6b57" />
        <rect x="56" y="102" width="12" height="20" rx="4" fill="#ff6b57" />
      </g>
      <circle cx="38" cy="36" r="7" fill="#fff" />
      <circle cx="62" cy="36" r="7" fill="#fff" />
      <circle cx="39" cy="37" r="3" fill={ink} />
      <circle cx="63" cy="37" r="3" fill={ink} />
      <path d="M40 50 H60" stroke={ink} strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="50" cy="83" r="9" fill="#ffd23f" stroke={ink} strokeWidth="3" />
    </svg>
  )
}

function Cloud({ className }) {
  const shapes = (
    <>
      <circle cx="40" cy="50" r="22" />
      <circle cx="72" cy="38" r="28" />
      <circle cx="104" cy="52" r="20" />
      <rect x="40" y="50" width="64" height="22" />
    </>
  )
  return (
    <svg viewBox="0 0 140 84" className={className}>
      <g fill={ink} stroke={ink} strokeWidth="8" strokeLinejoin="round">{shapes}</g>
      <g fill="#fff">{shapes}</g>
      <circle cx="60" cy="48" r="3.5" fill={ink} />
      <circle cx="84" cy="48" r="3.5" fill={ink} />
      <circle cx="54" cy="56" r="4" fill="#ff6b57" opacity="0.5" />
      <circle cx="90" cy="56" r="4" fill="#ff6b57" opacity="0.5" />
      <path d="M65 56 Q72 64 79 56" fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function Blocks({ className }) {
  const letter = { fill: '#fff', fontSize: 30, fontWeight: 800, textAnchor: 'middle', fontFamily: 'Bricolage Grotesque, sans-serif' }
  return (
    <svg viewBox="0 0 150 112" className={className}>
      <g {...outline}>
        <rect x="6" y="58" width="52" height="48" rx="6" fill="#ff6b57" />
        <rect x="64" y="58" width="52" height="48" rx="6" fill="#3d5afe" />
        <g transform="rotate(-10 60 34)">
          <rect x="34" y="8" width="52" height="48" rx="6" fill="#5b3df5" />
        </g>
      </g>
      <text x="32" y="92" {...letter}>A</text>
      <text x="90" y="92" {...letter}>B</text>
      <text x="60" y="40" transform="rotate(-10 60 34)" {...letter}>C</text>
    </svg>
  )
}

function Balloon({ className, color = '#ff6b57' }) {
  return (
    <svg viewBox="0 0 60 120" className={className}>
      <path d="M30 70 Q22 92 30 118" fill="none" stroke={ink} strokeWidth="2.5" strokeLinecap="round" />
      <g {...outline}>
        <ellipse cx="30" cy="34" rx="24" ry="30" fill={color} />
        <path d="M26 65 L30 71 L34 65 Z" fill={color} />
      </g>
      <ellipse cx="21" cy="22" rx="5" ry="9" fill="#fff" opacity="0.5" transform="rotate(20 21 22)" />
    </svg>
  )
}

function Pinwheel({ className }) {
  return (
    <div className={className}>
      <svg viewBox="0 0 80 80" className="w-full animate-[spin_6s_linear_infinite] motion-reduce:animate-none">
        <g {...outline} strokeWidth="3">
          <path d="M40 40 L40 4 L72 22 Z" fill="#ff6b57" />
          <path d="M40 40 L76 40 L58 72 Z" fill="#3d5afe" />
          <path d="M40 40 L40 76 L8 58 Z" fill="#5b3df5" />
          <path d="M40 40 L4 40 L22 8 Z" fill="#fff" />
        </g>
        <circle cx="40" cy="40" r="5" fill={ink} />
      </svg>
      <div className="mx-auto -mt-2 h-24 w-1.5 rounded bg-ink/60" />
    </div>
  )
}

function Squiggle({ className }) {
  return (
    <svg viewBox="0 0 64 20" className={className}>
      <path d="M2 10 Q10 -2 18 10 T34 10 T50 10 T62 10" fill="none" stroke="#ff6b57" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

function StarShape({ className, fill }) {
  return (
    <svg viewBox="0 0 100 100" className={className}>
      <polygon points="50,6 61,38 95,38 67,58 78,92 50,72 22,92 33,58 5,38 39,38" fill={fill} />
    </svg>
  )
}

function KidsDecor() {
  const bob = 'animate-bob motion-reduce:animate-none'
  return (
    <>
      {/* polka dots */}
      <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(rgba(255,255,255,0.8)_2.5px,transparent_3px)] [background-size:34px_34px]" />

      {/* top: rocket, star buddy and a cloud next to the heading */}
      <Rocket className={`absolute top-4 right-[5%] w-20 [--tilt:14deg] md:top-10 md:w-36 xl:w-44 ${bob}`} />
      <StarBuddy className={`absolute top-3 right-[30%] w-12 [--tilt:-10deg] md:top-8 md:w-24 ${bob} [animation-delay:-1.5s]`} />
      <Cloud className="absolute top-8 left-[56%] hidden w-24 opacity-95 md:block md:w-36" />

      {/* bottom: characters peeking up from under the cards */}
      <Bear className="absolute bottom-0 left-[3%] w-16 md:w-28" />
      <Blocks className="absolute bottom-0 left-[28%] w-20 md:w-36" />
      <Robot className={`absolute bottom-0 right-[4%] w-14 md:w-24 ${bob} [--tilt:-4deg] [animation-duration:5s]`} />

      {/* wide screens: balloons and a pinwheel in the side margins */}
      <Balloon color="#ff6b57" className={`absolute top-1/3 left-[1%] hidden w-14 xl:block ${bob}`} />
      <Balloon color="#5b3df5" className={`absolute top-1/2 left-[4%] hidden w-12 xl:block ${bob} [animation-delay:-2s]`} />
      <Pinwheel className="absolute top-[45%] right-[1.5%] hidden w-16 xl:block" />

      {/* confetti */}
      <Squiggle className="absolute top-[40%] left-[2%] hidden w-12 md:block" />
      <Squiggle className="absolute top-[26%] right-[18%] hidden w-14 -rotate-12 lg:block" />
      <StarShape fill="#5b3df5" className="absolute top-[14%] left-[40%] hidden w-6 rotate-12 md:block" />
      <StarShape fill="#ff6b57" className="absolute right-[2%] bottom-[30%] hidden w-7 -rotate-12 lg:block" />
      <span className="absolute top-[30%] left-[48%] hidden size-8 rounded-full border-4 border-white/80 md:block" />
      <span className="absolute right-[12%] bottom-[8%] hidden size-5 rounded-full bg-[#3d5afe] md:block" />
    </>
  )
}

/* ---------------- adults: globe, lamp, coffee and a bookshelf ---------------- */

function Globe({ className }) {
  return (
    <svg viewBox="0 0 200 220" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="100" cy="100" r="90" />
      <ellipse cx="100" cy="100" rx="38" ry="90" />
      <ellipse cx="100" cy="100" rx="68" ry="90" />
      <path d="M100 10 V190 M10 100 H190" />
      <ellipse cx="100" cy="100" rx="90" ry="26" />
      <path d="M22 62 Q100 38 178 62 M22 138 Q100 162 178 138" />
      <path d="M52 78 q10 -12 24 -6 q6 10 -2 20 q-14 8 -22 -14z M112 56 q16 -6 28 6 q2 14 -10 22 q-14 -2 -18 -28z M120 116 q12 -6 20 6 q-2 12 -14 14 q-10 -8 -6 -20z" fill="currentColor" fillOpacity="0.35" stroke="none" />
      <path d="M30 168 Q100 214 170 168" strokeWidth="2.5" />
      <path d="M100 190 V208 M76 210 H124" strokeWidth="3" />
    </svg>
  )
}

function Lamp({ className }) {
  return (
    <svg viewBox="0 0 90 220" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="45" cy="52" r="42" fill="#ffd23f" fillOpacity="0.14" stroke="none" />
      <path d="M26 24 H64 L76 62 H14 Z" fill="#ffd23f" fillOpacity="0.25" />
      <path d="M45 62 V206 M24 208 H66" />
    </svg>
  )
}

function Mug({ className, steam = '#fff' }) {
  return (
    <svg viewBox="0 0 90 100" className={className}>
      <g fill="none" stroke={steam} strokeOpacity="0.7" strokeWidth="3" strokeLinecap="round">
        <path d="M30 34 Q24 24 30 14" className="animate-steam motion-reduce:animate-none" />
        <path d="M44 34 Q38 22 44 8" className="animate-steam [animation-delay:-1s] motion-reduce:animate-none" />
        <path d="M58 34 Q52 24 58 14" className="animate-steam [animation-delay:-2s] motion-reduce:animate-none" />
      </g>
      <path d="M62 52 H72 Q84 52 84 64 Q84 76 70 76 H62" fill="none" stroke="#ff6b57" strokeWidth="6" strokeLinecap="round" />
      <path d="M12 42 H66 V74 Q66 94 40 94 Q12 94 12 74 Z" fill="#ff6b57" />
      <ellipse cx="39" cy="42" rx="27" ry="5" fill="#8a2f22" />
    </svg>
  )
}

function Sparkle({ className, delay = '0s' }) {
  return (
    <svg viewBox="0 0 20 20" className={`animate-twinkle motion-reduce:animate-none ${className}`} style={{ animationDelay: delay }}>
      <path d="M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8 Z" fill="#ffd23f" />
    </svg>
  )
}

// a row of book spines. made from a formula so I don't have to type 60 of them
const spineColors = ['bg-violet/70', 'bg-coral/60', 'bg-sun/55', 'bg-blue/65', 'bg-mint/45']
const spines = Array.from({ length: 70 }, (_, i) => ({
  w: 14 + ((i * 7) % 4) * 6,
  h: 48 + ((i * 13) % 5) * 12,
  color: spineColors[(i * 3) % spineColors.length],
  lean: i % 17 === 9,
}))

function AdultsDecor() {
  return (
    <>
      {/* big globe in the corner */}
      <Globe className="absolute -top-8 -right-16 w-52 animate-bob text-sun/40 [--tilt:6deg] motion-reduce:animate-none md:-right-12 md:w-80 xl:right-[4%] xl:w-[26rem]" />

      {/* reading lamp in the side margin */}
      <Lamp className="absolute top-16 left-[1%] hidden w-20 text-sun/70 xl:block" />

      {/* twinkling stars */}
      <Sparkle className="absolute top-[8%] left-[44%] w-4" />
      <Sparkle className="absolute top-[20%] left-[30%] hidden w-3 md:block" delay="-1s" />
      <Sparkle className="absolute top-[12%] left-[62%] w-5" delay="-1.7s" />
      <Sparkle className="absolute top-[34%] right-[8%] hidden w-3 md:block" delay="-0.6s" />
      <Sparkle className="absolute top-[44%] left-[6%] hidden w-4 lg:block" delay="-2s" />

      {/* bookshelf along the bottom, with a coffee mug on it */}
      <div className="absolute inset-x-0 bottom-0 h-20 md:h-28">
        <div className="flex h-full items-end gap-1 overflow-hidden px-2">
          {spines.map((s, i) => (
            <span
              key={i}
              className={`shrink-0 rounded-t-sm ${s.color} ${s.lean ? 'origin-bottom-left rotate-12' : ''}`}
              style={{ width: s.w, height: `${s.h}%` }}
            />
          ))}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-1.5 bg-white/20" />
      <Mug className="absolute right-[5%] bottom-1.5 w-16 md:w-28" />
    </>
  )
}


/* ---------------- teens: neon, games and music ---------------- */

const lime = '#c6ff3d'
const pink = '#ff2e93'
const cyan = '#22d3ee'
const night = '#0d0221'

function Die({ className }) {
  return (
    <svg viewBox="0 0 100 100" className={className} strokeLinejoin="round" strokeLinecap="round">
      <polygon points="50,4 92,27 92,73 50,96 8,73 8,27" fill="#22093f" stroke={lime} strokeWidth="4" />
      <polygon points="50,24 74,66 26,66" fill="none" stroke={lime} strokeWidth="3" />
      <path d="M50 4 V24 M92 27 L74 66 M8 27 L26 66 M50 96 V66 M92 73 L74 66 M8 73 L26 66" stroke={lime} strokeWidth="2.5" fill="none" />
      <text x="50" y="58" textAnchor="middle" fontSize="19" fontWeight="700" fill={lime} fontFamily="Space Grotesk, sans-serif">20</text>
    </svg>
  )
}

function Bolt({ className }) {
  return (
    <svg viewBox="0 0 100 100" className={className}>
      <polygon points="58,4 20,56 46,56 38,96 82,40 54,40" fill={pink} stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  )
}

function Headphones({ className }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" strokeLinecap="round">
      <path d="M14 60 A36 36 0 0 1 86 60" stroke={cyan} strokeWidth="7" />
      <rect x="6" y="54" width="20" height="34" rx="9" fill={cyan} stroke={night} strokeWidth="3" />
      <rect x="74" y="54" width="20" height="34" rx="9" fill={cyan} stroke={night} strokeWidth="3" />
      <path d="M16 66 V76 M84 66 V76" stroke={night} strokeWidth="3" />
    </svg>
  )
}

function Controller({ className }) {
  return (
    <svg viewBox="0 0 100 62" className={className}>
      <path d="M24 6 H76 Q96 6 98 32 L92 54 Q88 62 78 56 L68 44 H32 L22 56 Q12 62 8 54 L2 32 Q4 6 24 6Z" fill="#22093f" stroke={pink} strokeWidth="4" strokeLinejoin="round" />
      <path d="M26 20 V34 M19 27 H33" stroke={cyan} strokeWidth="5" strokeLinecap="round" />
      <circle cx="72" cy="22" r="5" fill={lime} />
      <circle cx="82" cy="30" r="5" fill={pink} />
      <circle cx="62" cy="30" r="5" fill={cyan} />
    </svg>
  )
}

function Vinyl({ className }) {
  return (
    <svg viewBox="0 0 100 100" className={`animate-[spin_5s_linear_infinite] motion-reduce:animate-none ${className}`}>
      <circle cx="50" cy="50" r="46" fill="#120626" stroke="#fff" strokeOpacity="0.3" strokeWidth="2" />
      <circle cx="50" cy="50" r="36" fill="none" stroke="#fff" strokeOpacity="0.15" strokeWidth="2" />
      <circle cx="50" cy="50" r="27" fill="none" stroke="#fff" strokeOpacity="0.15" strokeWidth="2" />
      <path d="M20 40 A32 32 0 0 1 40 20" stroke="#fff" strokeOpacity="0.35" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="50" cy="50" r="14" fill={pink} />
      <circle cx="50" cy="50" r="3" fill={night} />
    </svg>
  )
}

function Sticker({ className }) {
  return (
    <svg viewBox="0 0 100 100" className={className}>
      <circle cx="50" cy="50" r="46" fill={lime} stroke={night} strokeWidth="4" />
      <text x="50" y="47" textAnchor="middle" fontSize="25" fontWeight="700" fill={night} fontFamily="Space Grotesk, sans-serif">LVL</text>
      <text x="50" y="72" textAnchor="middle" fontSize="25" fontWeight="700" fill={night} fontFamily="Space Grotesk, sans-serif">UP!</text>
    </svg>
  )
}

function Plus({ className, color }) {
  return (
    <svg viewBox="0 0 20 20" className={className}>
      <path d="M10 2 V18 M2 10 H18" stroke={color} strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

function TeensDecor() {
  const bob = 'animate-bob motion-reduce:animate-none'
  return (
    <>
      <Die className={`absolute top-4 right-[6%] w-20 [--tilt:-12deg] md:top-10 md:w-36 xl:w-44 ${bob}`} />
      <Bolt className={`absolute top-6 right-[32%] w-10 [--tilt:10deg] md:top-12 md:w-20 ${bob} [animation-delay:-1.5s]`} />
      <Headphones className={`absolute top-8 left-[58%] hidden w-24 [--tilt:-6deg] lg:block ${bob} [animation-delay:-2.5s]`} />

      <Controller className="absolute bottom-0 left-[3%] w-24 md:w-40" />
      <Vinyl className="absolute bottom-0 left-[30%] w-16 md:w-28" />
      <Sticker className={`absolute bottom-0 right-[4%] w-16 [--tilt:8deg] md:w-24 ${bob} [animation-duration:5s]`} />

      <Plus color={cyan} className="absolute top-[40%] left-[2%] hidden w-6 md:block" />
      <Plus color={pink} className="absolute top-[22%] left-[44%] hidden w-5 md:block" />
      <Plus color={lime} className="absolute right-[3%] bottom-[34%] hidden w-6 lg:block" />
      <span className="absolute top-[34%] right-[18%] hidden size-10 rounded-full border-[3px] border-dashed border-cyan md:block" />
      <span className="absolute right-[14%] bottom-[10%] hidden size-4 rotate-45 bg-hot md:block" />
    </>
  )
}

/* ---------------- students: notebook, sticky notes, coffee ---------------- */

function StickyNote({ className }) {
  return (
    <svg viewBox="0 0 100 100" className={className}>
      <rect x="8" y="10" width="86" height="86" fill="#14122b" opacity="0.18" />
      <path d="M4 4 H96 V70 L70 96 H4 Z" fill="#fde047" stroke="#14122b" strokeWidth="3" strokeLinejoin="round" />
      <path d="M70 96 V70 H96" fill="#facc15" stroke="#14122b" strokeWidth="3" strokeLinejoin="round" />
      <text x="16" y="34" fontSize="19" fontWeight="800" fill="#14122b" fontFamily="Bricolage Grotesque, sans-serif">Exam</text>
      <text x="16" y="56" fontSize="19" fontWeight="800" fill="#ef4444" fontFamily="Bricolage Grotesque, sans-serif">Fri!</text>
      <path d="M16 70 H52" stroke="#14122b" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function Pencil({ className }) {
  return (
    <svg viewBox="0 0 40 150" className={className} strokeLinejoin="round">
      <g stroke="#14122b" strokeWidth="3">
        <rect x="10" y="6" width="20" height="14" rx="3" fill="#ff8fa3" />
        <rect x="10" y="18" width="20" height="8" fill="#cbd5e1" />
        <rect x="10" y="26" width="20" height="94" fill="#fde047" />
        <polygon points="10,120 30,120 20,148" fill="#f6d6a8" />
        <polygon points="16,138 24,138 20,148" fill="#14122b" />
      </g>
      <path d="M20 30 V118" stroke="#14122b" strokeOpacity="0.25" strokeWidth="2" />
    </svg>
  )
}

function GradCap({ className }) {
  return (
    <svg viewBox="0 0 120 90" className={className} strokeLinejoin="round" strokeLinecap="round">
      <path d="M28 46 V68 Q60 88 92 68 V46 L60 60 Z" fill="#2563eb" stroke="#14122b" strokeWidth="3" />
      <polygon points="60,6 118,32 60,58 2,32" fill="#14122b" />
      <path d="M108 34 V68" stroke="#f5a524" strokeWidth="3.5" />
      <circle cx="108" cy="72" r="5" fill="#f5a524" stroke="#14122b" strokeWidth="2" />
    </svg>
  )
}

function BookStack({ className }) {
  return (
    <svg viewBox="0 0 120 80" className={className} strokeLinejoin="round">
      <g stroke="#14122b" strokeWidth="3">
        <rect x="6" y="52" width="108" height="22" rx="3" fill="#2563eb" />
        <rect x="16" y="30" width="90" height="22" rx="3" fill="#ff6b57" />
        <g transform="rotate(-4 60 20)"><rect x="10" y="8" width="96" height="22" rx="3" fill="#fde047" /></g>
      </g>
      <path d="M14 63 H100 M24 41 H92" stroke="#fff" strokeOpacity="0.6" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function Calculator({ className }) {
  const keys = [0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => ({ x: 17 + c * 18, y: 40 + r * 15, k: `${r}${c}` })))
  return (
    <svg viewBox="0 0 70 90" className={className}>
      <rect x="4" y="4" width="62" height="82" rx="9" fill="#14122b" />
      <rect x="11" y="11" width="48" height="19" rx="4" fill="#b9f3dd" />
      <text x="54" y="26" textAnchor="end" fontSize="14" fontWeight="700" fill="#14122b" fontFamily="DM Sans, sans-serif">3.14</text>
      {keys.map((k, i) => <circle key={k.k} cx={k.x} cy={k.y} r="5.5" fill={i === 8 ? '#ff6b57' : '#fff'} />)}
    </svg>
  )
}

function Bulb({ className }) {
  return (
    <svg viewBox="0 0 70 90" className={className} strokeLinecap="round" strokeLinejoin="round">
      <g stroke="#14122b" strokeOpacity="0.55" strokeWidth="3.5" className="animate-twinkle motion-reduce:animate-none">
        <path d="M35 2 V8 M8 18 L13 22 M62 18 L57 22 M2 44 H8 M68 44 H62" />
      </g>
      <path d="M35 14 C14 14 10 38 22 50 C26 54 26 58 26 62 H44 C44 58 44 54 48 50 C60 38 56 14 35 14Z" fill="#fde047" stroke="#14122b" strokeWidth="3.5" />
      <rect x="26" y="62" width="18" height="8" rx="2" fill="#cbd5e1" stroke="#14122b" strokeWidth="3" />
      <rect x="29" y="70" width="12" height="7" rx="2" fill="#14122b" />
    </svg>
  )
}

function StudentsDecor() {
  const bob = 'animate-bob motion-reduce:animate-none'
  return (
    <>
      <StickyNote className={`absolute top-4 right-[5%] w-20 [--tilt:6deg] md:top-10 md:w-36 xl:w-40 ${bob}`} />
      <GradCap className={`absolute top-3 right-[30%] w-16 [--tilt:-8deg] md:top-8 md:w-28 ${bob} [animation-delay:-1.5s]`} />
      <Pencil className="absolute top-6 right-[48%] hidden w-8 rotate-45 md:block md:w-10" />

      <BookStack className="absolute bottom-0 left-[3%] w-24 md:w-40" />
      <Calculator className="absolute bottom-0 left-[30%] w-14 -rotate-6 md:w-20" />
      <Mug steam="#14122b" className="absolute right-[5%] bottom-0 w-16 md:w-24" />

      <Bulb className="absolute top-[40%] left-[2%] hidden w-14 xl:block" />
      <Squiggle className="absolute top-[28%] right-[20%] hidden w-14 -rotate-6 lg:block" />
      <StarShape fill="#2563eb" className="absolute top-[16%] left-[42%] hidden w-6 rotate-12 md:block" />
      <StarShape fill="#ff6b57" className="absolute right-[3%] bottom-[34%] hidden w-6 -rotate-12 lg:block" />
    </>
  )
}

/* ---------------- scientists: lab, atoms and graph paper ---------------- */

const lab = '#0a2a2f'
const tealDeep = '#14b8a6'

function Atom({ className }) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" stroke={lab} strokeWidth="3">
      <ellipse cx="60" cy="60" rx="52" ry="18" />
      <ellipse cx="60" cy="60" rx="52" ry="18" transform="rotate(60 60 60)" />
      <ellipse cx="60" cy="60" rx="52" ry="18" transform="rotate(120 60 60)" />
      <circle cx="60" cy="60" r="9" fill="#f5a524" />
      <circle cx="112" cy="60" r="6" fill={tealDeep} />
      <circle cx="34" cy="15" r="6" fill={tealDeep} />
      <circle cx="34" cy="105" r="6" fill={tealDeep} />
    </svg>
  )
}

function Planet({ className }) {
  return (
    <svg viewBox="0 0 120 90" className={className} strokeLinecap="round">
      <ellipse cx="60" cy="45" rx="54" ry="13" transform="rotate(-18 60 45)" fill="none" stroke={lab} strokeWidth="3" />
      <circle cx="60" cy="45" r="27" fill="#f5a524" stroke={lab} strokeWidth="3" />
      <path d="M38 38 Q60 30 82 40 M34 52 Q60 60 86 50" stroke={lab} strokeOpacity="0.35" strokeWidth="3" fill="none" />
      <path d="M12 58 Q60 78 108 34" fill="none" stroke={lab} strokeWidth="3" />
    </svg>
  )
}

// DNA helix points, worked out once from a sine wave
const helix = Array.from({ length: 51 }, (_, i) => {
  const y = i * 4
  const dx = 18 * Math.sin(y / 14)
  return { y, a: 30 + dx, b: 30 - dx, rung: i % 3 === 0 }
})
const strand = (key) => helix.map((p, i) => `${i ? 'L' : 'M'}${p[key].toFixed(1)} ${p.y}`).join(' ')

function Helix({ className }) {
  return (
    <svg viewBox="0 0 60 200" className={className} fill="none" strokeLinecap="round">
      {helix.filter((p) => p.rung).map((p) => (
        <path key={p.y} d={`M${p.a.toFixed(1)} ${p.y} L${p.b.toFixed(1)} ${p.y}`} stroke={lab} strokeOpacity="0.35" strokeWidth="3" />
      ))}
      <path d={strand('a')} stroke={tealDeep} strokeWidth="5" />
      <path d={strand('b')} stroke="#f5a524" strokeWidth="5" />
    </svg>
  )
}

function Flask({ className }) {
  return (
    <svg viewBox="0 0 80 100" className={className} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 68 H60 L71 86 Q75 95 65 95 H15 Q5 95 9 86 Z" fill={tealDeep} />
      <g fill="#fff" fillOpacity="0.8">
        <circle cx="36" cy="58" r="3.5" className="animate-steam motion-reduce:animate-none" />
        <circle cx="46" cy="50" r="3" className="animate-steam [animation-delay:-1s] motion-reduce:animate-none" />
        <circle cx="40" cy="42" r="2.5" className="animate-steam [animation-delay:-2s] motion-reduce:animate-none" />
      </g>
      <path d="M30 6 H50 M32 6 V38 L8 86 Q4 96 16 96 H64 Q76 96 72 86 L48 38 V6" fill="none" stroke={lab} strokeWidth="4" />
    </svg>
  )
}

function TestTubes({ className }) {
  const tubes = [{ x: 8, c: '#f5a524' }, { x: 44, c: tealDeep }, { x: 80, c: '#ff2e93' }]
  return (
    <svg viewBox="0 0 120 100" className={className} strokeLinecap="round">
      {tubes.map((t) => (
        <g key={t.x}>
          <path d={`M${t.x + 2} 40 H${t.x + 24} V68 Q${t.x + 24} 86 ${t.x + 13} 86 Q${t.x + 2} 86 ${t.x + 2} 68 Z`} fill={t.c} />
          <path d={`M${t.x} 6 H${t.x + 26} M${t.x + 2} 6 V68 Q${t.x + 2} 88 ${t.x + 13} 88 Q${t.x + 24} 88 ${t.x + 24} 68 V6`} fill="none" stroke={lab} strokeWidth="4" />
        </g>
      ))}
      <path d="M2 94 H118" stroke={lab} strokeWidth="4" />
    </svg>
  )
}

function Graph({ className }) {
  return (
    <svg viewBox="0 0 140 90" className={className} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 6 V80 H134" stroke={lab} strokeWidth="3" />
      <path d="M14 70 C34 70 38 24 62 24 S92 62 134 18" stroke={tealDeep} strokeWidth="4" />
      <g fill="#f5a524" stroke={lab} strokeWidth="2">
        <circle cx="38" cy="44" r="4" /><circle cx="62" cy="24" r="4" /><circle cx="92" cy="56" r="4" /><circle cx="118" cy="30" r="4" />
      </g>
    </svg>
  )
}

function Molecule({ className }) {
  const pts = [[50, 8], [90, 30], [90, 70], [50, 92], [10, 70], [10, 30]]
  return (
    <svg viewBox="0 0 100 100" className={className} strokeLinecap="round">
      <g stroke={lab} strokeWidth="3.5">
        {pts.map(([x, y], i) => <path key={i} d={`M${x} ${y} L${pts[(i + 1) % 6][0]} ${pts[(i + 1) % 6][1]}`} />)}
        <path d="M50 8 L50 50 M10 70 L50 50 M90 70 L50 50" strokeOpacity="0.5" />
      </g>
      {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 2 ? 8 : 6} fill={i % 2 ? '#f5a524' : tealDeep} stroke={lab} strokeWidth="3" />)}
      <circle cx="50" cy="50" r="9" fill="#fff" stroke={lab} strokeWidth="3" />
    </svg>
  )
}

function ScientistsDecor() {
  const bob = 'animate-bob motion-reduce:animate-none'
  const formula = 'absolute hidden font-mono text-lab/30 md:block'
  return (
    <>
      <Atom className="absolute top-4 right-[5%] w-20 animate-[spin_24s_linear_infinite] motion-reduce:animate-none md:top-10 md:w-36 xl:w-44" />
      <Planet className={`absolute top-3 right-[30%] w-16 [--tilt:-6deg] md:top-8 md:w-28 ${bob}`} />
      <Helix className="absolute top-[12%] right-[1.5%] hidden h-56 xl:block" />

      <Flask className="absolute bottom-0 left-[3%] w-16 md:w-24" />
      <TestTubes className="absolute bottom-0 left-[22%] w-24 md:w-36" />
      <Graph className="absolute bottom-0 right-[6%] w-28 md:w-44" />
      <Molecule className={`absolute top-[38%] left-[2%] hidden w-16 xl:block ${bob} [--tilt:8deg]`} />

      <span className={`${formula} top-[18%] left-[45%] text-lg`}>E = mc²</span>
      <span className={`${formula} top-[36%] right-[16%] text-base`}>ΔG = ΔH − TΔS</span>
      <span className={`${formula} bottom-[30%] left-[48%] text-base`}>∇·E = ρ/ε₀</span>
    </>
  )
}

const decorations = { kids: KidsDecor, teens: TeensDecor, adults: AdultsDecor, students: StudentsDecor, scientists: ScientistsDecor }

export default function Decor({ id }) {
  const Art = decorations[id]
  if (!Art) return null
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <Art />
    </div>
  )
}

// small drawings the home page tiles reuse
export { Bear, Die, Globe, Pencil, Atom }
