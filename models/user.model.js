import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { kMaxLength } from "buffer";

const userSchema = new mongoose.Schema(
 {
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxLength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'email is required'],
    trim: true,
    unique: true,
    lowercase: true,
    match: [
        /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
        "Please provide a valid email",
      ],
       password: {
    type: String,
    required: [true, 'password is required'],
    minLength: [8, 'Password needs atleast 8 characters'],
    select: false
  },
  role: {
    type: String,
    enum: {
      values: ['student','instructor','admin'],
      message: 'Please select a valid role'
    },
    default: 'student'
  }, //adding strict checks
  avatar: {
      type: String,
      default: "default-avatar.png",
    },
    bio: {
      type: String,
      maxLength: [200, "Bio cannot exceed 200 characters"],
    },
    enrolledCourses: [{  //reference tells the type of what
      course: { //find the type of course
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
      },
      enrolledAt: {
        type: Date,
        default: Date.now 
      }
    }],
    createdCourses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      }],
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    lastActive: {
      type: Date,
      default: Date.now,
    },
}
 },{//when the object was created
  timestamps: true,
      toJSON: { virtuals: true },
    toObject: { virtuals: true },
     
 });   //IMPORTANT TO ENABLE VIRTUALS

// Encrypt password before saving user
userSchema.pre("save", async function (next) { //trigger the event during save
  if (!this.isModified("password")) {
    return next();
  }// we dont want to hash it over and overagain
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

//the below is a stand alone methods , not part of the bigger
//picture or hooks so next() is not used as it is not a part of
//the chain of middleware

//.methods adds a method to the schema
// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
  //see if the password in the database is accurate to the password
  //that was entered

};

// Generate password reset token
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
    //encrypting the token itself
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};
//for the email
//random bytes = how any chars(length) in the string

// Virtual field for total enrolled courses
//virtuals are fields in database that doesnt exist
//we have them because they are calculatable fields

//eg. how many courses are you assigned to: calc on the go:

userSchema.virtual("totalEnrolledCourses").get(function () {
  return this.enrolledCourses?.length; //array length ez
});

// Update lastActive timestamp
userSchema.methods.updateLastActive = function () {
  this.lastActive = Date.now();
  //updating the last active field
  return this.save({ validateBeforeSave: false });
  //turn off validate as we are only validating only one field
  //maybe other constaints of email or password will interfere

};

export const User = mongoose.model("User", userSchema);
