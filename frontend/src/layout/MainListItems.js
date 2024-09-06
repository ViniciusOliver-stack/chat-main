import React, { useContext, useEffect, useReducer, useState } from "react"
import { Link as RouterLink, useHistory } from "react-router-dom"

import ListItem from "@material-ui/core/ListItem"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import ListItemText from "@material-ui/core/ListItemText"
import ListSubheader from "@material-ui/core/ListSubheader"
import Divider from "@material-ui/core/Divider"
import { Badge, Collapse, List } from "@material-ui/core"
import DashboardOutlinedIcon from "@material-ui/icons/DashboardOutlined"
import WhatsAppIcon from "@material-ui/icons/WhatsApp"
import SyncAltIcon from "@material-ui/icons/SyncAlt"
import SettingsOutlinedIcon from "@material-ui/icons/SettingsOutlined"
import PeopleAltOutlinedIcon from "@material-ui/icons/PeopleAltOutlined"
import ContactPhoneOutlinedIcon from "@material-ui/icons/ContactPhoneOutlined"
import AccountTreeOutlinedIcon from "@material-ui/icons/AccountTreeOutlined"
import FlashOnIcon from "@material-ui/icons/FlashOn"
import CalendarToday from "@material-ui/icons/CalendarToday"
import HelpOutlineIcon from "@material-ui/icons/HelpOutline"
import CodeRoundedIcon from "@material-ui/icons/CodeRounded"
import EventIcon from "@material-ui/icons/Event"
import InfoIcon from "@material-ui/icons/Info"
import DarkMode from "../components/DarkMode"

import LocalOfferIcon from "@material-ui/icons/LocalOffer"
import EventAvailableIcon from "@material-ui/icons/EventAvailable"
import ExpandLessIcon from "@material-ui/icons/ExpandLess"
import ExpandMoreIcon from "@material-ui/icons/ExpandMore"
import PeopleIcon from "@material-ui/icons/People"
import ListIcon from "@material-ui/icons/ListAlt"
import LoyaltyRoundedIcon from "@material-ui/icons/LoyaltyRounded"
import AnnouncementIcon from "@material-ui/icons/Announcement"
import ForumIcon from "@material-ui/icons/Forum"
import LocalAtmIcon from "@material-ui/icons/LocalAtm"
import RotateRight from "@material-ui/icons/RotateRight"
import { i18n } from "../translate/i18n"
import BorderColorIcon from "@material-ui/icons/BorderColor"
import { WhatsAppsContext } from "../context/WhatsApp/WhatsAppsContext"
import { AuthContext } from "../context/Auth/AuthContext"
import { Can } from "../components/Can"
import { SocketContext } from "../context/Socket/SocketContext"
import { isArray } from "lodash"
import api from "../services/api"
import toastError from "../errors/toastError"
import { makeStyles } from "@material-ui/core/styles"
import Typography from "@material-ui/core/Typography"
import { loadJSON } from "../helpers/loadJSON"

// Import Symplus
import { Icon } from "@iconify/react/dist/iconify.js"
import { useDate } from "../hooks/useDate"
import { Accordion } from "../components/ui/Accordion"

// const gitinfo = loadJSON("/gitinfo.json")

// console.log(gitinfo)

const useStyles = makeStyles((theme) => ({
  ListSubheader: {
    height: 26,
    marginTop: "-15px",
    marginBottom: "-10px",
  },
}))

function ListItemLink({ icon, primary, to, className }) {
  const renderLink = React.useMemo(
    () =>
      React.forwardRef((itemProps, ref) => (
        <RouterLink to={to} ref={ref} {...itemProps} />
      )),
    [to]
  )

  return (
    <li className={className}>
      <RouterLink
        to={to}
        className="flex justify-between items-center cursor-pointer px-4 py-2  text-gray-700 gap-2 hover:text-blue-500 dark:text-white dark:hover:text-blue-500"
      >
        {icon && <div className="flex-shrink-0">{icon}</div>}
        <span className="flex-grow">{primary}</span>
      </RouterLink>
    </li>
  )
}

const reducer = (state, action) => {
  if (action.type === "LOAD_CHATS") {
    const chats = action.payload
    const newChats = []

    if (isArray(chats)) {
      chats.forEach((chat) => {
        const chatIndex = state.findIndex((u) => u.id === chat.id)
        if (chatIndex !== -1) {
          state[chatIndex] = chat
        } else {
          newChats.push(chat)
        }
      })
    }

    return [...state, ...newChats]
  }

  if (action.type === "UPDATE_CHATS") {
    const chat = action.payload
    const chatIndex = state.findIndex((u) => u.id === chat.id)

    if (chatIndex !== -1) {
      state[chatIndex] = chat
      return [...state]
    } else {
      return [chat, ...state]
    }
  }

  if (action.type === "DELETE_CHAT") {
    const chatId = action.payload

    const chatIndex = state.findIndex((u) => u.id === chatId)
    if (chatIndex !== -1) {
      state.splice(chatIndex, 1)
    }
    return [...state]
  }

  if (action.type === "RESET") {
    return []
  }

  if (action.type === "CHANGE_CHAT") {
    const changedChats = state.map((chat) => {
      if (chat.id === action.payload.chat.id) {
        return action.payload.chat
      }
      return chat
    })
    return changedChats
  }
}

const MainListItems = (props) => {
  const { dateToClient } = useDate()

  const classes = useStyles()
  const { drawerClose, drawerOpen } = props
  const { whatsApps } = useContext(WhatsAppsContext)
  const { user, handleLogout } = useContext(AuthContext)
  const [connectionWarning, setConnectionWarning] = useState(false)
  const [openCampaignSubmenu, setOpenCampaignSubmenu] = useState(false)
  const [openKanbanSubmenu, setOpenKanbanSubmenu] = useState(false)

  const [showCampaigns, setShowCampaigns] = useState(false)
  const history = useHistory()
  const [invisible, setInvisible] = useState(true)
  const [pageNumber, setPageNumber] = useState(1)
  const [searchParam] = useState("")
  const [chats, dispatch] = useReducer(reducer, [])
  const [version, setVersion] = useState("v N/A")

  const socketManager = useContext(SocketContext)

  useEffect(() => {
    dispatch({ type: "RESET" })
    setPageNumber(1)
  }, [searchParam])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchChats()
    }, 500)
    return () => clearTimeout(delayDebounceFn)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParam, pageNumber])

  useEffect(() => {
    const companyId = localStorage.getItem("companyId")
    const socket = socketManager.GetSocket(companyId)

    const onCompanyChatMainListItems = (data) => {
      if (data.action === "new-message") {
        dispatch({ type: "CHANGE_CHAT", payload: data })
      }
      if (data.action === "update") {
        dispatch({ type: "CHANGE_CHAT", payload: data })
      }
    }

    socket.on(`company-${companyId}-chat`, onCompanyChatMainListItems)
    return () => {
      socket.disconnect()
    }
  }, [socketManager])

  useEffect(() => {
    let unreadsCount = 0
    if (chats.length > 0) {
      for (let chat of chats) {
        for (let chatUser of chat.users) {
          if (chatUser.userId === user.id) {
            unreadsCount += chatUser.unreads
          }
        }
      }
    }
    if (unreadsCount > 0) {
      setInvisible(false)
    } else {
      setInvisible(true)
    }
  }, [chats, user.id])

  useEffect(() => {
    if (localStorage.getItem("cshow")) {
      setShowCampaigns(true)
    }
  }, [])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (whatsApps.length > 0) {
        const offlineWhats = whatsApps.filter((whats) => {
          return (
            whats.status === "qrcode" ||
            whats.status === "PAIRING" ||
            whats.status === "DISCONNECTED" ||
            whats.status === "TIMEOUT" ||
            whats.status === "OPENING"
          )
        })
        if (offlineWhats.length > 0) {
          setConnectionWarning(true)
        } else {
          setConnectionWarning(false)
        }
      }
    }, 2000)
    return () => clearTimeout(delayDebounceFn)
  }, [whatsApps])

  const fetchChats = async () => {
    try {
      const { data } = await api.get("/chats/", {
        params: { searchParam, pageNumber },
      })
      dispatch({ type: "LOAD_CHATS", payload: data.records })
    } catch (err) {
      toastError(err)
    }
  }

  const handleClickLogout = () => {
    //handleCloseMenu();
    handleLogout()
  }

  return (
    <div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <ul className="flex flex-col gap-2.5">
          <ListItemLink
            small
            to="/"
            primary={drawerOpen && "Dashboard"}
            icon={<Icon icon="mage:dashboard" fontSize={20} />}
          />

          {/* Atendimento */}
          <AccordionMenu
            title={drawerOpen && "Atendimento"}
            icon={<Icon icon="mingcute:chat-4-line" fontSize={20} />}
          >
            {/* Chat */}
            <ListItemLink
              to="/tickets"
              primary={drawerOpen && i18n.t("mainDrawer.listItems.tickets")}
              icon={<Icon icon="ph:chat-teardrop-dots" fontSize={20} />}
            />

            {/* Tags */}
            <ListItemLink
              to="/tags"
              primary={drawerOpen && i18n.t("mainDrawer.listItems.tags")}
              icon={<Icon icon="mingcute:tag-chevron-line" fontSize={20} />}
            />

            {/* Chat Interno */}
            <ListItemLink
              to="/chats"
              primary={drawerOpen && i18n.t("mainDrawer.listItems.chats")}
              icon={<Icon icon="ph:chat-circle" fontSize={20} />}
            />

            {/* Tarefas */}
            <ListItemLink
              to="/todolist"
              primary={drawerOpen && i18n.t("Tarefas")}
              icon={<Icon icon="gg:google-tasks" fontSize={20} />}
            />

            {/* Contatos */}
            <ListItemLink
              to="/contacts"
              primary={drawerOpen && i18n.t("mainDrawer.listItems.contacts")}
              icon={<Icon icon="mingcute:contacts-line" fontSize={20} />}
            />
          </AccordionMenu>

          <AccordionMenu
            title={drawerOpen && "Automações"}
            icon={
              <Icon icon="fluent:branch-compare-16-regular" fontSize={20} />
            }
          >
            <ListItemLink
              to="/quick-messages"
              primary={
                drawerOpen && i18n.t("mainDrawer.listItems.quickMessages")
              }
              icon={<Icon icon="iconamoon:lightning-1" fontSize={20} />}
            />

            <ListItemLink
              to="/queues"
              primary={drawerOpen && i18n.t("mainDrawer.listItems.queues")}
              icon={<Icon icon="lucide:bot-message-square" fontSize={20} />}
            />
          </AccordionMenu>

          {showCampaigns && (
            <>
              <AccordionMenu
                title={drawerOpen && "Campanhas"}
                icon={<Icon icon="ic:outline-campaign" fontSize={20} />}
              >
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    className="flex items-center gap-2 space-x-2 p-2 hover:bg-gray-200 rounded-md hover:text-blue-500"
                    onClick={() => history.push("/campaigns")}
                  >
                    <Icon icon="quill:list" fontSize={20} />
                    {drawerOpen && "Listar Campanhas"}
                  </button>

                  <button
                    type="button"
                    className="flex items-center gap-2 space-x-2 p-2 hover:bg-gray-200 rounded-md hover:text-blue-500"
                    onClick={() => history.push("/contact-lists")}
                  >
                    <Icon icon="icon-park-outline:peoples" fontSize={20} />
                    {drawerOpen && "Listas de Contatos"}
                  </button>

                  <button
                    type="button"
                    className="flex items-center gap-2 space-x-2 p-2 hover:bg-gray-200 rounded-md hover:text-blue-500"
                    onClick={() => history.push("/campaigns-config")}
                  >
                    <Icon icon="solar:settings-bold" fontSize={20} />
                    {drawerOpen && "Configurações"}
                  </button>
                </div>
              </AccordionMenu>
            </>
          )}

          <AccordionMenu
            title={drawerOpen && "Configurações"}
            icon={<Icon icon="solar:settings-linear" fontSize={20} />}
          >
            <ListItemLink
              to="/connections"
              primary={drawerOpen && i18n.t("mainDrawer.listItems.connections")}
              icon={<Icon icon="mingcute:qrcode-line" fontSize={20} />}
            />

            <ListItemLink
              to="/users"
              primary={drawerOpen && i18n.t("mainDrawer.listItems.users")}
              icon={<Icon icon="tabler:users" fontSize={20} />}
            />

            <ListItemLink
              to="/financeiro"
              primary={drawerOpen && i18n.t("mainDrawer.listItems.financeiro")}
              icon={<Icon icon="bi:credit-card" fontSize={20} />}
            />
            <ListItemLink
              to="/settings"
              primary={drawerOpen && i18n.t("mainDrawer.listItems.settings")}
              icon={<Icon icon="solar:settings-outline" fontSize={20} />}
            />

            {user.super && (
              <>
                {drawerOpen && (
                  <p className="py-2 text-sm text-neutral-500">
                    Super Administrador
                  </p>
                )}
                <ListItemLink
                  to="/announcements"
                  primary={
                    drawerOpen && i18n.t("mainDrawer.listItems.annoucements")
                  }
                  icon={<Icon icon="ph:notification-bold" fontSize={20} />}
                />

                <ListItemLink
                  to="/messages-api"
                  primary={
                    drawerOpen && i18n.t("mainDrawer.listItems.messagesAPI")
                  }
                  icon={<Icon icon="tabler:location-code" fontSize={20} />}
                />
              </>
            )}
          </AccordionMenu>

          <ListItemLink
            to="/helps"
            primary={drawerOpen && i18n.t("mainDrawer.listItems.helps")}
            icon={<Icon icon="solar:help-linear" fontSize={20} />}
          />
        </ul>

        {drawerOpen && (
          <div className="absolute bottom-0 px-4 py-2 text-sm flex items-center gap-2 cursor-pointer w-full bg-neutral-50 dark:bg-gray-800">
            <a
              href="#"
              target="_blank"
              className="flex items-center justify-between w-full"
            >
              <div className="flex items-center gap-2">
                <Icon icon="tabler:headphones-filled" fontSize={18} />
                <div className="flex flex-col">
                  <p>Suporte</p>
                  <p className="text-xs">Fale conosco</p>
                </div>
              </div>

              <Icon
                icon="ep:arrow-right-bold"
                fontSize={14}
                className="text-black dark:text-white"
              />
            </a>
          </div>
        )}
      </div>

      {/* {user?.profile === "admin" && user?.company?.dueDate ? (
        <footer className="border-t">
          <div
            className={`${
              drawerOpen ? "w-full" : "w-0 h-0 hidden"
            }  transition-all overflow-hidden flex flex-col gap-2 p-3`}
          >
            <div className="flex items-center gap-2 justify-center">
              <div className="p-2 bg-neutral-200 rounded-full">
                <Icon
                  icon="octicon:alert-20"
                  fontSize={22}
                  className="text-blue-500"
                />
              </div>
              <p className="text-base font-medium">Atenção!</p>
            </div>
            <p className="text-center">
              Validade até{" "}
              <span className="font-medium text-neutral-900">
                {dateToClient(user?.company?.dueDate)}
              </span>
            </p>

            <button class="text-white relative inline-flex items-center justify-start overflow-hidden font-medium transition-all bg-neutral-900 rounded hover:bg-white group py-1.5 px-2.5">
              <span class="w-56 h-48 rounded bg-blue-500 absolute bottom-0 left-0 translate-x-full ease-out duration-500 transition-all translate-y-full mb-9 ml-9 group-hover:ml-0 group-hover:mb-32 group-hover:translate-x-0"></span>
              <span class="relative w-full transition-colors duration-300 ease-in-out group-hover:text-white text-center">
                Comprar plano
              </span>
            </button>
          </div>
        </footer>
      ) : (
        ""
      )} */}
    </div>
  )

  // return (
  //   <div onClick={drawerClose}>
  //     <Can
  //       role={user.profile}
  //       perform={"drawer-service-items:view"}
  //       style={{
  //         overflowY: "scroll",
  //       }}
  //       no={() => (
  //         <>
  //           <ListSubheader
  //             hidden={!drawerOpen}
  //             style={{
  //               position: "relative",
  //               fontSize: "17px",
  //               textAlign: "left",
  //               paddingLeft: 20,
  //             }}
  //             inset
  //             color="inherit"
  //           >
  //             {i18n.t("mainDrawer.listItems.service")}
  //           </ListSubheader>
  //           <>
  //             <ListItemLink
  //               to="/tickets"
  //               primary={i18n.t("mainDrawer.listItems.tickets")}
  //               icon={<WhatsAppIcon />}
  //             />
  //             <ListItemLink
  //               to="/todolist"
  //               primary={i18n.t("Tarefas")}
  //               icon={<BorderColorIcon />}
  //             />
  //             <ListItemLink
  //               to="/quick-messages"
  //               primary={i18n.t("mainDrawer.listItems.quickMessages")}
  //               icon={<FlashOnIcon />}
  //             />
  //             <ListItemLink
  //               to="/contacts"
  //               primary={i18n.t("mainDrawer.listItems.contacts")}
  //               icon={<ContactPhoneOutlinedIcon />}
  //             />
  //             <ListItemLink
  //               to="/schedules"
  //               primary={i18n.t("mainDrawer.listItems.schedules")}
  //               icon={<EventIcon />}
  //             />
  //             <ListItemLink
  //               to="/tags"
  //               primary={i18n.t("mainDrawer.listItems.tags")}
  //               icon={<LocalOfferIcon />}
  //             />
  //             <ListItemLink
  //               to="/chats"
  //               primary={i18n.t("mainDrawer.listItems.chats")}
  //               icon={
  //                 <Badge color="secondary" variant="dot" invisible={invisible}>
  //                   <ForumIcon />
  //                 </Badge>
  //               }
  //             />
  //             <ListItemLink
  //               to="/helps"
  //               primary={i18n.t("mainDrawer.listItems.helps")}
  //               icon={<HelpOutlineIcon />}
  //             />
  //           </>
  //         </>
  //       )}
  //     />

  //     <Can
  //       role={user.profile}
  //       perform={"drawer-admin-items:view"}
  //       yes={() => (
  //         <>
  //           <Divider />
  //           <ListSubheader
  //             hidden={!drawerOpen}
  //             style={{
  //               position: "relative",
  //               fontSize: "17px",
  //               textAlign: "left",
  //               paddingLeft: 20,
  //             }}
  //             inset
  //             color="inherit"
  //           >
  //             {i18n.t("mainDrawer.listItems.management")}
  //           </ListSubheader>
  //           <ListItemLink
  //             small
  //             to="/"
  //             primary="Dashboard"
  //             icon={<DashboardOutlinedIcon />}
  //           />
  //         </>
  //       )}
  //     />
  //     <Can
  //       role={user.profile}
  //       perform="drawer-admin-items:view"
  //       yes={() => (
  //         <>
  //           <Divider />
  //           <ListSubheader
  //             hidden={!drawerOpen}
  //             style={{
  //               position: "relative",
  //               fontSize: "17px",
  //               textAlign: "left",
  //               paddingLeft: 20,
  //             }}
  //             inset
  //             color="inherit"
  //           >
  //             {i18n.t("mainDrawer.listItems.administration")}
  //           </ListSubheader>

  //           {showCampaigns && (
  //             <>
  //               <ListItem
  //                 button
  //                 onClick={() => setOpenCampaignSubmenu((prev) => !prev)}
  //               >
  //                 <ListItemIcon>
  //                   <EventAvailableIcon />
  //                 </ListItemIcon>
  //                 <ListItemText
  //                   primary={i18n.t("mainDrawer.listItems.campaigns")}
  //                 />
  //                 {openCampaignSubmenu ? (
  //                   <ExpandLessIcon />
  //                 ) : (
  //                   <ExpandMoreIcon />
  //                 )}
  //               </ListItem>
  //               <Collapse
  //                 style={{ paddingLeft: 15 }}
  //                 in={openCampaignSubmenu}
  //                 timeout="auto"
  //                 unmountOnExit
  //               >
  //                 <List component="div" disablePadding>
  //                   <ListItem onClick={() => history.push("/campaigns")} button>
  //                     <ListItemIcon>
  //                       <ListIcon />
  //                     </ListItemIcon>
  //                     <ListItemText primary="Listagem" />
  //                   </ListItem>
  //                   <ListItem
  //                     onClick={() => history.push("/contact-lists")}
  //                     button
  //                   >
  //                     <ListItemIcon>
  //                       <PeopleIcon />
  //                     </ListItemIcon>
  //                     <ListItemText primary="Listas de Contatos" />
  //                   </ListItem>
  //                   <ListItem
  //                     onClick={() => history.push("/campaigns-config")}
  //                     button
  //                   >
  //                     <ListItemIcon>
  //                       <SettingsOutlinedIcon />
  //                     </ListItemIcon>
  //                     <ListItemText primary="Configurações" />
  //                   </ListItem>
  //                 </List>
  //               </Collapse>
  //             </>
  //           )}
  //           {user.super && (
  //             <ListItemLink
  //               to="/announcements"
  //               primary={i18n.t("mainDrawer.listItems.annoucements")}
  //               icon={<AnnouncementIcon />}
  //             />
  //           )}
  //           <ListItemLink
  //             to="/connections"
  //             primary={i18n.t("mainDrawer.listItems.connections")}
  //             icon={
  //               <Badge badgeContent={connectionWarning ? "!" : 0} color="error">
  //                 <SyncAltIcon />
  //               </Badge>
  //             }
  //           />
  //           <ListItemLink
  //             to="/queues"
  //             primary={i18n.t("mainDrawer.listItems.queues")}
  //             icon={<AccountTreeOutlinedIcon />}
  //           />
  //           <ListItemLink
  //             to="/users"
  //             primary={i18n.t("mainDrawer.listItems.users")}
  //             icon={<PeopleAltOutlinedIcon />}
  //           />
  //           <ListItemLink
  //             to="/messages-api"
  //             primary={i18n.t("mainDrawer.listItems.messagesAPI")}
  //             icon={<CodeRoundedIcon />}
  //           />
  //           <ListItemLink
  //             to="/financeiro"
  //             primary={i18n.t("mainDrawer.listItems.financeiro")}
  //             icon={<LocalAtmIcon />}
  //           />

  //           <ListItemLink
  //             to="/settings"
  //             primary={i18n.t("mainDrawer.listItems.settings")}
  //             icon={<SettingsOutlinedIcon />}
  //           />

  //           <Divider />
  //           <Typography
  //             style={{
  //               fontSize: "12px",
  //               padding: "10px",
  //               textAlign: "right",
  //               fontWeight: "bold",
  //             }}
  //           >
  //             {`${
  //               gitinfo.tagName || gitinfo.branchName + " " + gitinfo.commitHash
  //             }`}
  //             &nbsp;/&nbsp;
  //             {`${gitinfo.buildTimestamp}`}
  //           </Typography>
  //         </>
  //       )}
  //     />
  //     <Divider />
  //   </div>
  // )
}

export default MainListItems

function AccordionMenu({ icon, title, children }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="select-none ">
      <div
        className="flex justify-between items-center cursor-pointer px-4 py-2  text-gray-700 hover:text-blue-500 dark:text-white dark:hover:text-blue-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          <span className="mr-2">{icon}</span>
          <span>{title}</span>
        </div>
        <button className="text-neutral-900 dark:text-white text-base transition-all">
          {isOpen ? (
            <Icon icon="lucide:chevron-up" fontSize={20} />
          ) : (
            <Icon icon="lucide:chevron-down" fontSize={20} />
          )}
        </button>
      </div>
      {isOpen && (
        <div className="pl-4 flex flex-col gap-2 mt-1.5">{children}</div>
      )}
    </div>
  )
}
