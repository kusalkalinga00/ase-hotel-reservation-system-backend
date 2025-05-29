import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  ValidationPipe,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { ApiBody, ApiQuery } from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  /*
    GET /users
    POST /users/:id
    PATCH /users/:id
    DELETE /users/:id
    */

  constructor(private readonly usersService: UsersService) {}

  @Get() // GET /users or GET /users?role=value
  @ApiQuery({
    name: 'role',
    required: false,
    enum: ['CUSTOMER', 'MANAGER', 'CLERK'],
    description: 'Filter users by role or return all users if not provided',
  })
  findAll(
    @Query('role') role?: string, // Optional query parameter
  ) {
    return this.usersService.findAll(
      role ? (role as 'CUSTOMER' | 'MANAGER' | 'CLERK') : undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Post()
  @ApiBody({
    description: 'Create user payload',
    type: CreateUserDto,
    examples: {
      example1: {
        summary: 'Sample user',
        value: {
          username: 'john_doe',
          email: 'john@example.com',
          role: 'CUSTOMER',
        },
      },
    },
  })
  create(
    @Body(ValidationPipe)
    createUserDTO: CreateUserDto,
  ) {
    return this.usersService.create(createUserDTO);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe)
    updateUserDTO: UpdateUserDto, // Use UpdateUserDto for partial updates
  ) {
    return this.usersService.update(id, updateUserDTO);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.delete(id);
  }
}
