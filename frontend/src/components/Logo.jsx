const LOGO_SRC = "https://ballotda.com/assets/logo-lg-BpzfMnc2.png"
const LOGO_ASPECT_RATIO = 541 / 149

export default function Logo({ size = 32, className = "", src, alt = "BallotDA" }) {
  return (
    <img
      src={src || LOGO_SRC}
      alt={alt}
      height={size}
      width={size * LOGO_ASPECT_RATIO}
      className={className}
      style={{ height: size, width: "auto" }}
    />
  )
}
