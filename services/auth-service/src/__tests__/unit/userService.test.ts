import { UserService } from '../../services/userService';
import prisma from '../../db/prisma';

describe('UserService - Unit Tests', () => {
    let userService: UserService;

    beforeEach(() => {
        userService = new UserService();
    });

    describe('getAllUsers', () => {
        it('should return paginated user', async () => {
            const mockUsers = [
                {
                    id: 'user-1',
                    email: 'user1@example.com',
                    firstName: 'User',
                    lastName: 'One',
                    role: 'USER',
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 'user-2',
                    email: 'user2@example.com',
                    firsName: 'User',
                    lastName: 'Two',
                    role: 'USER',
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
            (prisma.user.count as jest.Mock).mockResolvedValue(25);

            const result = await userService.getAllUsers(1, 10);

            expect(result.users).toEqual(mockUsers);
            expect(result.pagination).toEqual({
                page: 1,
                limit: 10,
                total: 25,
                totalPages: 3,
            });
        });

        it('should calculate correct skip for pagination', async () => {
            (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
            (prisma.user.count as jest.Mock).mockResolvedValue(0);

            await userService.getAllUsers(2, 10);

            expect(prisma.user.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    skip: 20, // (3-1) * 10
                    take: 10,
                })
            );
        });
    });

    describe('getUserById', () => {
        it('should return user by id', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                firstName: 'Test',
                lastName: 'User',
                role: 'USER',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

            const result = await userService.getUserById('user-123');

            expect(result).toEqual(mockUser);
            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { id: 'user-123' },
                select: expect.any(Object),
            });
        });

        it('should throw error if user not found', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(userService.getUserById('invalid-id')).rejects.toThrow(
                'User not found'
            );
        });
    });

    describe('updateUser', () => {
        it('should update user successfully', async () => {
            const existingUser = {
                id: 'user-123',
                email: 'test@example.com',
            };

            const updatedUser = {
                id: 'user-123',
                email: 'test@example.com',
                firstName: 'Updated',
                lastName: 'Name',
                role: 'ADMIN',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);
            (prisma.user.update as jest.Mock).mockResolvedValue(updatedUser);

            const updateData = {
                firsName: 'Updated',
                lastName: 'Name',
                role: 'ADMIN',
            };

            const result = await userService.updateUser('user-123', updateData);
            
            expect(result).toEqual(updatedUser);
            expect(prisma.user.update).toHaveBeenCalled();
        });

        it('should throw error if user not found', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(
                userService.updateUser('invalid-id', { firstName: 'Test' })
            ).rejects.toThrow('User not found');
        });

        it('should only update provided fields', async () => {
            const existingUser = {
                id: 'user-123',
                email: 'test@example.com',
            };

            (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);
            (prisma.user.update as jest.Mock).mockResolvedValue({});

            await userService.updateUser('user-123', { firstName: 'NewName' });

            const updateCall = (prisma.user.update as jest.Mock).mock.calls[0][0];
            expect(updateCall.data).toHaveProperty('firstName', 'NewName');
            expect(updateCall.data).not.toHaveProperty('lastName');
            expect(updateCall.data).not.toHaveProperty('isActive');
        });
    });

    describe('deleteUser', () => {
        it('should deactivate user (soft delete)', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
            };

            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            (prisma.user.update as jest.Mock).mockResolvedValue({});
            (prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({ count: 2 });

            await userService.deleteUser('user-123');

            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: 'user-123' },
                data: { isActive: false },
            });
            expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
                where: { userId: 'user-123' },
            });
        });

        it('should throw error if user not found', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(userService.deleteUser('invalid-id')).rejects.toThrow(
                'User not found'
            );
        });
    });
});