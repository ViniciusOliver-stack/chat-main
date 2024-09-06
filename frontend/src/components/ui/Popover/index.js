import { useEffect, useRef } from "react"

export function PopoverComponent({
  isOpen,
  anchorEl,
  onClose,
  content,
  className = "",
}) {
  const popoverRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const anchorRect = anchorEl.current?.getBoundingClientRect()
  const popoverWidth = 300 // Largura fixa do popover
  const popoverHeight = 400 // Altura máxima do popover

  // Verifique o espaço disponível ao redor do botão âncora
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const availableSpaceRight =
    viewportWidth - (anchorRect?.left + anchorRect?.width)
  const availableSpaceLeft = anchorRect?.left
  const availableSpaceBottom = viewportHeight - anchorRect?.bottom
  const topOffset = anchorRect?.bottom

  const adjustedLeft = Math.max(
    0,
    Math.min(
      anchorRect?.left + anchorRect?.width / 2 - popoverWidth / 2,
      availableSpaceRight < popoverWidth
        ? anchorRect?.left - popoverWidth + anchorRect?.width
        : anchorRect?.left + anchorRect?.width / 2 - popoverWidth / 2
    )
  )

  const adjustedTop =
    topOffset +
    Math.min(availableSpaceBottom < popoverHeight ? -popoverHeight : 0, 0)

  return (
    <div
      ref={popoverRef}
      className={`absolute z-10 bg-white border border-gray-100 shadow-lg rounded-md mt-3.5 ${className}`}
      style={{
        top: adjustedTop,
        left: adjustedLeft,
        width: `${Math.min(popoverWidth, viewportWidth - 32)}px`, // Ajusta a largura para não ultrapassar a tela
        maxHeight: `${Math.min(popoverHeight, availableSpaceBottom)}px`, // Ajusta a altura máxima para não ultrapassar a tela
      }}
    >
      <div className="p-4 max-h-80 overflow-y-auto">{content}</div>
    </div>
  )
}
