import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken.js";
import { deleteMediaFromCloudinary, uploadMedia } from "../utils/cloudinary.js";
import { catchAsync, ApiError } from "../middleware/error.middleware.js";
import { AppError } from "../middleware/error.middleware.js";
import crypto from "crypto";

/**
 * Create a new user account
 * @route POST /api/v1/users/signup
 */
export const createUserAccount = catchAsync(async (req, res) => {
  
    const {name, email, password , role = "student"} = req.body
    
    //we will do valdiations globally 
    const existingUser = await User.findOne({email: email.toLowerCase()})
    //finding the user based on the email  

    if(existingUser){
      throw new ApiError('User already exists', 400);
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role
    })

    await user.updateLastActive();
    //as the user was the just created.
    //passing user below:
    generateToken(res, user, 'Account created')
    //unique id created
});

/**
 * Authenticate user and get token
 * @route POST /api/v1/users/signin
 */
export const authenticateUser = catchAsync(async (req, res) => {
  const {email, password} =  req.body 

  const user = User.findOne({email: email.toLowerCase()}).select('+password')
  //password field will not be included here

  if(!user || !(await user.comparePassword(password))){
    throw new ApiError("Invalid email or password!", 401);
 
  }

  await user.updateLastActive()
  generateToken(res,user, `Welcome back ${user.name}`);
  
  


});

/**
 * Sign out user and clear cookie
 * @route POST /api/v1/users/signout
 */
export const signOutUser = catchAsync(async (_, res) => {
  res.cookie('token', '', {maxAge: 0})  //delete the cookie 
  res.status(200).json({
    success: true,
    message: "Signed out successfully",
  })
});

/**
 * Get current user profile
 * @route GET /api/v1/users/profile
 */
export const getCurrentUserProfile = catchAsync(async (req, res) => {
  
  const user = User.findById(req.id)
  .populate({
    path: "enrolledCourses.course",
    select: 'title thumbnail description'
  });   //get the deets

  if(!user){
    throw new ApiError("User not Found!",404);

  }

  res.status(200).json({
    success: true,
    data: {
      ...user.toJSON(),  //spread
      totalEnrolledCourses: user.totalEnrolledCourses,

    }
  })
  
});

/**
 * Update user profile
 * @route PATCH /api/v1/users/profile
 */
export const updateUserProfile = catchAsync(async (req, res) => {

const { name, email, bio } = req.body;
const updateData = {
  name,
  email: email?.toLowerCase(),
  bio
};

if(req.file){
  const avatarResult = await uploadMedia(req.file.path)
  updateData.avatar = avatarResult.secure_url 

  //delete old avatar

  const user = await User.findById(req.id)
  if(user.avatar && user.avatar !== 'default-avatar.png')
  {
    await deleteMediaFromCloudinary(user.avatar)
  }
}

//update user and get updated doc
const updatedUser = await User.findByIdAndUpdate(
  req.id,
  updateData,
  {new: true, runValidators: true}
)

if(!updatedUser){
  throw new ApiError("User not found", 404);
}

res.status(200).json({
  success: true,
  message: "Profile updated successfully",
  data: updatedUser
}
)

});

/**
 * Change user password
 * @route PATCH /api/v1/users/password
 */
export const changeUserPassword = catchAsync(async (req, res) => {
  // TODO: Implement change user password functionality
});

/**
 * Request password reset
 * @route POST /api/v1/users/forgot-password
 */
export const forgotPassword = catchAsync(async (req, res) => {
  // TODO: Implement forgot password functionality
});

/**
 * Reset password
 * @route POST /api/v1/users/reset-password/:token
 */
export const resetPassword = catchAsync(async (req, res) => {
  // TODO: Implement reset password functionality
});

/**
 * Delete user account
 * @route DELETE /api/v1/users/account
 */
export const deleteUserAccount = catchAsync(async (req, res) => {
  // TODO: Implement delete user account functionality
});
