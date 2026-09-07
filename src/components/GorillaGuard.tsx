import { useEffect, useRef, useState } from 'react'

interface GorillaGuardProps {
  /** current value typed into the password field */
  value: string
  /** whether the password is currently shown in plain text */
  visible: boolean
  /** whether the field is focused (gorilla only "watches" while user is in the field) */
  focused: boolean
}

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))

/**
 * A friendly gorilla mascot that sits above the password field:
 * - While hidden, its eyes are fully closed AND its hands cover them —
 *   two independent layers, so the eyes are never visible while masked.
 * - While shown, its eyes open and the pupils track each character as it's
 *   typed, sweeping left-to-right like it's reading the password letter by
 *   letter (with a small per-character glance so it doesn't feel mechanical).
 */
export default function GorillaGuard({ value, visible, focused }: GorillaGuardProps) {
  const [gaze, setGaze] = useState({ x: 0, y: 0 })
  const lastLenRef = useRef(0)

  useEffect(() => {
    const len = value.length
    if (len === lastLenRef.current) return
    lastLenRef.current = len

    if (len === 0) {
      setGaze({ x: 0, y: 0 })
      return
    }

    const lastChar = value[len - 1]
    const code = lastChar.charCodeAt(0)

    // Primary motion: sweep left -> right as the password grows, like reading
    // along a line, wrapping back to the start every 12 characters.
    const sweep = ((len - 1) % 12) - 6 // -6 .. 5

    // Secondary motion: each character nudges the gaze a little differently
    // based on which key it is, so it reads as "looking at that letter"
    // rather than a fixed metronome swing.
    const jitter = (code % 5) - 2 // -2 .. 2

    const x = clamp(sweep + jitter * 0.6, -7, 7)
    const y = clamp(2 + (code % 3) - 1, 0, 3) // small downward glance toward the field

    setGaze({ x, y })
  }, [value])

  const covering = !visible
  const gazeX = focused ? gaze.x : 0
  const gazeY = focused ? gaze.y : 0

  return (
    <div className="flex justify-center select-none" aria-hidden="true">
      <svg width="128" height="118" viewBox="0 0 128 118" className="drop-shadow-[0_8px_24px_rgba(124,106,239,0.25)]">
        {/* ears */}
        <circle cx="20" cy="46" r="14" fill="#3B2E27" />
        <circle cx="108" cy="46" r="14" fill="#3B2E27" />
        <circle cx="20" cy="46" r="7" fill="#5A4438" />
        <circle cx="108" cy="46" r="7" fill="#5A4438" />

        {/* head */}
        <ellipse cx="64" cy="58" rx="46" ry="42" fill="#4A382E" />
        {/* face plate */}
        <ellipse cx="64" cy="66" rx="32" ry="28" fill="#C9A47E" />

        {/* brow ridge */}
        <path
          d={covering ? 'M34 52 Q64 42 94 52' : 'M34 50 Q64 34 94 50'}
          stroke="#3B2E27"
          strokeWidth="7"
          fill="none"
          strokeLinecap="round"
          style={{ transition: 'd 250ms ease' }}
        />

        {/* EYES: two mutually-exclusive layers so open/closed is unambiguous */}
        {covering ? (
          // Closed: simple downward eyelid arcs, no whites/pupils rendered at all
          <g>
            <path d="M40 59 Q49 65 58 59" stroke="#2A2018" strokeWidth="3.4" fill="none" strokeLinecap="round" />
            <path d="M70 59 Q79 65 88 59" stroke="#2A2018" strokeWidth="3.4" fill="none" strokeLinecap="round" />
          </g>
        ) : (
          <g>
            <ellipse cx="49" cy="58" rx="11" ry="9" fill="#F4EFE6" />
            <ellipse cx="79" cy="58" rx="11" ry="9" fill="#F4EFE6" />
            <g style={{ transition: 'transform 180ms cubic-bezier(0.34,1.56,0.64,1)' }} transform={`translate(${gazeX}, ${gazeY})`}>
              <circle cx="49" cy="58" r="4.4" fill="#1C1A22" />
              <circle cx="79" cy="58" r="4.4" fill="#1C1A22" />
              <circle cx="50.3" cy="56.5" r="1.1" fill="#fff" />
              <circle cx="80.3" cy="56.5" r="1.1" fill="#fff" />
            </g>
          </g>
        )}

        {/* nose */}
        <ellipse cx="49" cy="76" rx="5.5" ry="4" fill="#7A5C46" />
        <ellipse cx="79" cy="76" rx="5.5" ry="4" fill="#7A5C46" />

        {/* mouth */}
        <path
          d={covering ? 'M54 88 Q64 92 74 88' : 'M54 86 Q64 96 74 86'}
          stroke="#3B2E27"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          style={{ transition: 'd 200ms ease' }}
        />

        {/* HANDS — centered directly over each eye (cx 49 / 79, matching the
            eye centers above) so they fully obscure them when covering. */}
        <g
          style={{ transition: 'transform 320ms cubic-bezier(0.34,1.56,0.64,1)' }}
          transform={covering ? 'translate(0,0) rotate(0)' : 'translate(-6,-50) rotate(-18 49 58)'}
        >
          <ellipse cx="49" cy="60" rx="18" ry="15" fill="#4A382E" />
          <ellipse cx="38" cy="49" rx="3.4" ry="4.8" fill="#4A382E" />
          <ellipse cx="46" cy="45" rx="3.4" ry="4.8" fill="#4A382E" />
          <ellipse cx="54" cy="45" rx="3.4" ry="4.8" fill="#4A382E" />
          <ellipse cx="61" cy="48" rx="3.4" ry="4.8" fill="#4A382E" />
        </g>
        <g
          style={{ transition: 'transform 320ms cubic-bezier(0.34,1.56,0.64,1)' }}
          transform={covering ? 'translate(0,0) rotate(0)' : 'translate(6,-50) rotate(18 79 58)'}
        >
          <ellipse cx="79" cy="60" rx="18" ry="15" fill="#4A382E" />
          <ellipse cx="67" cy="48" rx="3.4" ry="4.8" fill="#4A382E" />
          <ellipse cx="74" cy="45" rx="3.4" ry="4.8" fill="#4A382E" />
          <ellipse cx="82" cy="45" rx="3.4" ry="4.8" fill="#4A382E" />
          <ellipse cx="90" cy="49" rx="3.4" ry="4.8" fill="#4A382E" />
        </g>
      </svg>
    </div>
  )
}
