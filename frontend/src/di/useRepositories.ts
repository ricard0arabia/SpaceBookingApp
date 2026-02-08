import { inject } from "vue";
import type { RepositoryContainer } from "./RepositoryContainer";

export const useRepositories = () => {
  const repositories = inject<RepositoryContainer>("repositories");
  if (!repositories) {
    throw new Error("RepositoryContainer not provided");
  }
  return repositories;
};
