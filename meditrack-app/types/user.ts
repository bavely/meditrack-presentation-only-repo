export interface LocalUser {
  id: string
  aud: string
  role: string
  email: string
  name: string
  phoneNumber: string
  emailVerified: boolean
  phoneVerified: boolean
  bedTime?: string | null
  breakfastTime?: string | null
  lunchTime?: string | null
  dinnerTime?: string | null
  exerciseTime?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateUserInput {
  email: string
  password: string
  name?: string
  phoneNumber?: string
  gender?: string
  dob?: Date
  bedTime?: string | Date | null
  breakfastTime?: string | Date | null
  lunchTime?: string | Date | null
  dinnerTime?: string | Date | null
  exerciseTime?: string | Date | null
}
