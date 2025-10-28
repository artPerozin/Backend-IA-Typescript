
import RepositoryFactoryInterface from "../../domain/Interfaces/RepositoryFactoryInterface";
import CreateFeedback from "../../useCases/createFeedback/CreateFeedback";
import CreateFeedbackInput from "../../useCases/createFeedback/CreateFeedbackInput";

export default class FeedbackController {

    constructor(protected repositoryFactory: RepositoryFactoryInterface) {
    }

    async createFeedback(input: CreateFeedbackInput): Promise<void> {
        const createFeedback = new CreateFeedback(this.repositoryFactory);
        return await createFeedback.execute(input);
    }

}