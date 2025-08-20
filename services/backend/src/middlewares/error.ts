import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error(err.stack);
  
  // Handle Joi validation errors
  if (err instanceof Joi.ValidationError) {
    const errorMessages = err.details.map(detail => detail.message);
    res.status(400).json({ 
      message: errorMessages.join(', '),
      errors: err.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
    return;
  }
  
  // Handle other known errors
  if (err.name === 'PrismaClientKnownRequestError') {
    res.status(400).json({ 
      message: 'Database operation failed. Please check your input and try again.' 
    });
    return;
  }
  
  if (err.name === 'PrismaClientValidationError') {
    res.status(400).json({ 
      message: 'Invalid data provided. Please check your input and try again.' 
    });
    return;
  }
  
  // Default error response
  res.status(500).json({ 
    message: 'Internal server error. Please try again later.' 
  });
}; 