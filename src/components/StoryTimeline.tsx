import { Flame, Flower2, Leaf, Heart } from 'lucide-react'
import { wedding } from '../data/wedding'
import { useInvitation } from '../context/InvitationContext'
import { ImageWithFallback, Reveal, SectionHeading } from './UI'
import { Lotus } from './Ornaments'

export default function StoryTimeline() {
  const { l } = useInvitation()
  return <section id="story" className="section story-section"><div className="container">
    <SectionHeading eyebrow="storyEyebrow" title="storyTitle" accent="storyAccent" description="storyText" />
    <div className="story-timeline">{wedding.story.map((item, index) => {
      const Icon = item.motif === 'flame' ? Flame : item.motif === 'leaf' ? Leaf : item.motif === 'rings' ? Heart : Flower2
      return <Reveal className={`story-item ${index % 2 ? 'story-right' : 'story-left'}`} key={item.id}>
        <div className="story-marker"><Icon size={19} strokeWidth={1.25} /></div><div className="story-content"><span className="story-chapter">0{index + 1} <span /> {l(item.category)}</span><span className="story-date">{l(item.date)}</span><h3>{l(item.title)}</h3><p>{l(item.description)}</p>{l(item.location) && <span className="story-location">{l(item.location)}</span>}{item.image && <ImageWithFallback src={item.image} alt={l(item.title)} className="story-photo" fallback={<div className="story-photo-placeholder"><Lotus /></div>} />}</div>
        <div className="story-art" aria-hidden="true"><Icon strokeWidth={.5} /><span>0{index + 1}</span></div>
      </Reveal>
    })}</div>
  </div></section>
}
