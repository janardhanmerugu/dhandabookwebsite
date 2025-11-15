// src/types/index.ts

// Define the structure of a User object
export interface User {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
}

// Define the structure of a Response object for API responses
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

// Define the structure of a request payload for creating a new user
export interface CreateUserRequest {
    name: string;
    email: string;
}

// Define the structure of a request payload for updating user information
export interface UpdateUserRequest {
    id: string;
    name?: string;
    email?: string;
}