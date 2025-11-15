import { Request, Response } from 'express';
import { UserService } from '../services/index';

// Controller function to get user details
export const getUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.params.id;
        const user = await UserService.fetchUserData(userId);
        if (!user) {
            res.status(404).send({ message: 'User not found' });
            return;
        }
        res.status(200).send(user);
    } catch (error) {
        res.status(500).send({ message: 'Internal server error', error });
    }
};

// Controller function to create a new user
export const createUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const newUser = req.body;
        const createdUser = await UserService.createUser(newUser);
        res.status(201).send(createdUser);
    } catch (error) {
        res.status(500).send({ message: 'Internal server error', error });
    }
};

// Export all controller functions
export default {
    getUser,
    createUser,
};