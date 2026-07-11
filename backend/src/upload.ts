import multer from 'multer'
import path from 'path'
import crypto from 'crypto'
import fs from 'fs'

const uploadDir = path.join(__dirname, '../public/images/uploads')

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    // Generate random filename to prevent collisions and path traversal
    const ext = path.extname(file.originalname)
    const randomName = crypto.randomBytes(16).toString('hex')
    cb(null, `${randomName}${ext}`)
  }
})

export const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only images are allowed'))
    }
    cb(null, true)
  }
})
