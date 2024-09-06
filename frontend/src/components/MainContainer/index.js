import React from "react"

const MainContainer = ({ children }) => {
  return (
    <div className="flex-1 h-[calc(100%_-_60px)] w-full">
      <div className="h-full overflow-y-hidden flex flex-col">{children}</div>
    </div>
  )
}

export default MainContainer
