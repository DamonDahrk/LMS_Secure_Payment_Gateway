import multer from "multer";

const upload = multer({dest:"uploads/"});
//the destination

export default upload
