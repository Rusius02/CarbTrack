export class StateRepository {
  load() {
    throw new Error("StateRepository.load() doit être implémenté par un adaptateur.");
  }

  save() {
    throw new Error("StateRepository.save() doit être implémenté par un adaptateur.");
  }
}
