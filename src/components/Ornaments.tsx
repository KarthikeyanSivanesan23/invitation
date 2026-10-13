import { useId } from 'react'

export function Lotus({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 100 70" fill="none" stroke="currentColor" strokeWidth="1.1" aria-hidden="true">
    <path d="M50 56C25 45 36 22 50 8c14 14 25 37 0 48Z" /><path d="M50 56C25 58 12 35 15 18c21 1 37 15 35 38Zm0 0c25 2 38-21 35-38-21 1-37 15-35 38Z" />
    <path d="M50 56C24 65 4 52 2 35c20-5 39 2 48 21Zm0 0c26 9 46-4 48-21-20-5-39 2-48 21Z" /><path d="M25 64h50M35 68h30M50 17v38" />
  </svg>
}

export function Kolam({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 180 180" fill="none" stroke="currentColor" strokeWidth=".8" aria-hidden="true">
    {[0, 45, 90, 135].map(angle => <g key={angle} transform={`rotate(${angle} 90 90)`}><path d="M90 10C132 40 128 58 90 90C52 58 48 40 90 10Zm0 160c42-30 38-48 0-80-38 32-42 50 0 80Z" /><path d="M90 27c24 20 24 36 0 55-24-19-24-35 0-55Z" /></g>)}
    <circle cx="90" cy="90" r="12" /><circle cx="90" cy="90" r="4" />
    {[0, 90, 180, 270].map(angle => <circle key={angle} cx="90" cy="7" r="2" transform={`rotate(${angle} 90 90)`} />)}
  </svg>
}

export function Botanical({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 300 560" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
    <path d="M60 560C79 442 35 350 123 233S252 76 238 0M76 474C133 457 160 415 202 393M75 391C47 339 23 324 5 273M104 272C164 245 215 224 265 166M151 202C140 140 111 113 92 83" />
    {Array.from({ length: 11 }, (_, i) => <g key={i} transform={`translate(${75 + i * 14} ${445 - i * 39}) rotate(${i % 2 ? -32 : 28})`}>
      <path d="M0 0C-53-7-65-42-56-71C-12-60 6-30 0 0Z" /><path d="M0 0-56-71M-11-14l-27-3M-24-30l-3-24M-34-44l-21-4" />
      <path d="M2-5C47-17 60-46 42-72C10-56-2-32 2-5Z" /><path d="m2-5 40-67M13-25l23-6M23-43l-1-17" />
    </g>)}
  </svg>
}

export function Bell({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 65 220" fill="none" stroke="currentColor" aria-hidden="true"><path d="M32 0v131M29 17h6M29 35h6M29 53h6M29 71h6M29 89h6M29 107h6" /><circle cx="32" cy="136" r="5" /><path d="M21 151c0-14 22-14 22 0l3 24 9 9H9l9-9 3-24Z" /><path d="M19 158h27M17 175h31M10 188h45" /><ellipse cx="32" cy="185" rx="23" ry="5" /><path d="M32 189v13" /><circle cx="32" cy="204" r="4" /></svg>
}

export function TempleIllustration({ className = '', label, night = false }: { className?: string; label?: string; night?: boolean }) {
  const id = useId().replaceAll(':', '')
  return <svg className={className} viewBox="0 0 1200 750" preserveAspectRatio="xMidYMid slice" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
    <defs>
      <linearGradient id={`${id}-sky`} x2="0" y2="1"><stop stopColor={night ? '#162629' : '#d7c4aa'} /><stop offset=".6" stopColor={night ? '#394543' : '#f1dbc0'} /><stop offset="1" stopColor={night ? '#635746' : '#eed3b0'} /></linearGradient>
      <linearGradient id={`${id}-stone`} x2=".9" y2="1"><stop stopColor={night ? '#aa8c57' : '#d5b486'} /><stop offset=".45" stopColor={night ? '#7e6545' : '#b58a59'} /><stop offset="1" stopColor={night ? '#433d34' : '#8c694c'} /></linearGradient>
      <linearGradient id={`${id}-path`} x2="0" y2="1"><stop stopColor="#c2ab85" /><stop offset="1" stopColor={night ? '#514838' : '#e7d8bd'} /></linearGradient>
      <radialGradient id={`${id}-glow`}><stop stopColor="#ffcf78" stopOpacity=".9" /><stop offset="1" stopColor="#ffc474" stopOpacity="0" /></radialGradient>
      <g id={`${id}-palm`}><path d="M0 0C-12-54 5-125-12-183" stroke="#5b6250" strokeWidth="10" fill="none" /><g fill={night ? '#263f37' : '#64775b'}><path d="M-12-183Q-91-237-133-163q57-45 121-20Z" /><path d="M-12-183q-68-70-97-41 37 4 97 41Z" /><path d="M-12-183q-16-97-47-89 13 34 47 89Z" /><path d="M-12-183q45-101 88-76-52 18-88 76Z" /><path d="M-12-183q81-64 132-4-68-29-132 4Z" /><path d="M-12-183q70-8 71 73-29-55-71-73Z" /><path d="M-12-183q-60 1-68 69 33-42 68-69Z" /></g></g>
      <g id={`${id}-lamp`}><path d="M-9 0h18l-5-5v-46h-8v46ZM-15-54h30l-5 6H-10ZM-8-77H8L5-71H-5Z" fill="#b9954e" /><path d="M0-55v-18" stroke="#b9954e" strokeWidth="3" /><ellipse cy="-79" rx="3" ry="8" fill="#ffe6a0" /><circle cy="-79" r="36" fill={`url(#${id}-glow)`} opacity={night ? '.8' : '.4'} /></g>
    </defs>
    <path fill={`url(#${id}-sky)`} d="M0 0h1200v750H0Z" />
    <circle cx="820" cy="204" r="103" fill={night ? '#f3e7c7' : '#fff0ce'} opacity={night ? '.65' : '.8'} />
    <circle cx="820" cy="204" r="210" fill={`url(#${id}-glow)`} opacity=".25" />
    {night && Array.from({ length: 42 }, (_, i) => <circle key={i} cx={(i * 137.51) % 1200} cy={(i * 71.31) % 360} r={i % 3 === 0 ? 1.4 : .7} fill="#f8e9c6" opacity=".65" />)}
    <path d="M0 403Q190 331 357 391t285-10 280-12 278 24v200H0Z" fill={night ? '#30433b' : '#8f9980'} opacity=".5" />
    <path d="M0 480q177-75 299-13t261-9 250-3 390-17v312H0Z" fill={night ? '#24382f' : '#78896b'} />
    <path d="M0 547H1200V750H0Z" fill={night ? '#354134' : '#b4b093'} />
    <path d="m533 516 134 0 340 234H166Z" fill={`url(#${id}-path)`} />
    <path d="M498 566h211M431 612h344M350 670h510M263 732h692M560 545l-62 205M641 545l61 205" stroke="#a49477" opacity=".45" />
    <path d="M120 573h280l-83 92H52Z" fill={night ? '#233c39' : '#8aa49a'} /><path d="m804 573 261 0 95 92H879Z" fill={night ? '#233c39' : '#8aa49a'} />
    <g fill={`url(#${id}-stone)`} stroke={night ? '#c19b5c' : '#99714e'} strokeWidth="1.2">
      <path d="M300 409h600v130H300Z" /><path d="M283 405h634v15H283Z" /><path d="M290 529h620v14H290Z" />
      {[320, 365, 410, 455, 722, 767, 812, 857].map(x => <g key={x}><path d={`M${x} 426h23v101h-23Z`} /><path d={`M${x - 3} 430h29v6h-29ZM${x - 3} 516h29v7h-29Z`} /></g>)}
      <path d="M500 338h200v200H500Z" /><path d="M543 538v-85q57-58 114 0v85" fill={night ? '#2e2823' : '#594739'} /><path d="M554 538v-80q46-43 92 0v80" fill={night ? '#d09046' : '#302e27'} />
      {Array.from({ length: 7 }, (_, i) => {
        const w = 218 - i * 23, x = 600 - w / 2, y = 335 - i * 33
        return <g key={i}><path d={`M${x} ${y}h${w}l-7-26H${x + 7}Z`} /><path d={`M${x - 9} ${y}h${w + 18}l-6 8H${x - 3}Z`} /><path d={`M${x + 5} ${y - 28}h${w - 10}v5H${x + 5}Z`} />{Array.from({ length: Math.max(3, 9 - i) }, (_, n) => <g key={n} transform={`translate(${x + 16 + n * ((w - 32) / Math.max(2, 8 - i))} ${y - 14})`}><path d="M-5 7V-3Q0-12 5-3v10Z" fill="#81694b" /><circle cy="-2" r="2" fill="#dec59a" /></g>)}</g>
      })}
      <path d="M560 104q40-50 80 0v7h-80Z" /><path d="M558 110h84v6h-84Z" />
      {[565, 583, 600, 617, 635].map(x => <g key={x}><path d={`M${x} 95v-18`} /><circle cx={x} cy="76" r="4" fill="#ceaa5f" /></g>)}
      <path d="M484 539h232v9H484ZM472 548h256v9H472ZM460 557h280v9H460Z" />
    </g>
    <path d="M513 428q88 53 175 0" fill="none" stroke="#c6874b" strokeWidth="9" /><path d="M513 425q88 53 175 0" fill="none" stroke="#efe0b9" strokeWidth="4" strokeDasharray="3 4" />
    <g><use href={`#${id}-palm`} transform="translate(225 522) scale(1.05)" /><use href={`#${id}-palm`} transform="translate(991 524) scale(-1.08 1.08)" /><use href={`#${id}-palm`} transform="translate(87 551) scale(1.65)" /><use href={`#${id}-palm`} transform="translate(1128 568) scale(-1.7 1.7)" /></g>
    {[0, 1, 2, 3].map(i => <g key={i}><use href={`#${id}-lamp`} transform={`translate(${487 - i * 80} ${568 + i * 55}) scale(${.6 + i * .23})`} /><use href={`#${id}-lamp`} transform={`translate(${716 + i * 80} ${568 + i * 55}) scale(${.6 + i * .23})`} /></g>)}
    <path d="M0 708q167-17 321 42H0ZM1200 693q-187 3-303 57h303Z" fill={night ? '#20352e' : '#536e54'} />
  </svg>
}
