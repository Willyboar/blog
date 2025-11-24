(() => {
  const updateBuildInfo = () => {
    const el = document.querySelector('[data-build-info]')
    if (!el) return
    const time = new Date().toLocaleString()
    el.textContent = `Built at ${time}`
  }

  const findGleamBlocks = () => {
    const nodes = document.querySelectorAll('pre code')
    const hasGleamToken = (value = '') => /gleam/i.test(value)

    return [...nodes].filter((block) => {
      const classAttr = block.getAttribute('class') || ''
      const parentData = block.parentElement?.dataset.lang || ''
      const hints = [classAttr, block.dataset.lang || '', parentData].join(' ')

      if (hasGleamToken(hints)) {
        if (![...block.classList].some((cls) => cls.startsWith('language-'))) {
          block.classList.add('language-gleam')
        }
        return true
      }

      return false
    })
  }

  const highlightGleamBlocks = () => {
    if (typeof window === 'undefined') return

    const apply = () => {
      if (!window.hljs) return false
      findGleamBlocks().forEach((block) => {
        if (block.dataset.highlighted === 'gleam') return
        window.hljs.highlightElement(block)
        block.dataset.highlighted = 'gleam'
      })
      return true
    }

    if (apply()) return

    let retries = 200
    const waitForHighlightJs = () => {
      if (apply()) return
      retries -= 1
      if (retries <= 0) return
      window.setTimeout(waitForHighlightJs, 50)
    }

    if (document.readyState === 'complete') {
      waitForHighlightJs()
    } else {
      window.addEventListener(
        'load',
        () => {
          waitForHighlightJs()
        },
        { once: true }
      )
    }
  }

  const init = () => {
    updateBuildInfo()
    highlightGleamBlocks()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true })
  } else {
    init()
  }
})()
