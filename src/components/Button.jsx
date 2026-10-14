// variant "none" means: no colours or shape, the caller (usually a theme) brings its own
const variants = {
  accent: 'rounded-full bg-sun text-ink',
  primary: 'rounded-full bg-blue text-white',
  coral: 'rounded-full bg-coral text-white',
  none: '',
}

// Button. Renders an <a> by default, or pass as="button" for real buttons.
export default function Button({ variant = 'accent', compact = false, large = false, as: Tag = 'a', className = '', ...props }) {
  return (
    <Tag
      className={`inline-flex items-center justify-center font-bold transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45 ${
        large ? 'min-h-14 px-8 text-lg' : compact ? 'min-h-11 px-3 min-[360px]:px-4' : 'min-h-11 px-5'
      } ${variants[variant]} ${className}`}
      {...props}
    />
  )
}
