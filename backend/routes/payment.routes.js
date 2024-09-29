const express = require('express');
const { payment, verifypayment } = require('../controllers/payment');
const router=express.Router();


router.route("/payment-online").post(payment);
router.route("/payment-online/:paymentId").get(verifypayment); 

module.exports=router; 

  
