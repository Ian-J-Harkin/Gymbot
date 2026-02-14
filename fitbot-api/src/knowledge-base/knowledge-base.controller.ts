import {
    Controller,
    Post,
    Get,
    Delete,
    Param,
    UseInterceptors,
    UploadedFile,
    UseGuards,
    Req,
    ParseFilePipe,
    MaxFileSizeValidator,
    FileTypeValidator,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { KnowledgeBaseService } from './knowledge-base.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('knowledge-base')
@UseGuards(JwtAuthGuard)
export class KnowledgeBaseController {
    constructor(private readonly kbService: KnowledgeBaseService) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(
        @Req() req: any,
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // 5MB
                ],
            }),
        )
        file: Express.Multer.File,
    ) {
        try {
            const userId = req.user.id || req.user.userId;
            return await this.kbService.processFile(userId, file);
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }

    @Get()
    async getDocuments(@Req() req: any) {
        const userId = req.user.id || req.user.userId;
        return await this.kbService.getDocuments(userId);
    }

    @Delete(':id')
    async deleteDocument(@Req() req: any, @Param('id') id: string) {
        try {
            const userId = req.user.id || req.user.userId;
            return await this.kbService.deleteDocument(userId, id);
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.NOT_FOUND);
        }
    }
}
