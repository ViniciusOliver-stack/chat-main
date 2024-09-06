import React, { useEffect, useReducer, useState, useContext } from "react"
import { makeStyles } from "@material-ui/core/styles"
import toastError from "../../errors/toastError"
import Popover from "@material-ui/core/Popover"
import AnnouncementIcon from "@material-ui/icons/Announcement"
import {
  Avatar,
  Badge,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Dialog,
  Paper,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  DialogContentText,
} from "@material-ui/core"
import api from "../../services/api"
import { isArray } from "lodash"
import moment from "moment"
import { SocketContext } from "../../context/Socket/SocketContext"
import { getBackendURL } from "../../services/config"
import { Icon } from "@iconify/react/dist/iconify.js"

const useStyles = makeStyles((theme) => ({
  contend: { minWidth: 300, maxWidth: 500 },
  mainPaper: {
    flex: 1,
    maxHeight: 300,
    maxWidth: 500,
    padding: theme.spacing(1),
    overflowY: "scroll",
    ...theme.scrollbarStyles,
  },
}))

function AnnouncementDialog({ announcement, open, handleClose }) {
  const classes = useStyles()
  const [isImageModalOpen, setImageModalOpen] = useState(false)

  if (!open) return null

  const getMediaPath = (filename) => {
    return `${getBackendURL()}/public/${filename}`
  }
  return (
    <>
      {/* Main Modal */}
      <div
        className={`fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50 ${
          open ? "block" : "hidden"
        }`}
        role="dialog"
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <div className="bg-white rounded-lg shadow-lg max-w-lg w-full mx-4 sm:mx-0 max-h-[96vh] flex flex-col">
          <header className="border-b border-gray-300 p-4">
            <h2
              id="alert-dialog-title"
              className="text-xl font-semibold text-red-500"
            >
              {announcement.title}
            </h2>
          </header>
          <div className="flex-1 p-4 overflow-y-auto">
            {announcement.mediaPath && (
              <div
                className="border border-gray-200 mx-auto mb-5 text-center w-full h-72 bg-cover bg-center cursor-pointer relative"
                style={{
                  backgroundImage: `url(${getMediaPath(
                    announcement.mediaPath
                  )})`,
                }}
                onClick={() => setImageModalOpen(true)}
              >
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center text-white text-xl font-bold opacity-0 hover:opacity-100 transition-opacity">
                  Click to Zoom
                </div>
              </div>
            )}
            <p id="alert-dialog-description" className="text-gray-700">
              {announcement.text}
            </p>
          </div>
          <footer className="border-t border-gray-300 p-4 flex justify-end">
            <button
              onClick={() => handleClose()}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Fechar
            </button>
          </footer>
        </div>
      </div>

      {/* Image Modal */}
      {isImageModalOpen && (
        <div
          className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50"
          role="dialog"
          aria-labelledby="image-dialog-title"
          aria-describedby="image-dialog-description"
          onClick={() => setImageModalOpen(false)}
        >
          <div className="relative bg-white p-4">
            <img
              src={getMediaPath(announcement.mediaPath)}
              alt={announcement.title}
              className="max-w-screen-sm max-h-screen"
            />
          </div>
        </div>
      )}
    </>
  )
}

const reducer = (state, action) => {
  if (action.type === "LOAD_ANNOUNCEMENTS") {
    const announcements = action.payload
    const newAnnouncements = []

    if (isArray(announcements)) {
      announcements.forEach((announcement) => {
        const announcementIndex = state.findIndex(
          (u) => u.id === announcement.id
        )
        if (announcementIndex !== -1) {
          state[announcementIndex] = announcement
        } else {
          newAnnouncements.push(announcement)
        }
      })
    }

    return [...state, ...newAnnouncements]
  }

  if (action.type === "UPDATE_ANNOUNCEMENTS") {
    const announcement = action.payload
    const announcementIndex = state.findIndex((u) => u.id === announcement.id)

    if (announcementIndex !== -1) {
      state[announcementIndex] = announcement
      return [...state]
    } else {
      return [announcement, ...state]
    }
  }

  if (action.type === "DELETE_ANNOUNCEMENT") {
    const announcementId = action.payload

    const announcementIndex = state.findIndex((u) => u.id === announcementId)
    if (announcementIndex !== -1) {
      state.splice(announcementIndex, 1)
    }
    return [...state]
  }

  if (action.type === "RESET") {
    return []
  }
}

export default function AnnouncementsPopover() {
  const classes = useStyles()

  const [loading, setLoading] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [searchParam] = useState("")
  const [announcements, dispatch] = useReducer(reducer, [])
  const [invisible, setInvisible] = useState(false)
  const [announcement, setAnnouncement] = useState({})
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false)

  const socketManager = useContext(SocketContext)

  useEffect(() => {
    dispatch({ type: "RESET" })
    setPageNumber(1)
  }, [searchParam])

  useEffect(() => {
    setLoading(true)
    const delayDebounceFn = setTimeout(() => {
      fetchAnnouncements()
    }, 500)
    return () => clearTimeout(delayDebounceFn)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParam, pageNumber])

  useEffect(() => {
    const companyId = localStorage.getItem("companyId")
    const socket = socketManager.GetSocket(companyId)

    const onCompanyAnnouncement = (data) => {
      if (data.action === "update" || data.action === "create") {
        dispatch({ type: "UPDATE_ANNOUNCEMENTS", payload: data.record })
        setInvisible(false)
      }
      if (data.action === "delete") {
        dispatch({ type: "DELETE_ANNOUNCEMENT", payload: +data.id })
      }
    }

    socket.on(`company-announcement`, onCompanyAnnouncement)

    return () => {
      socket.disconnect()
    }
  }, [socketManager])

  const fetchAnnouncements = async () => {
    try {
      const { data } = await api.get("/announcements/", {
        params: { searchParam, pageNumber },
      })
      dispatch({ type: "LOAD_ANNOUNCEMENTS", payload: data.records })
      setHasMore(data.hasMore)
      setLoading(false)
    } catch (err) {
      toastError(err)
    }
  }

  const loadMore = () => {
    setPageNumber((prevState) => prevState + 1)
  }

  const handleScroll = (e) => {
    if (!hasMore || loading) return
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (scrollHeight - (scrollTop + 100) < clientHeight) {
      loadMore()
    }
  }

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget)
    setInvisible(true)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const borderPriority = (priority) => {
    if (priority === 1) {
      return "4px solid #b81111"
    }
    if (priority === 2) {
      return "4px solid orange"
    }
    if (priority === 3) {
      return "4px solid grey"
    }
  }

  const getMediaPath = (filename) => {
    return `${getBackendURL()}/public/${filename}`
  }

  const handleShowAnnouncementDialog = (record) => {
    setAnnouncement(record)
    setShowAnnouncementDialog(true)
    setAnchorEl(null)
  }

  const open = Boolean(anchorEl)
  const id = open ? "simple-popover" : undefined

  return (
    <div>
      <AnnouncementDialog
        announcement={announcement}
        open={showAnnouncementDialog}
        handleClose={() => setShowAnnouncementDialog(false)}
      />
      <button
        type="button"
        aria-describedby={id}
        onClick={handleClick}
        className="relative"
      >
        <Icon
          icon="mingcute:notification-line"
          fontSize={26}
          className="text-neutral-900 dark:text-white"
        />

        {announcements.length > 1 && (
          <span class="absolute -top-1 -right-1 flex h-3 w-3 ">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
          </span>
        )}
        {/* <Badge
          color="secondary"
          variant="dot"
          invisible={invisible || announcements.length < 1}
        >
          <AnnouncementIcon style={{ color: "white" }} />
        </Badge> */}
      </button>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        <Paper
          variant="outlined"
          onScroll={handleScroll}
          className={classes.mainPaper}
        >
          <List
            component="nav"
            aria-label="main mailbox folders"
            style={{ minWidth: 300 }}
          >
            {isArray(announcements) &&
              announcements.map((item, key) => (
                <ListItem
                  key={key}
                  style={{
                    // background: key % 2 === 0 ? "#ededed" : "white",
                    border: "1px solid #eee",
                    borderLeft: borderPriority(item.priority),
                    cursor: "pointer",
                  }}
                  onClick={() => handleShowAnnouncementDialog(item)}
                >
                  {console.log(item.mediaPath)}
                  {item.mediaPath && (
                    <ListItemAvatar>
                      <Avatar
                        alt={item.mediaName}
                        src={getMediaPath(item.mediaPath)}
                      />
                    </ListItemAvatar>
                  )}
                  <ListItemText
                    primary={item.title}
                    secondary={
                      <>
                        <Typography component="span" style={{ fontSize: 12 }}>
                          {moment(item.createdAt).format("DD/MM/YYYY")}
                        </Typography>
                        <span style={{ marginTop: 5, display: "block" }}></span>
                        <Typography component="span" variant="body2">
                          {item.text}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            {isArray(announcements) && announcements.length === 0 && (
              <ListItemText primary="Nenhum registro" />
            )}
          </List>
        </Paper>
      </Popover>
    </div>
  )
}
