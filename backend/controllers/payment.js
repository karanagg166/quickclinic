const Razorpay=require('razorpay'); 

exports.payment=async (req,res)=>{
    const razorpay=new Razorpay({
      key_id:'rzp_test_3J2f3BNhbitWgB',
      key_secret:'AiIQhShqNUPt0hY9W1Th7hgo'
    })

    const options={
      amount:100,
      currency:"INR",
      receipt:"payment receipt",
      payment_capture:1 
    }
    try {
      const response=await razorpay.orders.create(options); 
      res.status(200).json({
        success:true, 
        order_id:response._id,
        currency:response.currency,
        amount:response.amount 
      })
    } catch (error) {
      res.json({
        success:false, 
        message:error.message 
      })
    }
  }
  exports.verifypayment=async(req,res)=>{
    const {paymentId}=req.params; 
    const razorpay=new Razorpay({
      key_id:'rzp_test_3J2f3BNhbitWgB',
      key_secret:'AiIQhShqNUPt0hY9W1Th7hgo'
    })

    try {
      const payment=await razorpay.payments.fetch(paymentId); 

      if(!payment){
        return res.status(401).json({
            success:false, 
            message:'Razorpay Server Error', 
        })
      }
      res.status(200).json({
        status:payment.status,
        method:payment.method, 
        amount:payment.amount,
        currency:payment.currency,
      })

    } catch (error) {
        return res.status(401).json({
            success:false, 
            message:'Something Went Wrong on Razorpay Server', 
        })
    }
  }
