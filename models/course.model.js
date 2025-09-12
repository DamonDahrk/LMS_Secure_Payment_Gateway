import mongoose from "mongoose"

const courseSchema = new mongoose.Schema({
    title:{
        type:String,
        required:[true, 'Course title is required'],
        trim:true,
        maxLength:[100, 'Course title cannot exceed 100 characters']
    }, //details for title

    subtitle:{
        type:String,
        trim:true,
        maxLength:[200, 'Course subtitle cannot exceed 200 characters']
    },

    description:{
        type:String,
        trim:true
    },
    category:{
        type:String,
        required:[true, 'Course category is required'],
        trim:true
    },
    level:{
        type:String,
        enum:{
            values:['beginner', 'intermediate', 'advanced'],
            message:'Please select a valid course level'
        }, //categories of level for course
        default:'beginner'
    },
    price:{
        type:Number,
        required:[true, 'Course price is required'],
        min:[0, 'Course price must be non-negative']
    },
    thumbnail:{
        type:String,
        required:[true, 'Course thumbnail is required']
    },
    enrolledStudents:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'User'
        } //for the particular course
    ],
    lectures:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Lecture"
        }  //lectures for the course
    ],
    instructor:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:[true, 'Course instructor is required']
    }, //course instructor
    isPublished:{
        type:Boolean,
        default:false
    },
    totalDuration:{
        type:Number,
        default:0
    },
    totalLectures:{
        type:Number,
        default:0
    }
}, {
    timestamps:true,
    toJSON:{virtuals:true},
    toObject:{virtuals:true}
});

//This way, you can populate reviews on-demand.
courseSchema.virtual("reviews", {
  ref: "Review",
  localField: "_id",
  foreignField: "course",
});

// Virtual field for average rating (to be implemented with reviews)
courseSchema.virtual("averageRating").get(function () {
  if (!this.reviews || this.reviews.length === 0) {
    return 0;
  }
  const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
  return (sum / this.reviews.length).toFixed(1); // e.g., 4.3
});


//how to use: when fetching course populate reviews to make the virtual work
//const course = await Course.findById(courseId)
//  .populate("reviews"); // pulls in reviews
//console.log(course.averageRating); auto-calculated


// Update total lectures count when lectures are modified
courseSchema.pre('save', function(next){
    if(this.lectures){
        this.totalLectures = this.lectures.length;
        //amount of lectures

    }
    next();
});

export const Course = mongoose.model("Course", courseSchema);