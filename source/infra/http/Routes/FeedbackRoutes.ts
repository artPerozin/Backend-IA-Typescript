import RepositoryFactory from "../../../domain/Interfaces/RepositoryFactoryInterface";
import FeedbackController from "../../controller/FeedbackController";
import UserController from "../../controller/UserController";
import Http from "../Http";
import ModelRoutes from "./ModelRoutes";

export default class FeedbackRoutes implements ModelRoutes {

    protected feedbackController: FeedbackController;

    constructor(readonly http: Http, repositoryFactory: RepositoryFactory) {
        this.feedbackController = new FeedbackController(repositoryFactory);
    }

    init(): void {
        this.http.route("post", "/feedback/create", false, async (params: any, body: any) => {
            return await this.feedbackController.createFeedback(body);
        });
    }
}