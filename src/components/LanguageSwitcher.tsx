import { useInvitation } from '../context/InvitationContext'

export default function LanguageSwitcher() {
  const { language, setLanguage } = useInvitation()
  return <div className="language-switcher" role="group" aria-label="Language / மொழி"><button aria-pressed={language === 'en'} onClick={() => setLanguage('en')} lang="en">EN</button><span /><button aria-pressed={language === 'ta'} onClick={() => setLanguage('ta')} lang="ta">தமிழ்</button></div>
}
