
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { BCRYPT_SALT_ROUNDS } from '../common/constants';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findOne(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async create(createUserDto: CreateUserDto): Promise<User> {
        const { email, password, gymName } = createUserDto;
        const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

        return this.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                gymName,
            },
        });
    }
}
