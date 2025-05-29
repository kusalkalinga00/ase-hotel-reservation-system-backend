import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class UsersService {
  private users = [
    { id: 1, name: 'John Doe', role: 'CUSTOMER' },
    { id: 2, name: 'Jane Smith', role: 'MANAGER' },
    { id: 3, name: 'Alice Johnson', role: 'CLERK' },
    { id: 4, name: 'Bob Brown', role: 'CUSTOMER' },
    { id: 5, name: 'Charlie White', role: 'CUSTOMER' },
  ];

  findAll(role?: 'CUSTOMER' | 'MANAGER' | 'CLERK') {
    if (role) {
      const roleArray = this.users.filter((user) => user.role === role);

      if (roleArray.length === 0) {
        throw new NotFoundException(`No users found with role`);
      }

      return roleArray;
    } else {
      return this.users;
    }
  }

  findOne(id: number) {
    const user = this.users.find((user) => user.id === id);

    if (!user) {
      throw new NotFoundException(`User not found`);
    }

    return user;
  }

  create(user: CreateUserDto) {
    const newUser = {
      id: this.users.length + 1,
      ...user,
    };
    this.users.push(newUser);
    return newUser;
  }

  update(id: number, updatedUser: UpdateUserDto) {
    const userIndex = this.users.findIndex((user) => user.id === id);
    if (userIndex > -1) {
      this.users[userIndex] = { ...this.users[userIndex], ...updatedUser };
      return this.users[userIndex];
    }
    return null;
  }

  delete(id: number) {
    const userIndex = this.users.findIndex((user) => user.id === id);
    if (userIndex > -1) {
      const deletedUser = this.users[userIndex];
      this.users.splice(userIndex, 1);
      return deletedUser;
    }
    return null;
  }
}
