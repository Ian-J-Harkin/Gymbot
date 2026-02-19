import {
    Controller,
    Post,
    Get,
    Delete,
    Param,
    UseInterceptors,
    UploadedFile,
    UseGuards,
    ParseFilePipe,
    MaxFileSizeValidator,
    FileTypeValidator,
    HttpException,
    HttpStatus,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { KnowledgeBaseService } from './knowledge-base.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { MAX_FILE_SIZE_BYTES, ALLOWED_MIME_TYPES } from '../common/constants';

@Controller('knowledge-base')
@UseGuards(JwtAuthGuard)
export class KnowledgeBaseController {
    constructor(private readonly kbService: KnowledgeBaseService) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(
        @CurrentUserId() userId: string,
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE_BYTES }),
                ],
            }),
        )
        file: Express.Multer.File,
    ) {
        // Validate MIME type in addition to file extension
        const fileExt = file.originalname.split('.').pop()?.toLowerCase();
        const allowedMimes = fileExt ? ALLOWED_MIME_TYPES[fileExt] : undefined;

        if (!allowedMimes || !allowedMimes.includes(file.mimetype)) {
            throw new BadRequestException(
                `Invalid file type. Allowed: ${Object.keys(ALLOWED_MIME_TYPES).join(', ')}`,
            );
        }

        try {
            return await this.kbService.processFile(userId, file);
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }

    @Get()
    async getDocuments(@CurrentUserId() userId: string) {
        return await this.kbService.getDocuments(userId);
    }

    @Delete(':id')
    async deleteDocument(@CurrentUserId() userId: string, @Param('id') id: string) {
        try {
            return await this.kbService.deleteDocument(userId, id);
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.NOT_FOUND);
        }
    }
}

