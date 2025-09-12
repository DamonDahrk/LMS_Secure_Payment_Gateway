import mongoose from "mongoose";

const coursePurchaseSchema = new mongoose.Schema({
    course:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Course',
        required:[true, 'Course reference is required']
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:[true, 'User reference is required']
    },
    amount:{
        type:Number,
        required:[true, 'Purchase amount is required'],
        min:[0, 'Amount must be non-negative']
    },
    currency:{
        type:String,
        required:[true, 'Currency is required'],
        uppercase:true,
        default:'USD' //what currency
    },
    status:{
        type:String,
        enum:{
            values:['pending', 'completed', 'failed', 'refunded'],
            message:'Please select a valid status'
        },
        default:'pending'

        //buy status
    },
    paymentMethod:{
        type:String,
        required:[true, 'Payment method is required']
        //payment provider will give you payment method
    },
    paymentId:{
        type:String,
        required:[true, 'Payment ID is required']
        //payment provider will give you payment id
    },
    refundId:{
        type:String
    }, //same as above
    refundAmount:{
        type:Number,
        min:[0, 'Refund amount must be non-negative']
    },
    refundReason:{
        type:String
    },
    metadata:{
        type:Map,
        of:String
    }
},{
    timestamps:true,
    toJSON:{virtuals:true},
    toObject:{virtuals:true}
});

// Index for faster queries
coursePurchaseSchema.index({user:1,course:1});
//when searching only 1 user and course

coursePurchaseSchema.index({status:1});

//only one status and created at
//The -1 value specifies the index is sorted in descending order
//  based on the createdAt timestamps.
coursePurchaseSchema.index({createdAt:-1});

// Virtual field to check if purchase is refundable (within 30 days)
coursePurchaseSchema.virtual('isRefundable').get(function(){
    if(this.status!=='completed')return false;
    //if payment is completed then only proceed
    const thirtyDaysAgo=new Date(Date.now()-30*24*60*60*1000);
    return this.createdAt>thirtyDaysAgo;
    //refund can be done as long as its within thirty day window
});

// Method to process refund
coursePurchaseSchema.methods.processRefund=async function(reason,amount){
    this.status='refunded';
    this.refundReason=reason; //reason of refund
    this.refundAmount=amount||this.amount; //amount of refund
    return this.save();
};

//not actual fnc but updation in the db

export const CoursePurchase=mongoose.model('CoursePurchase',coursePurchaseSchema);