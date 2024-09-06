import React, { useState, useEffect, useRef, useContext } from "react"

import { useHistory, useParams } from "react-router-dom"
import { parseISO, format, isSameDay } from "date-fns"
import clsx from "clsx"

import ListItemAvatar from "@material-ui/core/ListItemAvatar"
import Avatar from "@material-ui/core/Avatar"

import { i18n } from "../../translate/i18n"

import api from "../../services/api"
import MarkdownWrapper from "../MarkdownWrapper"
import { AuthContext } from "../../context/Auth/AuthContext"
import toastError from "../../errors/toastError"

const TicketListItem = ({ ticket }) => {
  const history = useHistory()
  const [loading, setLoading] = useState(false)
  const { ticketId } = useParams()
  const isMounted = useRef(true)
  const { user } = useContext(AuthContext)

  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  const handleAcceptTicket = async (ticket) => {
    setLoading(true)
    try {
      await api.put(`/tickets/${ticket.id}`, {
        status: "open",
        userId: user?.id,
      })
    } catch (err) {
      setLoading(false)
      toastError(err)
    }
    if (isMounted.current) {
      setLoading(false)
    }
    history.push(`/tickets/${ticket.uuid}`)
  }

  const handleSelectTicket = (ticket) => {
    history.push(`/tickets/${ticket.uuid}`)
  }

  return (
    <React.Fragment key={ticket.id}>
      <button
        type="button"
        onClick={(e) => {
          if (ticket.status === "pending") return
          handleSelectTicket(ticket)
        }}
        // selected={ticketId && +ticketId === ticket.id}
        className={clsx("flex w-full items-center px-3 py-2 cursor-pointer", {
          "border-b border-gray-100": ticket.status === "pending",
        })}
      >
        {/* <Tooltip
          arrow
          placement="right"
          title={ticket.queue?.name || "Sem fila"}
        >
          <span
            style={{ backgroundColor: ticket.queue?.color || "#7C7C7C" }}
            className={classes.ticketQueueColor}
          ></span>
        </Tooltip> */}
        <ListItemAvatar>
          <Avatar src={ticket?.contact?.profilePicUrl} />
        </ListItemAvatar>

        <div className="max-w-[215px] w-full">
          <div className="flex justify-between items-start">
            <span className="text-gray-800 text-sm font-medium truncate max-w-[calc(100%-3rem)]">
              {ticket.contact.name}
            </span>
            {ticket.status === "closed" && (
              <span className="inline-flex items-center justify-center w-6 h-6 bg-green-500 text-white text-xs font-semibold rounded-full">
                closed
              </span>
            )}
            {ticket.lastMessage && (
              <span className="text-gray-500 text-xs whitespace-nowrap">
                {isSameDay(parseISO(ticket.updatedAt), new Date())
                  ? format(parseISO(ticket.updatedAt), "HH:mm")
                  : format(parseISO(ticket.updatedAt), "dd/MM/yyyy")}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-start justify-between gap-2 pt-1.5">
              <span className="text-gray-500 text-xs truncate flex-1 text-start">
                {ticket.lastMessage ? (
                  <MarkdownWrapper>{ticket.lastMessage}</MarkdownWrapper>
                ) : (
                  <span>&nbsp;</span>
                )}
              </span>
              {ticket.unreadMessages > 0 && (
                <span className="relative inline-flex items-center justify-center w-5 h-5 bg-green-500 text-white text-xs font-semibold rounded-full">
                  {ticket.unreadMessages}
                </span>
              )}
            </div>
            {ticket.status === "pending" && (
              <button
                onClick={() => handleAcceptTicket(ticket)}
                className="w-fit bg-blue-500 text-white px-3 py-1 rounded-md"
              >
                {i18n.t("ticketsList.buttons.accept")}
              </button>
            )}
          </div>
        </div>
      </button>
    </React.Fragment>
  )
}

export default TicketListItem
