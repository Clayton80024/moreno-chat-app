"use client"

import { useState } from 'react'

interface AvatarProps {
  src?: string | null
  alt: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  fallbackText?: string
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl'
}

export default function Avatar({ 
  src, 
  alt, 
  size = 'md', 
  className = '', 
  fallbackText 
}: AvatarProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  // If no src or image failed to load, show fallback
  if (!src || imageError) {
    const initials = fallbackText || alt.charAt(0).toUpperCase()
    return (
      <div className={`
        ${sizeClasses[size]} 
        bg-gradient-to-br from-primary-400 to-accent-400 
        rounded-full flex items-center justify-center text-white font-bold 
        border-2 border-white shadow-md
        ${className}
      `}>
        {initials}
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {!imageLoaded && (
        <div className={`
          ${sizeClasses[size]} 
          bg-gradient-to-br from-primary-400 to-accent-400 
          rounded-full flex items-center justify-center text-white font-bold 
          border-2 border-white shadow-md absolute inset-0
        `}>
          {fallbackText || alt.charAt(0).toUpperCase()}
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`
          ${sizeClasses[size]} 
          rounded-full object-cover border-2 border-white shadow-md
          ${imageLoaded ? 'opacity-100' : 'opacity-0'}
          transition-opacity duration-200
        `}
        onLoad={() => {
          setImageLoaded(true)
          console.log('🟢 Avatar loaded successfully:', src)
        }}
        onError={(e) => {
          console.error('🔴 Failed to load avatar:', src)
          setImageError(true)
        }}
      />
    </div>
  )
}

