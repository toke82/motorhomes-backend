import { body, ValidationChain } from 'express-validator';

//Validation for registration
export const registerValidation: ValidationChain[] = [
    body('email')
        .isEmail()
        .withMessage('Must be a valid email')
        .normalizeEmail(),

    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

    body('firstName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters'),

    body('lasName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 60 characters'),
];

//Validation for login
export const loginValidation: ValidationChain[] = [
    body('email')
        .isEmail()
        .withMessage('Must be a valid email')
        .normalizeEmail(),

    body('password')
        .notEmpty()
        .withMessage('Password is required'),
];

//Validation for password change
export const changePasswordValidation: ValidationChain[] = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),

    body('newPassword')
        .isLength({ min: 8 })
        .withMessage('New password must be at least 8 charactes long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
];

//Validation for refresh token
export const refreshTokenValidation: ValidationChain[] = [
    body('refreshToken')
        .notEmpty()
        .withMessage('Refresh token is required'),
];

//Validation to update user
export const updateUserValidation: ValidationChain[] = [
    body('firstName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters'),

    body('lastName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters'),

    body('role')
        .optional()
        .isIn(['USER', 'ADMIN', 'MODERATOR'])
        .withMessage('Role must be USER, ADMIN, MODERATOR'),

    body('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean'),
];