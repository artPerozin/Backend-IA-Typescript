import RepositoryFactoryInterface from "../../domain/Interfaces/RepositoryFactoryInterface";
import UserRepositoryInterface from "../../domain/Interfaces/UserRepositoryInterface";
import UserRepositoryMemory from "./memory/UserRepositoryMemory";

export default class MemoryRepositoryFactory implements RepositoryFactoryInterface {

    readonly userRepository: UserRepositoryInterface;

    constructor() {
        this.userRepository = new UserRepositoryMemory();
    }

    createUserRepository(): UserRepositoryInterface {
        return this.userRepository;
    }
}