import Razorpay from "razorpay";
import crypto from "crypto";
import { Course } from "../models/course.model.js";
import { CoursePurchase } from "../models/coursePurchase.model.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createRazorpayOrder = async (req, res) => {
  try{
    const userId = req.id 
    const {courseId} = req.body 

    const course = await Course.findById(courseId) 
    //find the course where you are creating the order for \

    if(!course) return res.status(404).json({
      message: "Course not found"
    })

    const newPurchase = new CoursePurchase({
      course: courseId,
      user: userId,
      amount: course.price,
      status: "pending",
    });

    const options = {
      amount: course.price * 100, // amount in paise 
      //minimum price 
      currency: "INR",
      reciept: `course_${courseId}`,
      notes: {
        courseId: courseId,
        userId: userId
      }
    };

    const order = await razorpay.orders.create(options)

    //this will deduct the money

    newPurchase.paymentId = order.id
    // new order is created first 
    await newPurchase.save() 

    res.status(200).json({
      success: true,
      order,
      course: {
        name: course.title,
        description: course.description,
      }
    })


  } catch(error) {
      //Handle error
  }
};

export const verifyPayment = async (req, res) => {
  try{
    const {razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex')

    //adding signature
    //verifying below
    const isAuthetic = expectedSignature === razorpay_signature;

    const purchase = await CoursePurchase.findOne({
      paymentId: razorpay_order_id,
    });
    if(!purchase) {
      return res.status(404)
      .json({
        message: "Purchase record not found!"
      });
    }
    
    purchase.status = "completed";
    await purchase.save();
    //update purchase status on validation 

    //The key is the HMAC key used to generate the cryptographic HMAC hash.
  } catch(error) {

  }
};
