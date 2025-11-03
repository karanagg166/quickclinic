import express from "express";
import { registerUser, checkAuthStatus, loginuser, logout, forgetpassword, resetPassword, getuserdetail, updatepassword, updateprofile, getAllUser, getsingleUser, deleteUser, checkuser } from '../controllers/usercontroller';
import { isauthenticateuser, authorizeroles } from "../middleware/auth";

const router = express.Router();

router.route("/logout").post(logout);
router.route("/password/forget").post(forgetpassword);
router.route("/password/reset/:token").put(resetPassword);
router.route("/register").post(registerUser);
router.route("/login").post(loginuser);
router.route("/me").get(isauthenticateuser, getuserdetail);
router.route("/password/update").put(isauthenticateuser, updatepassword);
router.route("/me/updateprofile").put(isauthenticateuser, updateprofile);
router.route("/admin/users").get(isauthenticateuser, authorizeroles("admin"), getAllUser);
// Order matters - specific routes before parameterized ones
router.route("/userinfo/:id").get(getsingleUser).delete(isauthenticateuser, deleteUser);
router.route("/checkuser").post(checkuser);
router.route("/users/:id").put(updateprofile);
router.route("/users").get(getAllUser);

export default router;
