import { supabase } from './supabase'

export class StorageService {
  static async uploadAvatar(userId: string, file: File): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}` // Use a folder structure

      console.log('🔵 Uploading avatar:', { fileName, filePath, fileSize: file.size })

      const { data, error } = await supabase.storage
        .from('picture')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Allow overwriting
        })

      if (error) {
        console.error('🔴 Avatar upload error:', error)
        if (error.message.includes('row-level security policy')) {
          throw new Error('Storage bucket "picture" needs proper RLS policies or should be public.')
        }
        throw new Error(`Failed to upload avatar: ${error.message}`)
      }

      console.log('🟢 Avatar uploaded successfully:', data)

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('picture')
        .getPublicUrl(filePath)

      console.log('🔵 Generated public URL:', urlData.publicUrl)
      
      return urlData.publicUrl
    } catch (error) {
      console.error('🔴 Storage error:', error)
      throw new Error('Failed to upload avatar. Please try again.')
    }
  }

  static async deleteAvatar(avatarUrl: string): Promise<void> {
    try {
      // Extract the file path from the URL
      const url = new URL(avatarUrl)
      const pathParts = url.pathname.split('/')
      const bucketName = pathParts[pathParts.length - 2] // Get bucket name
      const fileName = pathParts[pathParts.length - 1] // Get filename
      const filePath = `avatars/${fileName}` // Reconstruct path

      console.log('🔵 Deleting avatar:', { bucketName, fileName, filePath })

      const { error } = await supabase.storage
        .from('picture')
        .remove([filePath])

      if (error) {
        console.warn('Failed to delete old avatar:', error)
        // Don't throw error as this is not critical
      } else {
        console.log('🟢 Avatar deleted successfully')
      }
    } catch (error) {
      console.warn('Failed to parse avatar URL for deletion:', error)
    }
  }

  static validateImageFile(file: File): string | null {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return 'Please select an image file'
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      return 'Image must be smaller than 5MB'
    }

    // Check supported formats
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!supportedTypes.includes(file.type)) {
      return 'Please use JPEG, PNG, or WebP format'
    }

    return null // No error
  }

  static async ensureBucketExists(): Promise<void> {
    try {
      // Check if bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets()
      
      if (listError) {
        console.error('🔴 Error listing buckets:', listError)
        console.warn('⚠️ Cannot access storage buckets. This is normal if RLS is enabled.')
        // Don't throw error, just return - the app should work without storage
        return
      }

      const bucketExists = buckets?.some(bucket => bucket.name === 'picture')
      
      if (!bucketExists) {
        console.log('🔵 Picture bucket not found in list. This might be due to RLS policies.')
        console.log('📋 If you need avatar uploads, ensure the "picture" bucket exists and is public.')
        // Don't throw error, just log the info
        return
      } else {
        console.log('✅ Picture bucket exists and is accessible')
      }
    } catch (error) {
      console.warn('⚠️ Storage bucket check failed:', error)
      // Don't throw error, just log warning
    }
  }

  static async createAvatarsBucket(): Promise<void> {
    try {
      await this.ensureBucketExists()
    } catch (error) {
      console.warn('Bucket creation warning:', error)
      // Don't throw error here as this is called on component mount
      // The app should continue to work even if storage is not available
    }
  }
}