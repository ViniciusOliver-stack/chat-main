import { useState } from "react"
import { Icon } from "@iconify/react"

export function Accordion({ icon, title, children }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="mb-2 select-none ">
      <div
        className="flex justify-between items-center cursor-pointer px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 gap-2 hover:text-blue-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          <span className="mr-2">{icon}</span>
          <span>{title}</span>
        </div>
        <button className="text-neutral-900 text-base transition-all">
          {isOpen ? (
            <Icon icon="lucide:chevron-up" />
          ) : (
            <Icon icon="lucide:chevron-down" />
          )}
        </button>
      </div>
      {isOpen && <div className="pl-4">{children}</div>}
    </div>
  )
}
