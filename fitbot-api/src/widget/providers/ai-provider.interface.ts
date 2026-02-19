import { Configuration } from '@prisma/client';
import { WidgetHistoryItem } from '../widget.service';

export interface AiProvider {
    generateResponse(configuration: Configuration, messages: WidgetHistoryItem[]): AsyncGenerator<string>;
}
