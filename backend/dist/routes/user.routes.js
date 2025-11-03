"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const usercontroller_1 = require("../controllers/usercontroller");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.route("/logout").post(usercontroller_1.logout);
router.route("/password/forget").post(usercontroller_1.forgetpassword);
router.route("/password/reset/:token").put(usercontroller_1.resetPassword);
router.route("/register").post(usercontroller_1.registerUser);
router.route("/login").post(usercontroller_1.loginuser);
router.route("/me").get(auth_1.isauthenticateuser, usercontroller_1.getuserdetail);
router.route("/password/update").put(auth_1.isauthenticateuser, usercontroller_1.updatepassword);
router.route("/me/updateprofile").put(auth_1.isauthenticateuser, usercontroller_1.updateprofile);
router.route("/admin/users").get(auth_1.isauthenticateuser, (0, auth_1.authorizeroles)("admin"), usercontroller_1.getAllUser);
router.route("/userinfo/:id").get(usercontroller_1.getsingleUser).delete(auth_1.isauthenticateuser, usercontroller_1.deleteUser);
router.route("/checkuser").post(usercontroller_1.checkuser);
router.route("/users/:id").put(usercontroller_1.updateprofile);
router.route("/users").get(usercontroller_1.getAllUser);
exports.default = router;
//# sourceMappingURL=user.routes.js.map