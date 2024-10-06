import axios from 'axios';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';  
import { toast } from 'react-toastify'; // Import toast for notifications

const Paymentroutes = () => {
    const [responseId, setResponseId] = useState(""); 
    const [responseState, setResponseState] = useState([]);
    const [loading, setLoading] = useState(false); // Loading state
    const navigate = useNavigate();

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = src;
    
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    }

    const createRazorpayOrder = async (amount) => {
        setLoading(true); // Set loading to true
        let data = JSON.stringify({ amount: amount * 100, currency: "INR" });
        let config = {
            method: "post",
            maxBodyLength: Infinity,
            url: "/api/v1/payment-online",
            headers: { 'Content-Type': 'application/json' },
            data: data
        };

        try {
            const response = await axios.request(config);
            console.log(JSON.stringify(response.data)); 
            handleRazorpayScreen(response.data.amount); 
        } catch (error) {
            console.error('Error creating order:', error);
            toast.error("Failed to create payment order");
        } finally {
            setLoading(false); // Set loading to false
        }
    };

    const handleRazorpayScreen = async (amount) => {
        const res = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
        
        if (!res) {
            toast.error("RazorPay SDK failed to load");
            return;
        }

        const options = {
            key: 'rzp_test_3J2f3BNhbitWgB', // Use environment variable in production
            currency: 'INR',   
            name: "Quick Clinic",
            description: "Appointment has been scheduled at your time", 
            prefill: {
                name: "Quick Clinic",
                email: 'shwetsingh32@gmail.com' // Use actual user data in production
            },
            handler: function (response) {
                setResponseId(response.razorpay_payment_id); 
            }  
        };
        
        const paymentObject = new window.Razorpay(options); 
        paymentObject.open();
    };

    const navigatetohome = () => {
        console.log(responseState);
        navigate('/user/home'); 
    };

    const paymentFetch = async (e) => {
        e.preventDefault(); 
        const paymentId = e.target.paymentId.value; 
        
        if (!paymentId) {
            toast.error("Please enter the payment ID");
            return;
        }

        try {
            const response = await axios.get(`http://localhost:5000/api/v1/payment-online/${paymentId}`);
            console.log(response.data); 
            setResponseState(response.data); 
        } catch (error) {
            console.error('Error fetching payment status:', error);
            toast.error("Error fetching payment status");
        } 
        navigatetohome(); 
    };

    return (
        <div className='flex justify-center flex-col items-center m-auto'>
            <button 
                onClick={() => createRazorpayOrder(100)} 
                className='bg-slate-600 pt-2 pb-2 pl-2 pr-2'
                disabled={loading} // Disable button when loading
            >
                {loading ? 'Processing...' : 'Click Here To Make Payment'}
            </button>
            <div className='flex justify-center'>{responseId && <p>{responseId}</p>}</div> 
            <form onSubmit={paymentFetch} className='flex flex-col mt-12 gap-2'>
                <h1>Please Enter The Above Captcha</h1>
                <input type='text' name='paymentId' placeholder='Enter Payment ID' />
                <div className='flex mr-1'>
                    <input type='checkbox' name='human' required/> 
                    <p>Verify You Are Human</p>
                </div>
                <button type='submit' className='bg-slate-400'>Fetch Payment</button>
            </form>
        </div>
    );
};

export default Paymentroutes;
