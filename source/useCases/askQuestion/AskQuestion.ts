import OpenAI from "openai";
import { ModelType } from "../../domain/Enums/ModelType";
import { TokenType } from "../../domain/Enums/TokenType";
import RepositoryFactoryInterface from "../../domain/Interfaces/RepositoryFactoryInterface";
import TokenRepositoryInterface from "../../domain/Interfaces/TokenRepositoryInterface";
import { extractPdfText } from "../../domain/Services/extractTextFromPDF";
import AskQuestionInput from "./AskQuestionInput";
import AskQuestionOutput from "./AskQuestionOutput";
import EmbeddingService from "../../domain/Services/EmbeddingService";
import ChunkService from "../../domain/Services/ChunkService";
import { systemPrompts } from "../../domain/Enums/SystemPrompts";
import OpenAIChatService from "../../domain/Services/OpenAIChatService";
import ChatHistoryService from "../../domain/Services/ChatHistoryService";
import removeStopwordsService from "../../domain/Services/removeStopwordsService";

export default class AskQuestion {
    private repositoryFactory: RepositoryFactoryInterface;
    readonly tokenRepository: TokenRepositoryInterface;
    private embeddingService: EmbeddingService;
    private chunkService: ChunkService;
    private chatService: OpenAIChatService;
    private chatHistoryService: ChatHistoryService;

    constructor(
        repositoryFactory: RepositoryFactoryInterface,
        embeddingService?: EmbeddingService,
        chunkService?: ChunkService,
        chatService?: OpenAIChatService,
        chatHistoryService?: ChatHistoryService
    ) {
        this.repositoryFactory = repositoryFactory;
        this.tokenRepository = repositoryFactory.createTokenRepository();
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        this.embeddingService = embeddingService || new EmbeddingService(this.repositoryFactory, openai);
        this.chunkService = chunkService || new ChunkService(this.repositoryFactory);
        this.chatHistoryService = chatHistoryService || new ChatHistoryService(this.repositoryFactory);
        this.chatService = chatService || new OpenAIChatService(this.repositoryFactory, this.chatHistoryService, openai);
    }

    async execute(input: AskQuestionInput): Promise<AskQuestionOutput> {
        if (!input.question) throw new Error("O campo pergunta é obrigatório.");
        let question = await removeStopwordsService(input.question, "porBr");
        let fileText = "";
        if (input.file) {
            const file = input.file as Express.Multer.File;
            if (file.mimetype !== "application/pdf")
                throw new Error("Formato inválido. Apenas PDF é aceito.");
            if (file.size > 1_000_000)
                throw new Error("O arquivo PDF deve ter menos de 1MB.");
            fileText = await extractPdfText(file);
            fileText = await removeStopwordsService(fileText, "porBr");
        }

        const combinedText = [fileText, question].filter(Boolean).join(" ");
        const queryEmbedding = await this.embeddingService.createEmbedding(combinedText, ModelType.PROMPT_MODEL, TokenType.INPUT);
        const topChunks = await this.chunkService.findRelevantChunks(queryEmbedding);
        const systemPrompt = systemPrompts[input.mentorType];
        const userPrompt = `
            Contexto:
            ${topChunks.map(c => c.chunk).join("\n\n")}

            Pergunta:
            ${question}
        `;

        let conversation;
        if (input.conversationId) {
            conversation = await this.chatHistoryService.getConversationById(input.conversationId);
            if (!conversation) throw new Error("Conversa não encontrada.");
        } else {
            conversation = await this.chatHistoryService.createConversation(input.userId, `Pergunta de ${input.userId}`);
        }

        const answer = await this.chatService.chatWithConversation(conversation, ModelType.PROMPT_MODEL, systemPrompt, userPrompt);

        return { answer, conversationId: conversation.id };
    }
}
