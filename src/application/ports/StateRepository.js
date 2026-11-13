export class StateRepository {
  async load() {
    throw new Error("StateRepository.load() doit être implémenté par un adaptateur.");
  }

  async save() {
    throw new Error("StateRepository.save() doit être implémenté par un adaptateur.");
  }
}
