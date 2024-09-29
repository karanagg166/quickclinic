import axios from 'axios';
import React, { useState } from 'react'

const Paymentroutes = () => {
    const [responseId,setResponseId]=useState(""); 
    const [responseState,setResponseState]=useState([]);

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = src
    
            script.onload = ()=> {
                resolve(true)
            }
    
            script.onerror = () => {
                resolve(false)
            }
            document.body.appendChild(script);
        })
    }

    const createRazorpayOrder=(amount)=>{
        let data=JSON.stringify({
            amount:amount*100,
            currency:"INR"
        })
        let config={
            method:"post",
            maxBodyLength:Infinity,
            url:"http://localhost:5000/api/v1/payment-online",
            headers:{
                'Content-Type':'application/json'
            },
            data:data
        }
        axios.request(config)
        .then((response)=>{
            console.log(JSON.stringify(response.data)); 
            handleRazorpayScreen(response.data.amount); 
        })
        .catch((error)=>{
            console.log('error at ', error); 
        })
    }

    const handleRazorpayScreen=async(amount)=>{
        const res = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
        
        if (!res) {
            toast.error("RazorPay SDK failed to load");
            return;
        }

        const options = {
            key: 'rzp_test_3J2f3BNhbitWgB',
            currency: 'INR',   
            name:"Quick Clinic",
            description: "Appointment has been scheduled at your time", 
            prefill: {
                name:`Quick Clinic`,
                email:'shwetsingh32@gmail.com'
            },
            handler:function (response) {
                setResponseId(response.razorpay_payment_id); 
            }  
        }
        const paymentObject=new window.Razorpay(options); 
        paymentObject.open();
    } 

    const paymentFetch=async(e)=>{
        e.preventDefault(); 
        const paymentId=e.target.paymentId.value; 
        await axios.get(`http://localhost:5000/api/v1/payment-online/${paymentId}`)
        .then((response=>{
            console.log(response.data); 
            setResponseState(response.data); 
        }))
        .catch((error)=>{
            console.log('error occurs at',error);   
        })
    }

  return (
    <div className='flex justify-center flex-col items-center m-auto'>
      <button onClick={()=>createRazorpayOrder(100)} className='bg-slate-600 pt-2 pb-2 pl-2 pr-2'> Click Here To Make Payment </button>
      <div className='flex justify-center'>{responseId && <p>{responseId}</p>}</div> 
      <form onSubmit={paymentFetch} className='flex  flex-col mt-12 gap-2'>
        <h1>Please Enter The Above Captcha </h1>
        <input type='text' name='paymentId' />
        <input type='checkbox'/>
        <button type='submit' className='bg-slate-400'>Fetch Payment</button>
      </form>
    </div>
  )
}

export default Paymentroutes
