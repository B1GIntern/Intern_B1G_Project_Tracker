import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directories exist on server start
const ensureDir = (dir: string) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};
ensureDir('uploads/avatars');
ensureDir('uploads/task-attachments');

// Saves task attachment files to uploads/task-attachments/ with unique filenames
const attachmentStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, 'uploads/task-attachments/'),
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${path.extname(file.originalname)}`);
    },
});

// Saves avatar files to uploads/avatars/ with unique filenames
const avatarStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, 'uploads/avatars/'),
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${path.extname(file.originalname)}`);
    },
});

// Use uploadAttachment.single('file') for task attachment routes
export const uploadAttachment = multer({ storage: attachmentStorage });

// Use uploadAvatar.single('avatar') for profile avatar routes
export const uploadAvatar = multer({ storage: avatarStorage });