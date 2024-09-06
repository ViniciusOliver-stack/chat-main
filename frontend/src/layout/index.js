import React, { useState, useContext, useEffect, useRef } from "react"
import clsx from "clsx"
import moment from "moment"
import {
  makeStyles,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  MenuItem,
  IconButton,
  Menu,
  useTheme,
  useMediaQuery,
} from "@material-ui/core"

import MenuIcon from "@material-ui/icons/Menu"
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft"
import AccountCircle from "@material-ui/icons/AccountCircle"
import CachedIcon from "@material-ui/icons/Cached"

import MainListItems from "./MainListItems"
import NotificationsPopOver from "../components/NotificationsPopOver"
import NotificationsVolume from "../components/NotificationsVolume"
import UserModal from "../components/UserModal"
import AboutModal from "../components/AboutModal"
import { AuthContext } from "../context/Auth/AuthContext"
import BackdropLoading from "../components/BackdropLoading"
import DarkMode from "../components/DarkMode"
import { i18n } from "../translate/i18n"
import { messages } from "../translate/languages"
import toastError from "../errors/toastError"
import AnnouncementsPopover from "../components/AnnouncementsPopover"

import { SocketContext } from "../context/Socket/SocketContext"
import ChatPopover from "../pages/Chat/ChatPopover"

import { useDate } from "../hooks/useDate"
import useAuth from "../hooks/useAuth.js"

import ColorModeContext from "../layout/themeContext"
import Brightness4Icon from "@material-ui/icons/Brightness4"
import Brightness7Icon from "@material-ui/icons/Brightness7"
import LanguageIcon from "@material-ui/icons/Language"
import { getBackendURL } from "../services/config"
import NestedMenuItem from "material-ui-nested-menu-item"
import GoogleAnalytics from "../components/GoogleAnalytics"
import OnlyForSuperUser from "../components/OnlyForSuperUser"

/*Novos Imports */

import { Icon } from "@iconify/react/dist/iconify.js"
import { Accordion } from "../components/ui/Accordion/index.js"
import { ThemeContext } from "../context/themeContextTailwind.js"

const drawerWidth = 240

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    height: "100vh",
    backgroundColor: theme.palette.fancyBackground,
    "& .MuiButton-outlinedPrimary": {
      color: theme.palette.primary,
      border:
        theme.mode === "light"
          ? "1px solid rgba(0 124 102)"
          : "1px solid rgba(255, 255, 255, 0.5)",
    },
    "& .MuiTab-textColorPrimary.Mui-selected": {
      color: theme.palette.primary,
    },
  },
  avatar: {
    width: "100%",
  },
  toolbar: {
    paddingRight: 24, // keep right padding when drawer closed
    color: theme.palette.dark.main,
    background: theme.palette.barraSuperior,
  },
  toolbarIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: "48px",
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  appBarShift: {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  },
  menuButton: {
    marginRight: 36,
  },
  menuButtonHidden: {
    display: "none",
  },
  title: {
    flexGrow: 1,
    fontSize: 14,
    color: "white",
  },
  drawerPaper: {
    position: "relative",
    whiteSpace: "nowrap",
    width: drawerWidth,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    overflowY: "clip",
    ...theme.scrollbarStylesSoft,
  },
  drawerPaperClose: {
    overflowX: "hidden",
    overflowY: "clip",
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    width: theme.spacing(7),
    [theme.breakpoints.up("sm")]: {
      width: theme.spacing(9),
    },
  },
  appBarSpacer: {
    minHeight: "48px",
  },
  content: {
    flex: 1,
    overflow: "auto",
  },
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  paper: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
  },
  containerWithScroll: {
    flex: 1,
    padding: theme.spacing(1),
    overflowY: "auto",
    overflowX: "clip",
    ...theme.scrollbarStyles,
  },
  NotificationsPopOver: {
    // color: theme.barraSuperior.secondary.main,
  },
  logo: {
    width: "192px",
    maxHeight: "72px",
    logo: theme.logo,
    content:
      "url(" +
      (theme.mode === "light"
        ? theme.calculatedLogoLight()
        : theme.calculatedLogoDark()) +
      ")",
  },
  hideLogo: {
    display: "none",
  },
}))

const LoggedInLayout = ({ children, themeToggle }) => {
  const dropdownRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false)
    }
  }

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
  }

  const classes = useStyles()
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [aboutModalOpen, setAboutModalOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [languageOpen, setLanguageOpen] = useState(false)
  const { handleLogout, loading } = useContext(AuthContext)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerVariant, setDrawerVariant] = useState("permanent")
  // const [dueDate, setDueDate] = useState("");
  const { user } = useContext(AuthContext)

  const theme = useTheme()
  const { themeTailwindCSS, toggleTheme } = useContext(ThemeContext)
  const { colorMode } = useContext(ColorModeContext)
  const greaterThenSm = useMediaQuery(theme.breakpoints.up("sm"))

  const [currentLanguage, setCurrentLanguage] = useState(i18n.language)

  const { getCurrentUserInfo } = useAuth()
  const [currentUser, setCurrentUser] = useState({})

  const [volume, setVolume] = useState(localStorage.getItem("volume") || 1)

  const { dateToClient } = useDate()

  const socketManager = useContext(SocketContext)

  //################### CODIGOS DE TESTE #########################################
  // useEffect(() => {
  //   navigator.getBattery().then((battery) => {
  //     console.log(`Battery Charging: ${battery.charging}`);
  //     console.log(`Battery Level: ${battery.level * 100}%`);
  //     console.log(`Charging Time: ${battery.chargingTime}`);
  //     console.log(`Discharging Time: ${battery.dischargingTime}`);
  //   })
  // }, []);

  // useEffect(() => {
  //   const geoLocation = navigator.geolocation

  //   geoLocation.getCurrentPosition((position) => {
  //     let lat = position.coords.latitude;
  //     let long = position.coords.longitude;

  //     console.log('latitude: ', lat)
  //     console.log('longitude: ', long)
  //   })
  // }, []);

  // useEffect(() => {
  //   const nucleos = window.navigator.hardwareConcurrency;

  //   console.log('Nucleos: ', nucleos)
  // }, []);

  // useEffect(() => {
  //   console.log('userAgent', navigator.userAgent)
  //   if (
  //     navigator.userAgent.match(/Android/i)
  //     || navigator.userAgent.match(/webOS/i)
  //     || navigator.userAgent.match(/iPhone/i)
  //     || navigator.userAgent.match(/iPad/i)
  //     || navigator.userAgent.match(/iPod/i)
  //     || navigator.userAgent.match(/BlackBerry/i)
  //     || navigator.userAgent.match(/Windows Phone/i)
  //   ) {
  //     console.log('é mobile ', true) //celular
  //   }
  //   else {
  //     console.log('não é mobile: ', false) //nao é celular
  //   }
  // }, []);
  //##############################################################################

  useEffect(() => {
    if (document.body.offsetWidth > 600) {
      setDrawerOpen(true)
    }
  }, [])

  useEffect(() => {
    getCurrentUserInfo().then((user) => {
      setCurrentUser(user)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (document.body.offsetWidth < 600) {
      setDrawerVariant("temporary")
    } else {
      setDrawerVariant("permanent")
    }
  }, [drawerOpen])

  useEffect(() => {
    const companyId = localStorage.getItem("companyId")
    const userId = localStorage.getItem("userId")

    const socket = socketManager.GetSocket(companyId)

    const onCompanyAuthLayout = (data) => {
      if (data.user.id === +userId) {
        toastError("Sua conta foi acessada em outro computador.")
        setTimeout(() => {
          localStorage.clear()
          window.location.reload()
        }, 1000)
      }
    }

    socket.on(`company-${companyId}-auth`, onCompanyAuthLayout)

    socket.emit("userStatus")
    const interval = setInterval(() => {
      socket.emit("userStatus")
    }, 1000 * 60 * 5)

    return () => {
      socket.disconnect()
      clearInterval(interval)
    }
  }, [socketManager])

  const handleProfileMenu = (event) => {
    setAnchorEl(event.currentTarget)
    setMenuOpen(true)
  }

  const handleCloseProfileMenu = () => {
    setAnchorEl(null)
    setMenuOpen(false)
  }

  const handleCloseLanguageMenu = () => {
    setAnchorEl(null)
    setLanguageOpen(false)
  }

  const handleOpenUserModal = () => {
    setUserModalOpen(true)
    handleCloseProfileMenu()
  }

  const handleOpenAboutModal = () => {
    setAboutModalOpen(true)
    handleCloseProfileMenu()
  }

  const handleClickLogout = () => {
    handleCloseProfileMenu()
    handleLogout()
  }

  const drawerClose = () => {
    if (document.body.offsetWidth < 600) {
      setDrawerOpen(false)
    }
  }

  const handleMenuItemClick = () => {
    const { innerWidth: width } = window
    if (width <= 600) {
      setDrawerOpen(false)
    }
  }

  const toggleColorMode = () => {
    colorMode.toggleColorMode()
  }

  const handleChooseLanguage = (language) => {
    localStorage.setItem("language", language)
    window.location.reload(false)
  }

  if (loading) {
    return <BackdropLoading />
  }

  return (
    <div className="flex h-screen bg-neutral-50 text-neutral-900  dark:bg-neutral-900 dark:text-white">
      <div
        className={`${
          drawerOpen
            ? "fixed lg:relative whitespace-nowrap w-[240px] overflow-y-clip z-50 bg-neutral-50 h-screen dark:bg-neutral-900"
            : "overflow-x-hidden overflow-y-clip w-[70px] md:w-[80px] "
        } flex flex-col overflow-auto transition-all duration-300 ${
          !drawerOpen && "overflow-x-hidden overflow-y-clip w-[450px]"
        }`}
        open={drawerOpen}
      >
        <div className="flex items-center justify-between min-h-12">
          <img
            className={`bg-cover ${
              drawerOpen ? classes.logo : classes.hideLogo
            }`}
            alt="logo"
          />

          {drawerOpen ? (
            <button
              type="button"
              onClick={() => setDrawerOpen(!drawerOpen)}
              className="mr-2"
            >
              <Icon icon="ep:arrow-left-bold" fontSize={20} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setDrawerOpen(!drawerOpen)}
              className="flex items-center justify-center w-full"
            >
              <Icon icon="ep:arrow-right-bold" fontSize={20} />
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-clip mt-4">
          <MainListItems
            drawerClose={drawerClose}
            drawerOpen={drawerOpen}
            collapsed={!drawerOpen}
          />
        </div>
      </div>
      <UserModal
        open={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        userId={user?.id}
      />

      <div
        className={`absolute ${
          drawerClose && "w-[96%]"
        } right-2 flex items-center justify-end z-10 select-none bg-neutral-50 border-b border-gray-100 dark:bg-neutral-900 dark:border-neutral-800/30`}
      >
        <div className="flex items-center">
          {user.id && <NotificationsPopOver volume={volume} />}
          <AnnouncementsPopover />

          <ChatPopover />

          <div>
            <div className="mr-5">
              <button
                type="button"
                className="inline-flex justify-center items-center w-full text-sm font-medium text-gray-700 focus:outline-none"
                onClick={toggleDropdown}
              >
                <div className="flex items-center gap-2">
                  <img
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSb0xnK9Tda9uC_GlPVkwcQO9dRVaCoBWs73V5Yf_FFN8i5gWSzrxBw2oS126sikhXYpQM&usqp=CAU"
                    alt=""
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="flex flex-col text-left dark:text-white text-black">
                    <p className="font-medium text-xs md:text-sm">
                      {user.name}
                    </p>
                    <p className="text-xs">{user.profile}</p>
                  </div>
                </div>
                <svg
                  className="-mr-1 ml-2 h-5 w-5 dark:text-white text-dark"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            {isOpen && (
              <div
                ref={dropdownRef}
                className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 mr-2"
              >
                <div className="py-1">
                  <div>
                    <p className="font-medium px-4 py-2 text-sm text-gray-700">
                      Minha conta
                    </p>
                  </div>

                  <div className="w-full h-[1px] bg-neutral-100" />

                  <div
                    className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer hover:text-blue-500"
                    onClick={handleOpenUserModal}
                  >
                    <Icon icon="radix-icons:person" fontSize={16} />
                    {i18n.t("mainDrawer.appBar.user.profile")}
                  </div>

                  {/* 
                  <div
                    onClick={toggleColorMode}
                    className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer hover:text-blue-500"
                  >
                    {theme.mode === "dark" ? (
                      <Icon icon="ph:sun" size={20} />
                    ) : (
                      <Icon icon="ph:moon" size={20} />
                    )}
                    {theme.mode === "dark"
                      ? i18n.t("mainDrawer.appBar.user.lightmode")
                      : i18n.t("mainDrawer.appBar.user.darkmode")}
                  </div> */}

                  <Accordion
                    title={i18n.t("mainDrawer.appBar.user.language")}
                    icon={<Icon icon="ic:round-translate" size={32} />}
                  >
                    {Object.keys(messages).map((m) => (
                      <button
                        type="button"
                        onClick={() => handleChooseLanguage(m)}
                        className="flex flex-col gap-2 px-6 py-2 hover:text-blue-500"
                      >
                        {
                          messages[m].translations.mainDrawer.appBar.i18n
                            .language
                        }
                      </button>
                    ))}
                  </Accordion>

                  {/*Oficial Symplus - Realizar algumas mudanças de nome no final 
                  TODO - Verificar dentro do APP.JS o que os theme afetam removendo eles.*/}

                  <div className="flex items-center justify-between gap-2 px-2">
                    <button
                      onClick={() => toggleTheme("light")}
                      className="py-2 text-gray-700 bg-gray-100 flex items-center justify-center gap-2 cursor-pointer hover:bg-blue-500 hover:text-white transition-all duration-300 w-full rounded-md"
                    >
                      <Icon icon="ph:sun" size={20} />
                      {/* {i18n.t("mainDrawer.appBar.user.lightmode")} */}
                    </button>
                    <button
                      onClick={() => toggleTheme("dark")}
                      className="py-2 text-gray-700 bg-gray-100 flex items-center justify-center gap-2 cursor-pointer hover:bg-blue-500 hover:text-white transition-all duration-300 w-full rounded-md"
                    >
                      <Icon icon="ph:moon" size={20} />
                      {/* {i18n.t("mainDrawer.appBar.user.darkmode")} */}
                    </button>
                    <button
                      onClick={() => toggleTheme("system")}
                      className="py-2 text-gray-700 bg-gray-100 flex items-center justify-center gap-2 cursor-pointer hover:bg-blue-500 hover:text-white transition-all duration-300 w-full rounded-md"
                    >
                      <Icon icon="radix-icons:laptop" size={20} />
                      {/* System Default */}
                    </button>
                  </div>

                  <div className="w-full h-[1px] bg-neutral-100 mt-3" />

                  <button
                    type="button"
                    onClick={handleClickLogout}
                    className="w-full text-left  px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-red-500 flex items-center gap-2"
                  >
                    <Icon icon="mi:log-out" fontSize={16} />
                    {i18n.t("mainDrawer.appBar.user.logout")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* <AppBar
        position="absolute"
        className={clsx(classes.appBar, drawerOpen && classes.appBarShift)}
        color="primary"
      >
        <Toolbar variant="dense" className={classes.toolbar}>

        // Esse aqui é o botão de fechar
          <IconButton
            edge="start"
            variant="contained"
            aria-label="open drawer"
            onClick={() => setDrawerOpen(!drawerOpen)}
            className={clsx(
              classes.menuButton,
              drawerOpen && classes.menuButtonHidden
            )}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            component="h2"
            variant="h6"
            color="inherit"
            noWrap
            className={classes.title}
          >
             {greaterThenSm && user?.profile === "admin" && user?.company?.dueDate ? (
              <>
                Olá <b>{user.name}</b>, seja bem-vindo a <b>{user?.company?.name}</b>! (Ativo até {dateToClient(user?.company?.dueDate)})
              </>
            ) : (
              <>
                Olá <b>{user.name}</b>, seja bem-vindo a <b>{user?.company?.name}</b>!
              </>
            )}
          </Typography>

          <NotificationsVolume setVolume={setVolume} volume={volume} />

          {user.id && <NotificationsPopOver volume={volume} />}


          <div>

          </div>


          <div>
            <IconButton
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleProfileMenu}
              variant="contained"
              style={{ color: "white" }}
            >
              <AccountCircle />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              getContentAnchorEl={null}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={menuOpen}
              onClose={handleCloseProfileMenu}
            >


              <NestedMenuItem
                label={i18n.t("mainDrawer.appBar.user.language")}
                parentMenuOpen={menuOpen}
              >
                {
                  Object.keys(messages).map((m) => (
                    <MenuItem onClick={() => handleChooseLanguage(m)}>
                      {messages[m].translations.mainDrawer.appBar.i18n.language}
                    </MenuItem>
                  ))
                }
              </NestedMenuItem>

              <MenuItem onClick={handleClickLogout}>
                {i18n.t("mainDrawer.appBar.user.logout")}
              </MenuItem>
            </Menu>
          </div>
        </Toolbar>
      </AppBar> */}

      {/* Exibição do conteúdo */}
      <main className="flex-1 overflow-auto">
        <div className="min-h-14 bg-neutral-100/50 text-dark dark:bg-neutral-900 dark:text-white" />
        <OnlyForSuperUser user={currentUser} yes={() => <GoogleAnalytics />} />
        {children ? children : null}
      </main>
    </div>
  )
}

export default LoggedInLayout
