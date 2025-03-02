
import { createClient } from '@supabase/supabase-js';

// Get the Supabase URL and key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://pakmcaxaxyvhjdddfpdh.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBha21jYXhheHl2aGpkZGRmcGRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2ODg1NjksImV4cCI6MjA1NjI2NDU2OX0.00F3C-SjlKk2mBtvw-Zfa74ykFLgnVFpRwoJlUvBKSc";

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Define Profile type based on the database schema
export type Profile = {
  id: string;
  username?: string;
  created_at?: string;
  email?: string;
  first_name?: string;
  avatar_url?: string;
  updated_at?: string;
};

// AppUser type for our simplified user representation
export type AppUser = {
  id: string;
  email?: string;
  username?: string;
  avatar_url?: string;
};

// Define image generation settings types for better type checking
export type ImageQualityType = 'standard' | 'hd';
export type ImageStyleType = 'vivid' | 'natural';
export type ImageSizeType = '1024x1024' | '1024x1792' | '1792x1024';

export type ImageQualitySettings = {
  quality: ImageQualityType;
  style: ImageStyleType;
  size: ImageSizeType;
};

export type ImageGenerationSettings = {
  base_style: string;
  quality_settings: ImageQualitySettings;
};

// Default image quality settings that match our database defaults
export const DEFAULT_IMAGE_QUALITY_SETTINGS: ImageQualitySettings = {
  quality: 'hd',
  style: 'vivid',
  size: '1024x1024'
};

// Helper function to validate and fix image quality settings
export const validateImageQualitySettings = (settings?: Partial<ImageQualitySettings>): ImageQualitySettings => {
  if (!settings) return DEFAULT_IMAGE_QUALITY_SETTINGS;
  
  const validQuality = ['standard', 'hd'].includes(settings.quality || '') 
    ? settings.quality as ImageQualityType
    : DEFAULT_IMAGE_QUALITY_SETTINGS.quality;
    
  const validStyle = ['vivid', 'natural'].includes(settings.style || '')
    ? settings.style as ImageStyleType
    : DEFAULT_IMAGE_QUALITY_SETTINGS.style;
    
  const validSize = ['1024x1024', '1024x1792', '1792x1024'].includes(settings.size || '')
    ? settings.size as ImageSizeType
    : DEFAULT_IMAGE_QUALITY_SETTINGS.size;
    
  return {
    quality: validQuality,
    style: validStyle,
    size: validSize
  };
};
