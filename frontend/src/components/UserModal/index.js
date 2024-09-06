import React, { useState, useEffect, useContext } from "react"

import * as Yup from "yup"
import { Formik, Form, Field } from "formik"
import { toast } from "react-toastify"

import { makeStyles } from "@material-ui/core/styles"
import { green } from "@material-ui/core/colors"
import Button from "@material-ui/core/Button"
import TextField from "@material-ui/core/TextField"
import Dialog from "@material-ui/core/Dialog"
import DialogActions from "@material-ui/core/DialogActions"
import DialogContent from "@material-ui/core/DialogContent"
import DialogTitle from "@material-ui/core/DialogTitle"
import CircularProgress from "@material-ui/core/CircularProgress"
import Select from "@material-ui/core/Select"
import InputLabel from "@material-ui/core/InputLabel"
import MenuItem from "@material-ui/core/MenuItem"
import FormControl from "@material-ui/core/FormControl"

import { i18n } from "../../translate/i18n"

import api from "../../services/api"
import toastError from "../../errors/toastError"
import QueueSelect from "../QueueSelect"
import { AuthContext } from "../../context/Auth/AuthContext"
import { Can } from "../Can"

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
  },
  multFieldLine: {
    display: "flex",
    "& > *:not(:last-child)": {
      marginRight: theme.spacing(1),
    },
  },

  btnWrapper: {
    position: "relative",
  },

  buttonProgress: {
    color: green[500],
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -12,
    marginLeft: -12,
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  },
}))

const UserSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Nome muito curto")
    .max(50, "Nome muito longo")
    .required("Campo obrigatório"),
  password: Yup.string()
    .min(5, "Senha muito curta")
    .max(50, "Senha muito longa"),
  email: Yup.string().email("Email inválido").required("Campo obrigatório"),
})

const UserModal = ({ open, onClose, userId }) => {
  const classes = useStyles()

  const initialState = {
    name: "",
    email: "",
    password: "",
    profile: "user",
  }

  const { user: loggedInUser } = useContext(AuthContext)

  const [user, setUser] = useState(initialState)
  const [selectedQueueIds, setSelectedQueueIds] = useState([])

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return
      try {
        const { data } = await api.get(`/users/${userId}`)
        setUser((prevState) => {
          return { ...prevState, ...data }
        })
        const userQueueIds = data.queues?.map((queue) => queue.id)
        setSelectedQueueIds(userQueueIds)
      } catch (err) {
        toastError(err)
      }
    }

    fetchUser()
  }, [userId, open])

  const handleClose = () => {
    onClose()
    setUser(initialState)
  }

  const handleSaveUser = async (values) => {
    const userData = { ...values, queueIds: selectedQueueIds }
    try {
      if (userId) {
        await api.put(`/users/${userId}`, userData)
      } else {
        await api.post("/users", userData)
      }
      toast.success(i18n.t("userModal.success"))
    } catch (err) {
      toastError(err)
    }
    handleClose()
  }

  return (
    <div className={classes.root}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="xs"
        fullWidth
        scroll="paper"
      >
        <p id="form-dialog-title" className="text-lg font-medium p-4 space-y-4">
          {userId
            ? `${i18n.t("userModal.title.edit")}`
            : `${i18n.t("userModal.title.add")}`}
        </p>
        <Formik
          initialValues={user}
          enableReinitialize={true}
          validationSchema={UserSchema}
          onSubmit={(values, actions) => {
            setTimeout(() => {
              handleSaveUser(values)
              actions.setSubmitting(false)
            }, 400)
          }}
        >
          {({ touched, errors, isSubmitting }) => (
            <Form>
              <div className="p-4 space-y-4 flex flex-col">
                <div className="flex space-x-2">
                  <div className="w-full">
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700"
                    >
                      {i18n.t("userModal.form.name")}
                    </label>
                    <Field
                      id="name"
                      name="name"
                      type="text"
                      placeholder={i18n.t("userModal.form.name")}
                      className={`mt-1 p-2 block w-full shadow-sm sm:text-sm border rounded-md 
    					${touched.name && errors.name ? "border-red-500" : "border-gray-300"}`}
                    />
                    {touched.name && errors.name && (
                      <p className="mt-2 text-xs text-red-600">{errors.name}</p>
                    )}
                  </div>

                  {/* <Field
                    as={TextField}
                    label={i18n.t("userModal.form.name")}
                    autoFocus
                    name="name"
                    error={touched.name && Boolean(errors.name)}
                    helperText={touched.name && errors.name}
                    variant="outlined"
                    margin="dense"
                    fullWidth
                  /> */}

                  {/* Password */}

                  <div className="w-full">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700"
                    >
                      {i18n.t("userModal.form.password")}
                    </label>
                    <Field
                      id="password"
                      name="password"
                      type="password"
                      placeholder={i18n.t("userModal.form.password")}
                      className={`mt-1 p-2 block w-full shadow-sm sm:text-sm border rounded-md 
    					${
                touched.password && errors.password
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
                    />
                    {touched.password && errors.password && (
                      <p className="mt-2 text-xs text-red-600">
                        {errors.password}
                      </p>
                    )}
                  </div>
                  {/* <Field
                    as={TextField}
                    label={i18n.t("userModal.form.password")}
                    type="password"
                    name="password"
                    error={touched.password && Boolean(errors.password)}
                    helperText={touched.password && errors.password}
                    variant="outlined"
                    margin="dense"
                    fullWidth
                  /> */}
                </div>

                <div className="flex space-x-2">
                  <div className="w-full">
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700"
                    >
                      {i18n.t("userModal.form.email")}
                    </label>
                    <Field
                      id="email"
                      name="email"
                      type="email"
                      placeholder={i18n.t("userModal.form.email")}
                      className={`mt-1 p-2 block w-full shadow-sm sm:text-sm border rounded-md 
						${touched.email && errors.email ? "border-red-500" : "border-gray-300"}`}
                    />
                    {touched.email && errors.email && (
                      <p className="mt-2 text-xs text-red-600">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div className="w-full">
                    <Can
                      role={loggedInUser.profile}
                      perform="user-modal:editProfile"
                      yes={() => (
                        <>
                          <label
                            htmlFor="profile"
                            className="block text-sm font-medium text-gray-700"
                          >
                            {i18n.t("userModal.form.profile")}
                          </label>
                          <Field
                            as="select"
                            id="profile"
                            name="profile"
                            className="mt-1 p-2 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md"
                          >
                            <option value="admin">Admin</option>
                            <option value="user">User</option>
                          </Field>
                        </>
                      )}
                    />
                  </div>
                </div>

                {/* <div className={classes.multFieldLine}>
                  <Field
                    as={TextField}
                    label={i18n.t("userModal.form.email")}
                    name="email"
                    error={touched.email && Boolean(errors.email)}
                    helperText={touched.email && errors.email}
                    variant="outlined"
                    margin="dense"
                    fullWidth
                  />
                  <FormControl
                    variant="outlined"
                    className={classes.formControl}
                    margin="dense"
                  >
                    <Can
                      role={loggedInUser.profile}
                      perform="user-modal:editProfile"
                      yes={() => (
                        <>
                          <InputLabel id="profile-selection-input-label">
                            {i18n.t("userModal.form.profile")}
                          </InputLabel>

                          <Field
                            as={Select}
                            label={i18n.t("userModal.form.profile")}
                            name="profile"
                            labelId="profile-selection-label"
                            id="profile-selection"
                            required
                          >
                            <MenuItem value="admin">Admin</MenuItem>
                            <MenuItem value="user">User</MenuItem>
                          </Field>
                        </>
                      )}
                    />
                  </FormControl>
                </div> */}
                <Can
                  role={loggedInUser.profile}
                  perform="user-modal:editQueues"
                  yes={() => (
                    <QueueSelect
                      selectedQueueIds={selectedQueueIds}
                      onChange={(values) => setSelectedQueueIds(values)}
                    />
                  )}
                />
              </div>

              <div className="w-full flex items-center justify-end gap-3 p-4">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleClose}
                  className="bg-red-500 px-4 py-2 text-white rounded-md hover:bg-red-600 transition-all duration-200"
                >
                  {i18n.t("userModal.buttons.cancel")}
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="relative bg-blue-500 px-4 py-2 text-white rounded-md hover:bg-blue-600 transition-all duration-200"
                >
                  {userId
                    ? `${i18n.t("userModal.buttons.okEdit")}`
                    : `${i18n.t("userModal.buttons.okAdd")}`}
                  {isSubmitting && (
                    <CircularProgress
                      size={24}
                      className={classes.buttonProgress}
                    />
                  )}
                </button>
              </div>
              {/* <DialogActions>
                <Button
                  onClick={handleClose}
                  color="secondary"
                  disabled={isSubmitting}
                  variant="outlined"
                >
                  {i18n.t("userModal.buttons.cancel")}
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  disabled={isSubmitting}
                  variant="contained"
                  className={classes.btnWrapper}
                >
                  {userId
                    ? `${i18n.t("userModal.buttons.okEdit")}`
                    : `${i18n.t("userModal.buttons.okAdd")}`}
                  {isSubmitting && (
                    <CircularProgress
                      size={24}
                      className={classes.buttonProgress}
                    />
                  )}
                </Button>
              </DialogActions> */}
            </Form>
          )}
        </Formik>
      </Dialog>
    </div>
  )
}

export default UserModal
