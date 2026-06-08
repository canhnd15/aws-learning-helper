import { useRef, useLayoutEffect } from 'react'

// A textarea that auto-grows to fit its content (including wrapped long lines),
// so pasted text is fully visible without manually adding line breaks.
export default function AutoTextarea({ value, ...props }) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  return <textarea ref={ref} value={value} rows={1} {...props} />
}
