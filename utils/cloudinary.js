import cloudinary from 'cloudinary';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const deleteCloudinaryImage = async (url) => {
  const publicId = url.split('/').slice(-2).join('/').split('.')[0];
  await cloudinary.v2.uploader.destroy(publicId);
};