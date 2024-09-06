import React, { useState, useRef, useEffect, useContext } from "react"
import { useTheme } from "@material-ui/core/styles"

import { useHistory } from "react-router-dom"
import { format } from "date-fns"
import useSound from "use-sound"

import TicketListItem from "../TicketListItem"
import { i18n } from "../../translate/i18n"
import useTickets from "../../hooks/useTickets"
import alertSound from "../../assets/sound.mp3"
import { AuthContext } from "../../context/Auth/AuthContext"
import { SocketContext } from "../../context/Socket/SocketContext"
import Favicon from "react-favicon"
import { getBackendURL } from "../../services/config"
import { Icon } from "@iconify/react/dist/iconify.js"
import { PopoverComponent } from "../ui/Popover"

const defaultLogoFavicon = "/vector/favicon.svg"

const NotificationsPopOver = (props) => {
  const theme = useTheme()

  const history = useHistory()
  const { user } = useContext(AuthContext)
  const ticketIdUrl = +history.location.pathname.split("/")[2]
  const ticketIdRef = useRef(ticketIdUrl)
  const anchorEl = useRef()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const { profile, queues } = user

  const [, setDesktopNotifications] = useState([])

  const { tickets } = useTickets({ withUnreadMessages: "true" })
  const [play] = useSound(alertSound, { volume: props.volume })
  const soundAlertRef = useRef()

  const historyRef = useRef(history)

  const socketManager = useContext(SocketContext)

  useEffect(() => {
    soundAlertRef.current = play

    if (!("Notification" in window)) {
      console.log("This browser doesn't support notifications")
    } else {
      Notification.requestPermission()
    }
  }, [play])

  useEffect(() => {
    setNotifications(tickets)
  }, [tickets])

  useEffect(() => {
    ticketIdRef.current = ticketIdUrl
  }, [ticketIdUrl])

  useEffect(() => {
    const companyId = localStorage.getItem("companyId")
    const socket = socketManager.GetSocket(companyId)

    const queueIds = queues.map((q) => q.id)

    const onConnectNotificationsPopover = () => {
      socket.emit("joinNotification")
    }

    const onCompanyTicketNotificationsPopover = (data) => {
      if (data.action === "updateUnread" || data.action === "delete") {
        setNotifications((prevState) => {
          const ticketIndex = prevState.findIndex((t) => t.id === data.ticketId)
          if (ticketIndex !== -1) {
            prevState.splice(ticketIndex, 1)
            return [...prevState]
          }
          return prevState
        })

        setDesktopNotifications((prevState) => {
          const notfiticationIndex = prevState.findIndex(
            (n) => n.tag === String(data.ticketId)
          )
          if (notfiticationIndex !== -1) {
            prevState[notfiticationIndex].close()
            prevState.splice(notfiticationIndex, 1)
            return [...prevState]
          }
          return prevState
        })
      }
    }

    const onCompanyAppMessageNotificationsPopover = (data) => {
      if (
        data.action === "create" &&
        !data.message.read &&
        (data.ticket.userId === user?.id || !data.ticket.userId)
      ) {
        setNotifications((prevState) => {
          const ticketIndex = prevState.findIndex(
            (t) => t.id === data.ticket.id
          )
          if (ticketIndex !== -1) {
            prevState[ticketIndex] = data.ticket
            return [...prevState]
          }
          return [data.ticket, ...prevState]
        })

        const shouldNotNotificate =
          (data.message.ticketId === ticketIdRef.current &&
            document.visibilityState === "visible") ||
          (data.ticket.userId && data.ticket.userId !== user?.id) ||
          data.ticket.isGroup

        if (shouldNotNotificate) return

        handleNotifications(data)
      }
    }

    socketManager.onConnect(onConnectNotificationsPopover)
    socket.on(
      `company-${companyId}-ticket`,
      onCompanyTicketNotificationsPopover
    )
    socket.on(
      `company-${companyId}-appMessage`,
      onCompanyAppMessageNotificationsPopover
    )

    return () => {
      socket.disconnect()
    }
  }, [user, profile, queues, socketManager])

  const handleNotifications = (data) => {
    const { message, contact, ticket } = data

    const options = {
      body: `${message.body} - ${format(new Date(), "HH:mm")}`,
      icon: contact.profilePicUrl,
      tag: ticket.id,
      renotify: true,
    }

    try {
      const notification = new Notification(
        `${i18n.t("tickets.notification.message")} ${contact.name}`,
        options
      )

      notification.onclick = (e) => {
        e.preventDefault()
        window.focus()
        historyRef.current.push(`/tickets/${ticket.uuid}`)
      }

      setDesktopNotifications((prevState) => {
        const notfiticationIndex = prevState.findIndex(
          (n) => n.tag === notification.tag
        )
        if (notfiticationIndex !== -1) {
          prevState[notfiticationIndex] = notification
          return [...prevState]
        }
        return [notification, ...prevState]
      })
    } catch (e) {
      console.error("Failed to push browser notification")
    }

    soundAlertRef.current()
  }

  const handleClick = () => {
    setIsOpen((prevState) => !prevState)
  }

  const handleClickAway = () => {
    setIsOpen(false)
  }

  const NotificationTicket = ({ children }) => {
    return <div onClick={handleClickAway}>{children}</div>
  }

  const browserNotification = () => {
    const numbers = "⓿➊➋➌➍➎➏➐➑➒➓⓫⓬⓭⓮⓯⓰⓱⓲⓳⓴"
    if (notifications.length > 0) {
      if (notifications.length < 21) {
        document.title =
          numbers.substring(notifications.length, notifications.length + 1) +
          " - " +
          (theme.appName || "...")
      } else {
        document.title =
          "(" + notifications.length + ")" + (theme.appName || "...")
      }
    } else {
      document.title = theme.appName || "..."
    }
    return (
      <>
        <Favicon
          animated={true}
          url={
            theme?.appLogoFavicon ? theme.appLogoFavicon : defaultLogoFavicon
          }
          alertCount={notifications.length}
          iconSize={195}
        />
      </>
    )
  }

  return (
    <>
      {browserNotification()}
      <button
        type="button"
        onClick={handleClick}
        ref={anchorEl}
        aria-label="Mostrar Notificações"
        className="relative"
      >
        <Icon
          icon="mdi:message-outline"
          fontSize={26}
          className="text-neutral-900 dark:text-white"
        />
        {notifications.length > 0 ? (
          <span class="absolute -top-1 -right-1 flex h-3 w-3 ">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
          </span>
        ) : (
          // <Badge
          //   variant="dot"
          //   color="secondary"
          //   style={{ marginTop: "-25px" }}
          // ></Badge>
          ""
        )}
      </button>
      <PopoverComponent
        isOpen={isOpen}
        anchorEl={anchorEl}
        onClose={handleClickAway}
        content={
          notifications.length === 0 ? (
            <div className="text-neutral-900">
              {i18n.t("notifications.noTickets")}
            </div>
          ) : (
            notifications.map((ticket) => (
              <NotificationTicket key={ticket.id}>
                {/* POG - Quando tem console funciona, verificar por que */}
                {console.log("")}
                <TicketListItem ticket={ticket} />
              </NotificationTicket>
            ))
          )
        }
      />
    </>
  )
}

export default NotificationsPopOver
