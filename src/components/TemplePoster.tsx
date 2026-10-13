import { wedding } from '../data/wedding'
import { ImageWithFallback } from './UI'
import { TempleIllustration } from './Ornaments'

export default function TemplePoster({ className = 'temple-poster', label = '', night = false, mandapam = false }: { className?: string; label?: string; night?: boolean; mandapam?: boolean }) {
  const source = mandapam ? wedding.artwork.mandapam : night ? wedding.artwork.templeNight : wedding.artwork.templeDay
  return <ImageWithFallback src={source} alt={label} className={className} fallback={<TempleIllustration className={className} label={label || undefined} night={night} />} />
}
