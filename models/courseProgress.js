import mongoose from "mongoose";

const lectureProgressSchema = new mongoose.Schema({
    lecture: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lecture',
        required: [true, 'Lecture reference is required']
    },
    isCompleted: {
        type: Boolean,
        default: false
    }, //lecture completed or not
    watchTime: {
        type: Number,
        default: 0
    },
    lastWatched: {
        type: Date,
        default: Date.now
    } //when was the lecture last watched
});

const courseProgressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required']
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: [true, 'Course reference is required']
    }, //what course is it

    isCompleted: {
        type: Boolean,
        default: false
    },
    completionPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    lectureProgress: [lectureProgressSchema],
    //how much of each lecture have you watched
    //can be array but we already made a docobject of it above


    lastAccessed: {
        type: Date,
        default: Date.now
    } //WHEN DID user last OPEN THE COURSE
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// calculate completion percentage before saving
courseProgressSchema.pre('save', async function(next) {
    if (this.lectureProgress.length > 0) { //if there even any progress
        const completedLectures = this.lectureProgress.filter(lp => lp.isCompleted).length;
        //how many lectures are completed filtered
        this.completionPercentage = Math.round((completedLectures / this.lectureProgress.length) * 100);
        //all lectures against lecture progress
        this.isCompleted = this.completionPercentage === 100;
    }
    next();
});

// Update last accessed
courseProgressSchema.methods.updateLastAccessed = function() {
    this.lastAccessed = Date.now();
    return this.save({ validateBeforeSave: false });
};

export const CourseProgress = mongoose.model('CourseProgress', courseProgressSchema);